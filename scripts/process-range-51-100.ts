#!/usr/bin/env tsx
/**
 * Process documents 51-100 with enhanced AI analysis
 *
 * This script specifically processes documents in the range 51-100 from the
 * Game Industry Reports collection using the enhanced AI processor.
 * Works directly with documents.json file (no Supabase required).
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import pdf from 'pdf-parse';
import Anthropic from '@anthropic-ai/sdk';

// Taxonomy for classification
const ENHANCED_TAXONOMY = {
  reportTypes: [
    'Market Research Report',
    'Financial Report',
    'Trend Analysis',
    'Survey Research',
    'Investment Tracking',
    'Performance Analytics',
    'Technical White Paper',
    'Practical Guide'
  ],
  contentFocus: [
    'Market & Industry Analysis',
    'Technology & Innovation',
    'User Behavior & Demographics',
    'Financial & Investment',
    'Marketing & User Acquisition',
    'Workplace & HR',
    'Regional Analysis',
    'Platform Ecosystem',
    'Game Development'
  ],
  geographicScope: [
    'Global',
    'Regional',
    'Country-Specific',
    'Multi-Regional Comparison'
  ],
  temporalNature: [
    'Historical Analysis',
    'Current State',
    'Forward-Looking',
    'Periodic Update'
  ],
  dataCharacteristics: [
    'Heavily Quantitative',
    'Mixed Quant/Qual',
    'Primarily Qualitative',
    'Primary Research',
    'Secondary Research'
  ]
};

const DOCUMENTS_FILE = path.join(process.cwd(), 'data', 'documents.json');
const START_INDEX = 50; // Array is 0-indexed, so index 50 is document 51
const END_INDEX = 100; // Process up to index 99 (document 100)
const BATCH_SAVE_INTERVAL = 10; // Save after every 10 documents
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

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
    quarter?: string | null;
    tags?: string[];
  };
  aiAnalysis?: any;
}

interface ProcessingResult {
  index: number;
  documentId: string;
  title: string;
  success: boolean;
  error?: string;
  duration: number;
}

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Load all documents from documents.json
 */
async function loadDocuments(): Promise<Document[]> {
  const fileContent = await fs.readFile(DOCUMENTS_FILE, 'utf-8');
  return JSON.parse(fileContent);
}

/**
 * Save all documents to documents.json
 */
