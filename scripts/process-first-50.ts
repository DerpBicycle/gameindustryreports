#!/usr/bin/env tsx
/**
 * Process First 50 Documents
 *
 * Processes the first 50 documents from documents.json with enhanced AI analysis
 * and saves results back to documents.json after each batch of 10.
 */

import fs from 'fs/promises';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import pdf from 'pdf-parse';
import crypto from 'crypto';
import { ENHANCED_TAXONOMY } from '../src/config/taxonomy';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

interface Document {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  category: string;
  uploadDate: string;
  processingStatus: string;
  processedDate?: string;
  metadata: {
    source?: string;
    year?: number;
    quarter?: string;
    region?: string;
    tags?: string[];
    description?: string;
  };
  aiAnalysis?: any;
}

interface ProcessingResult {
  succeeded: number;
  failed: number;
  errors: Array<{ title: string; error: string }>;
  samples: Array<{ title: string; analysis: any }>;
}

/**
 * Extract text from PDF
 */
async function extractPDFText(filePath: string): Promise<{ text: string; pageCount: number }> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return {
      text: data.text,
      pageCount: data.numpages
    };
  } catch (error) {
    throw new Error(`Failed to extract PDF text: ${error}`);
  }
}

/**
 * Assess document characteristics
 */
function assessDocumentCharacteristics(text: string, pageCount: number): {
  textQuality: 'excellent' | 'good' | 'fair' | 'poor';
  estimatedDataIntensity: 'very_high' | 'high' | 'medium' | 'low';
} {
  const textLength = text.length;
  const textPerPage = textLength / pageCount;

  let textQuality: 'excellent' | 'good' | 'fair' | 'poor';
  if (textPerPage > 1500) {
    textQuality = 'excellent';
  } else if (textPerPage > 800) {
    textQuality = 'good';
  } else if (textPerPage > 300) {
    textQuality = 'fair';
  } else {
    textQuality = 'poor';
  }

  const metricPatterns = text.match(/\d+[\d,.]*\s*(?:%|billion|million|thousand|\$|users|players)/gi) || [];
  let estimatedDataIntensity: 'very_high' | 'high' | 'medium' | 'low';
  if (metricPatterns.length > 100) {
    estimatedDataIntensity = 'very_high';
  } else if (metricPatterns.length > 50) {
    estimatedDataIntensity = 'high';
  } else if (metricPatterns.length > 20) {
    estimatedDataIntensity = 'medium';
  } else {
    estimatedDataIntensity = 'low';
  }

  return { textQuality, estimatedDataIntensity };
}

/**
 * Analyze with Claude API
 */