async function saveDocuments(documents: Document[]): Promise<void> {
  await fs.writeFile(
    DOCUMENTS_FILE,
    JSON.stringify(documents, null, 2),
    'utf-8'
  );
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
  approach: string;
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

  let approach = 'standard';
  if (textQuality === 'poor') {
    approach = 'OCR + Chart-to-data extraction';
  } else if (text.match(/\$[\d,.]+[BM]|[\d,.]+%|[\d,.]+[Mm]illion/gi)?.length || 0 > 50) {
    approach = 'Structured data extraction';
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

  return { approach, textQuality, estimatedDataIntensity };
}

/**
 * Chunk text for processing
 */
function chunkText(text: string, maxChunkSize: number = 100000): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  const paragraphs = text.split(/\n\n+/);

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length <= maxChunkSize) {
      currentChunk += paragraph + '\n\n';
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = paragraph + '\n\n';
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Enhanced AI analysis with Claude
 */
async function analyzeWithClaude(
  anthropic: Anthropic,
  text: string,
  document: Document,
  characteristics: ReturnType<typeof assessDocumentCharacteristics>
): Promise<any> {
  const chunks = chunkText(text);
  const analysisPrompt = `You are analyzing a game industry report. Provide a comprehensive, structured analysis.

Document Title: ${document.title}
Category: ${document.category}
Source: ${document.metadata.source || 'Unknown'}
Year: ${document.metadata.year || 'Unknown'}
Text Quality: ${characteristics.textQuality}
Estimated Data Intensity: ${characteristics.estimatedDataIntensity}

TAXONOMY FOR CLASSIFICATION:
Report Types: ${ENHANCED_TAXONOMY.reportTypes.join(', ')}
Content Focus Areas: ${ENHANCED_TAXONOMY.contentFocus.join(', ')}
Geographic Scopes: ${ENHANCED_TAXONOMY.geographicScope.join(', ')}
Temporal Nature: ${ENHANCED_TAXONOMY.temporalNature.join(', ')}
Data Characteristics: ${ENHANCED_TAXONOMY.dataCharacteristics.join(', ')}

Analyze the following document excerpt (${chunks.length > 1 ? 'part 1 of ' + chunks.length : 'complete'}):

${chunks[0].substring(0, 80000)}

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

  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < MAX_RETRIES) {
    try {
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
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Calculate data quality
      const dataQuality = {
        textExtractionQuality: characteristics.textQuality,
        dataCompleteness: Math.min(1, (analysis.extractedMetrics?.length || 0) / 20 + 0.5),
        confidence: analysis.confidence || 0.75,
        processingNotes: [
          `Processed ${chunks.length} chunk(s)`,
          `Text quality: ${characteristics.textQuality}`,
          `Approach: ${characteristics.approach}`
        ]
      };

      return {
        ...analysis,
        dataQuality,
        ocrText: text.substring(0, 10000),
        pageCount: Math.ceil(text.length / 2000)
      };

    } catch (error) {
      lastError = error as Error;
      attempts++;

      if (attempts < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempts));
      }
    }
  }

  throw new Error(`Failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

/**
 * Process a single document
 */
async function processDocument(
  anthropic: Anthropic,
  document: Document
): Promise<Document> {
  // Generate full path
  const fullPath = path.join(process.cwd(), document.filePath);

  // Extract PDF text
  const { text, pageCount } = await extractPDFText(fullPath);

  // Assess document characteristics
  const characteristics = assessDocumentCharacteristics(text, pageCount);

  // Analyze with Claude
  const analysis = await analyzeWithClaude(anthropic, text, document, characteristics);

  // Update document
  return {
    ...document,
    processingStatus: 'completed',
    processedDate: new Date().toISOString(),
    aiAnalysis: analysis
  };
}

/**
 * Print progress bar
 */
function printProgressBar(current: number, total: number, title: string) {
  const percent = Math.round((current / total) * 100);
  const barLength = 50;
  const filledLength = Math.floor((percent / 100) * barLength);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  const truncatedTitle = title.substring(0, 50).padEnd(50);

  process.stdout.write(
    `\r${colors.cyan}[${bar}] ${percent}%${colors.reset} - ${truncatedTitle}${colors.gray}`
  );
}

/**
 * Main processing function
 */
async function main() {
  log('\n' + '='.repeat(80), colors.bright);
  log('Processing Documents 51-100 with Enhanced AI Analysis', colors.bright + colors.cyan);
  log('='.repeat(80) + '\n', colors.bright);

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-api-key-here') {
    log('❌ Error: ANTHROPIC_API_KEY environment variable is not configured', colors.red);
    log('\nPlease add your API key to .env.local:', colors.yellow);
    log('  ANTHROPIC_API_KEY=sk-ant-api03-...your-actual-key...', colors.gray);
    log('\nGet your API key from: https://console.anthropic.com/', colors.cyan);
    process.exit(1);
  }

  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  try {
    // Load all documents
    log('📚 Loading documents from database...', colors.cyan);
    const allDocuments = await loadDocuments();
    log(`✓ Found ${allDocuments.length} total documents\n`, colors.green);

    // Validate range
    if (allDocuments.length < END_INDEX) {
      log(`❌ Error: Document collection only has ${allDocuments.length} documents`, colors.red);
      log(`   Cannot process documents 51-100 (indices ${START_INDEX}-${END_INDEX - 1})`, colors.red);
      process.exit(1);
    }

    // Extract documents 51-100
    const documentsToProcess = allDocuments.slice(START_INDEX, END_INDEX);
    const totalToProcess = documentsToProcess.length;

    log(`📋 Selected documents ${START_INDEX + 1} to ${END_INDEX} (${totalToProcess} documents)`, colors.cyan);
    log('─'.repeat(80), colors.gray);

    // Count processing status
    const statusCounts = documentsToProcess.reduce((acc, doc) => {
      acc[doc.processingStatus || 'pending'] = (acc[doc.processingStatus || 'pending'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    log('\nProcessing Status:', colors.bright);
    Object.entries(statusCounts).forEach(([status, count]) => {
      log(`  ${status}: ${count}`, colors.gray);
    });

    log('\nProcessing Plan:', colors.bright);
    log(`  Documents to process: ${totalToProcess}`);
    log(`  Batch save interval: Every ${BATCH_SAVE_INTERVAL} documents`);
    log(`  Estimated time: ${Math.ceil(totalToProcess * 1.5)} minutes`);
    log(`  Estimated cost: $${(totalToProcess * 0.15).toFixed(2)}\n`, colors.gray);

    // Start processing
    const startTime = Date.now();
    const results: ProcessingResult[] = [];
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < totalToProcess; i++) {
      const docIndex = START_INDEX + i;
      const doc = documentsToProcess[i];
      const docStartTime = Date.now();

      // Show progress
      printProgressBar(i + 1, totalToProcess, doc.title);

      try {
        // Process the document
        const updatedDoc = await processDocument(anthropic, doc);

        // Update the document in the main array
        allDocuments[docIndex] = updatedDoc;

        succeeded++;
        results.push({
          index: docIndex + 1,
          documentId: doc.id,
          title: doc.title,
          success: true,
          duration: Date.now() - docStartTime
        });

        // Save after every BATCH_SAVE_INTERVAL documents
        if ((i + 1) % BATCH_SAVE_INTERVAL === 0) {
          process.stdout.write('\r' + ' '.repeat(120) + '\r');
          log(`💾 Saving progress (${i + 1}/${totalToProcess} processed)...`, colors.yellow);
          await saveDocuments(allDocuments);
          log(`✓ Saved successfully`, colors.green);
        }

      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        results.push({
          index: docIndex + 1,
          documentId: doc.id,
          title: doc.title,
          success: false,
          error: errorMessage,
          duration: Date.now() - docStartTime
        });

        // Update document status to failed
        allDocuments[docIndex] = {
          ...doc,
          processingStatus: 'failed'
        };
      }

      // Rate limiting between documents
      if (i < totalToProcess - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Clear progress bar
    process.stdout.write('\r' + ' '.repeat(120) + '\r');

    // Final save
    log('💾 Saving final results...', colors.yellow);
    await saveDocuments(allDocuments);
    log('✓ All changes saved to documents.json\n', colors.green);

    const totalDuration = Math.round((Date.now() - startTime) / 1000);

    // Print results
    log('\n' + '='.repeat(80), colors.bright);
    log('Processing Complete!', colors.bright + colors.green);
    log('='.repeat(80), colors.bright);

    log(`\n✓ Succeeded: ${succeeded}`, colors.green);
    if (failed > 0) {
      log(`✗ Failed: ${failed}`, colors.red);
    }

    log(`\n⏱️  Total Duration: ${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s`, colors.cyan);
    log(`📊 Average time per document: ${(totalDuration / totalToProcess).toFixed(1)}s`, colors.cyan);
    log(`💰 Estimated cost: $${(succeeded * 0.15).toFixed(2)}`, colors.cyan);

    // Show failed documents if any
    if (failed > 0) {
      log('\n' + '─'.repeat(80), colors.gray);
      log('Failed Documents:', colors.red);
      log('─'.repeat(80), colors.gray);

      results
        .filter(r => !r.success)
        .forEach(r => {
          log(`\n  [${r.index}] ${r.title}`, colors.red);
          log(`       Error: ${r.error}`, colors.gray);
        });
    }

    // Show sample analysis from successful documents
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length > 0) {
      const sampleIndex = START_INDEX + results.findIndex(r => r.success);
      const sampleDoc = allDocuments[sampleIndex];

      if (sampleDoc.aiAnalysis) {
        const analysis = sampleDoc.aiAnalysis;

        log('\n' + '─'.repeat(80), colors.gray);
        log('Sample Enhanced Analysis:', colors.bright + colors.cyan);
        log('─'.repeat(80), colors.gray);

        log(`\nDocument [${sampleIndex + 1}]: ${sampleDoc.title}`, colors.bright);

        if (analysis.reportType) {
          log(`\n  Report Type: ${analysis.reportType}`, colors.cyan);
        }

        if (analysis.contentFocus && analysis.contentFocus.length > 0) {
          log(`  Content Focus: ${analysis.contentFocus.join(', ')}`, colors.cyan);
        }

        if (analysis.geographicScope) {
          log(`  Geographic Scope: ${analysis.geographicScope}`, colors.cyan);
        }

        if (analysis.extractedMetrics && analysis.extractedMetrics.length > 0) {
          log(`\n  Key Metrics (showing 3 of ${analysis.extractedMetrics.length}):`, colors.yellow);
          analysis.extractedMetrics.slice(0, 3).forEach((metric: any) => {
            log(`    • ${metric.value} - ${metric.context}`, colors.gray);
          });
        }

        if (analysis.extractedEntities) {
          log(`\n  Extracted Entities:`, colors.yellow);
          Object.entries(analysis.extractedEntities).forEach(([type, entities]: [string, any]) => {
            if (entities && entities.length > 0) {
              log(`    ${type}: ${entities.slice(0, 5).join(', ')}`, colors.gray);
            }
          });
        }

        if (analysis.keyFindings && analysis.keyFindings.length > 0) {
          log(`\n  Key Findings (showing 3 of ${analysis.keyFindings.length}):`, colors.yellow);
          analysis.keyFindings.slice(0, 3).forEach((finding: string) => {
            log(`    • ${finding}`, colors.gray);
          });
        }

        if (analysis.dataQuality) {
          log(`\n  Data Quality:`, colors.yellow);
          log(`    Text Extraction: ${analysis.dataQuality.textExtractionQuality}`, colors.gray);
          log(`    Completeness: ${Math.round(analysis.dataQuality.dataCompleteness * 100)}%`, colors.gray);
          log(`    Confidence: ${Math.round(analysis.dataQuality.confidence * 100)}%`, colors.gray);
        }
      }
    }

    log('\n' + '='.repeat(80), colors.bright);
    log('✨ Document processing complete!', colors.bright + colors.green);
    log('='.repeat(80) + '\n', colors.bright);

    process.exit(failed > 0 ? 1 : 0);

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