async function analyzeWithClaude(
  text: string,
  document: Document,
  anthropic: Anthropic
): Promise<any> {
  const textSample = text.substring(0, 80000);

  const analysisPrompt = `You are analyzing a game industry report. Provide a comprehensive, structured analysis.

Document Title: ${document.title}
Category: ${document.category}
Source: ${document.metadata.source || 'Unknown'}
Year: ${document.metadata.year || 'Unknown'}

TAXONOMY FOR CLASSIFICATION:
Report Types: ${ENHANCED_TAXONOMY.reportTypes.join(', ')}
Content Focus Areas: ${ENHANCED_TAXONOMY.contentFocus.join(', ')}
Geographic Scopes: ${ENHANCED_TAXONOMY.geographicScope.join(', ')}
Temporal Nature: ${ENHANCED_TAXONOMY.temporalNature.join(', ')}
Data Characteristics: ${ENHANCED_TAXONOMY.dataCharacteristics.join(', ')}

Analyze the following document excerpt:

${textSample}

Provide your analysis in this JSON format:
{
  "reportType": "string (choose from taxonomy)",
  "contentFocus": ["array of strings (choose from taxonomy)"],
  "geographicScope": "string (choose from taxonomy)",
  "temporalNature": ["array of strings (choose from taxonomy)"],
  "dataCharacteristics": "string (choose from taxonomy)",
  "targetAudience": ["array of strings"],

  "summary": "2-3 paragraph executive summary focusing on key insights and findings",

  "keyFindings": [
    "Finding 1",
    "Finding 2",
    "Finding 3",
    "Finding 4",
    "Finding 5"
  ],

  "keyInsights": [
    "Actionable insight 1",
    "Actionable insight 2",
    "Actionable insight 3",
    "Actionable insight 4",
    "Actionable insight 5"
  ],

  "topics": ["topic1", "topic2", "topic3", "topic4", "topic5"],

  "extractedMetrics": [
    {
      "value": "31.7M",
      "context": "paying cloud gaming users globally",
      "unit": "users",
      "timeframe": "2022",
      "region": "Global"
    }
  ],

  "extractedEntities": {
    "companies": ["Company1", "Company2"],
    "games": ["Game1", "Game2"],
    "technologies": ["Tech1", "Tech2"],
    "regions": ["Region1", "Region2"],
    "genres": ["Genre1", "Genre2"],
    "platforms": ["Platform1", "Platform2"],
    "businessModels": ["Model1", "Model2"]
  },

  "methodology": "Brief description of research methodology if mentioned",

  "sentiment": "positive/neutral/negative",
  "confidence": 0.85
}

Focus on extracting concrete data points, metrics, and insights. Be precise and comprehensive.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: analysisPrompt
      }
    ]
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Process a single document
 */
async function processDocument(
  document: Document,
  anthropic: Anthropic,
  index: number,
  total: number
): Promise<Document> {
  log(`\n[${ index + 1}/${total}] Processing: ${document.title}`, colors.cyan);

  try {
    // Build full path - PDFs are in the project root, not in public/reports
    const fullPath = path.join(process.cwd(), document.filePath);

    log(`  └─ Extracting PDF text...`, colors.gray);
    const { text, pageCount } = await extractPDFText(fullPath);

    log(`  └─ Pages: ${pageCount}, Text length: ${text.length} chars`, colors.gray);

    const characteristics = assessDocumentCharacteristics(text, pageCount);
    log(`  └─ Text quality: ${characteristics.textQuality}, Data intensity: ${characteristics.estimatedDataIntensity}`, colors.gray);

    log(`  └─ Analyzing with Claude AI...`, colors.gray);
    const analysis = await analyzeWithClaude(text, document, anthropic);

    // Update document with analysis
    const updatedDocument: Document = {
      ...document,
      processingStatus: 'completed',
      processedDate: new Date().toISOString(),
      aiAnalysis: {
        ...analysis,
        pageCount,
        dataQuality: {
          textExtractionQuality: characteristics.textQuality,
          dataCompleteness: Math.min(1, (analysis.extractedMetrics?.length || 0) / 20 + 0.5),
          confidence: analysis.confidence || 0.75,
          processingNotes: [
            `Text quality: ${characteristics.textQuality}`,
            `Data intensity: ${characteristics.estimatedDataIntensity}`
          ]
        }
      }
    };

    log(`  └─ ✓ Success`, colors.green);
    return updatedDocument;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`  └─ ✗ Failed: ${errorMessage}`, colors.red);

    return {
      ...document,
      processingStatus: 'failed',
      processedDate: new Date().toISOString()
    };
  }
}

/**
 * Save documents to JSON file
 */
async function saveDocuments(documents: Document[], filePath: string): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(documents, null, 2), 'utf-8');
  log(`  └─ Saved ${documents.length} documents to ${filePath}`, colors.gray);
}

/**
 * Main processing function
 */
async function main() {
  log('\n' + '='.repeat(70), colors.bright);
  log('Process First 50 Documents with Enhanced AI Analysis', colors.bright + colors.cyan);
  log('='.repeat(70) + '\n', colors.bright);

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-api-key-here') {
    log('❌ Error: ANTHROPIC_API_KEY environment variable is not set', colors.red);
    log('\nTo process documents, you need to:', colors.yellow);
    log('  1. Get an API key from: https://console.anthropic.com/', colors.yellow);
    log('  2. Add it to .env.local file:', colors.yellow);
    log('     ANTHROPIC_API_KEY=sk-ant-...', colors.gray);
    log('  3. Run this script again\n', colors.yellow);

    log('Setup Requirements:', colors.bright);
    log('  • Anthropic API key (Claude API access)', colors.gray);
    log('  • Estimated cost: ~$0.10-0.15 per document', colors.gray);
    log('  • For 50 documents: ~$5-7.50 total', colors.gray);
    log('  • Processing time: ~2-3 minutes per document\n', colors.gray);

    process.exit(1);
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  try {
    // Read documents.json
    const documentsPath = path.join(process.cwd(), 'data', 'documents.json');
    log('📚 Reading documents.json...', colors.cyan);

    const fileContent = await fs.readFile(documentsPath, 'utf-8');
    const allDocuments: Document[] = JSON.parse(fileContent);

    log(`✓ Found ${allDocuments.length} total documents`, colors.green);

    // Take first 50
    const documentsToProcess = allDocuments.slice(0, 50);
    log(`📋 Selected first 50 documents for processing\n`, colors.cyan);

    // Initialize results
    const result: ProcessingResult = {
      succeeded: 0,
      failed: 0,
      errors: [],
      samples: []
    };

    const startTime = Date.now();
    let processedCount = 0;

    // Process in batches of 10
    for (let batchStart = 0; batchStart < documentsToProcess.length; batchStart += 10) {
      const batchEnd = Math.min(batchStart + 10, documentsToProcess.length);
      const batch = documentsToProcess.slice(batchStart, batchEnd);

      log(`\n${'─'.repeat(70)}`, colors.gray);
      log(`Batch ${Math.floor(batchStart / 10) + 1} (documents ${batchStart + 1}-${batchEnd})`, colors.bright);
      log('─'.repeat(70), colors.gray);

      // Process each document in the batch
      for (let i = 0; i < batch.length; i++) {
        const docIndex = batchStart + i;
        const doc = batch[i];

        try {
          const updatedDoc = await processDocument(doc, anthropic, docIndex, documentsToProcess.length);

          // Update in the main array
          allDocuments[docIndex] = updatedDoc;

          if (updatedDoc.processingStatus === 'completed') {
            result.succeeded++;

            // Save first 3 as samples
            if (result.samples.length < 3) {
              result.samples.push({
                title: updatedDoc.title,
                analysis: updatedDoc.aiAnalysis
              });
            }
          } else {
            result.failed++;
            result.errors.push({
              title: doc.title,
              error: 'Processing failed'
            });
          }

          processedCount++;

          // Rate limiting
          if (i < batch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

        } catch (error) {
          result.failed++;
          result.errors.push({
            title: doc.title,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Save after each batch of 10
      log(`\n💾 Saving batch results to documents.json...`, colors.yellow);
      await saveDocuments(allDocuments, documentsPath);
      log(`✓ Batch ${Math.floor(batchStart / 10) + 1} saved successfully\n`, colors.green);
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    // Final results
    log('\n' + '='.repeat(70), colors.bright);
    log('Processing Complete!', colors.bright + colors.green);
    log('='.repeat(70) + '\n', colors.bright);

    log(`✓ Succeeded: ${result.succeeded}`, colors.green);
    log(`✗ Failed: ${result.failed}`, colors.red);
    log(`⏱️  Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`, colors.cyan);
    log(`💰 Estimated cost: $${(result.succeeded * 0.15).toFixed(2)}\n`, colors.cyan);

    // Show errors if any
    if (result.errors.length > 0) {
      log('Failed Documents:', colors.red);
      result.errors.forEach(err => {
        log(`  • ${err.title}`, colors.red);
        log(`    ${err.error}`, colors.gray);
      });
      log('');
    }

    // Show sample analyses
    if (result.samples.length > 0) {
      log('─'.repeat(70), colors.gray);
      log('Sample Enhanced Analyses', colors.bright + colors.cyan);
      log('─'.repeat(70) + '\n', colors.gray);

      result.samples.forEach((sample, idx) => {
        const analysis = sample.analysis;

        log(`${idx + 1}. ${sample.title}`, colors.bright);
        log(`   Report Type: ${analysis.reportType || 'N/A'}`, colors.cyan);
        log(`   Geographic Scope: ${analysis.geographicScope || 'N/A'}`, colors.cyan);

        if (analysis.contentFocus && analysis.contentFocus.length > 0) {
          log(`   Content Focus: ${analysis.contentFocus.slice(0, 2).join(', ')}`, colors.cyan);
        }

        if (analysis.extractedMetrics && analysis.extractedMetrics.length > 0) {
          log(`   Key Metrics: ${analysis.extractedMetrics.length} extracted`, colors.yellow);
          const firstMetric = analysis.extractedMetrics[0];
          log(`     • ${firstMetric.value} - ${firstMetric.context}`, colors.gray);
        }

        if (analysis.keyFindings && analysis.keyFindings.length > 0) {
          log(`   Key Findings:`, colors.yellow);
          analysis.keyFindings.slice(0, 2).forEach((finding: string) => {
            log(`     • ${finding.substring(0, 80)}${finding.length > 80 ? '...' : ''}`, colors.gray);
          });
        }

        if (analysis.dataQuality) {
          log(`   Data Quality: ${analysis.dataQuality.textExtractionQuality} (${Math.round(analysis.dataQuality.confidence * 100)}% confidence)`, colors.cyan);
        }

        log('');
      });
    }

    log('='.repeat(70), colors.bright);
    log('✨ All processing complete! Results saved to documents.json', colors.bright + colors.green);
    log('='.repeat(70) + '\n', colors.bright);

  } catch (error) {
    log('\n❌ Fatal Error:', colors.red);
    log(error instanceof Error ? error.message : 'Unknown error', colors.red);

    if (error instanceof Error && error.stack) {
      log('\nStack trace:', colors.gray);
      log(error.stack, colors.gray);
    }

    process.exit(1);
  }
}

// Run the script
main();
