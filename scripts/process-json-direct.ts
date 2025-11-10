#!/usr/bin/env tsx
/**
 * Process documents 101-150 directly from documents.json
 * Works without Supabase - reads and writes to JSON file
 */

import fs from 'fs/promises';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import pdf from 'pdf-parse';
import crypto from 'crypto';

const DOCUMENTS_FILE = path.join(process.cwd(), 'data/documents.json');
const START_INDEX = 100; // Document 101 (0-indexed)
const END_INDEX = 149;   // Document 150 (0-indexed)
const BATCH_SIZE = 10;

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Initialize Anthropic client
let anthropic: Anthropic;

interface Document {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  category: string;
  uploadDate: string;
  processedDate?: string;
  processingStatus: string;
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
 * Analyze document with Claude
 */
async function analyzeWithClaude(text: string, document: Document): Promise<any> {
  const chunks = chunkText(text);

  const analysisPrompt = `You are analyzing a game industry report. Provide a comprehensive, structured analysis.

Document Title: ${document.title}
Category: ${document.category}
Source: ${document.metadata.source || 'Unknown'}
Year: ${document.metadata.year || 'Unknown'}

Analyze the following document excerpt (${chunks.length > 1 ? 'part 1 of ' + chunks.length : 'complete'}):

${chunks[0].substring(0, 80000)}

Provide your analysis in this JSON format:
{
  "reportType": "string (e.g., Market Analysis, Financial Report, Technology Report, etc.)",
  "contentFocus": ["array of focus areas"],
  "geographicScope": "string (e.g., Global, Regional, Country-specific)",
  "temporalNature": ["array e.g., Historical, Current, Forecast"],
  "dataCharacteristics": "string (e.g., Quantitative, Qualitative, Mixed)",
  "targetAudience": ["array of target audiences"],

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
  "confidence": 0.85,
  "pageCount": ${Math.ceil(text.length / 2000)}
}

Focus on extracting concrete data points, metrics, and insights. Be precise and comprehensive.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: analysisPrompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Process additional chunks if needed
    if (chunks.length > 1) {
      for (let i = 1; i < Math.min(chunks.length, 3); i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const chunkPrompt = `Continue analyzing part ${i + 1} of ${chunks.length}. Extract any additional metrics, entities, and insights.

${chunks[i].substring(0, 80000)}

Return only additional findings in the same JSON format, focusing on NEW information.`;

        const chunkMessage = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          messages: [{ role: 'user', content: chunkPrompt }]
        });

        const chunkText = chunkMessage.content[0].type === 'text' ? chunkMessage.content[0].text : '';
        const chunkJson = chunkText.match(/\{[\s\S]*\}/);

        if (chunkJson) {
          const chunkAnalysis = JSON.parse(chunkJson[0]);

          // Merge results
          if (chunkAnalysis.extractedMetrics) {
            analysis.extractedMetrics = [
              ...(analysis.extractedMetrics || []),
              ...chunkAnalysis.extractedMetrics
            ];
          }

          if (chunkAnalysis.keyFindings) {
            analysis.keyFindings = [
              ...new Set([...(analysis.keyFindings || []), ...chunkAnalysis.keyFindings])
            ];
          }

          if (chunkAnalysis.extractedEntities) {
            Object.keys(chunkAnalysis.extractedEntities).forEach(key => {
              if (analysis.extractedEntities[key]) {
                analysis.extractedEntities[key] = [
                  ...new Set([
                    ...analysis.extractedEntities[key],
                    ...chunkAnalysis.extractedEntities[key]
                  ])
                ];
              }
            });
          }
        }
      }
    }

    return analysis;

  } catch (error) {
    throw new Error(`Claude API error: ${error}`);
  }
}

/**
 * Process a single document
 */
async function processDocument(document: Document): Promise<Document> {
  // Extract PDF text
  const fullPath = path.join(process.cwd(), document.filePath);
  const { text, pageCount } = await extractPDFText(fullPath);

  // Analyze with Claude
  const analysis = await analyzeWithClaude(text, document);

  // Update document
  return {
    ...document,
    processingStatus: 'completed',
    processedDate: new Date().toISOString(),
    aiAnalysis: {
      ...analysis,
      ocrText: text.substring(0, 5000) // First 5000 chars
    }
  };
}

/**
 * Load documents from JSON
 */
async function loadDocuments(): Promise<Document[]> {
  const content = await fs.readFile(DOCUMENTS_FILE, 'utf-8');
  return JSON.parse(content);
}

/**
 * Save documents to JSON
 */
async function saveDocuments(documents: Document[]): Promise<void> {
  await fs.writeFile(
    DOCUMENTS_FILE,
    JSON.stringify(documents, null, 2),
    'utf-8'
  );
}

/**
 * Main processing function
 */
async function main() {
  console.log('\n' + '='.repeat(80));
  log('Processing Documents 101-150 with Enhanced AI Analysis', colors.bright + colors.cyan);
  log('Direct JSON File Processing (No Supabase)', colors.gray);
  console.log('='.repeat(80) + '\n');

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    log('❌ Error: ANTHROPIC_API_KEY environment variable is not set', colors.red);
    log('\nPlease set your API key:', colors.yellow);
    log('  export ANTHROPIC_API_KEY=your-key-here', colors.gray);
    log('  OR add to .env.local:', colors.gray);
    log('  ANTHROPIC_API_KEY=your-key-here\n', colors.gray);
    process.exit(1);
  }

  // Initialize Anthropic
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  try {
    // Load documents
    log('📚 Loading documents from JSON file...', colors.cyan);
    const allDocuments = await loadDocuments();
    log(`✓ Loaded ${allDocuments.length} total documents\n`, colors.green);

    // Validate range
    if (allDocuments.length < END_INDEX + 1) {
      log(`❌ Error: Only ${allDocuments.length} documents available. Cannot process up to document 150.`, colors.red);
      process.exit(1);
    }

    // Show document range info
    log('Document Range:', colors.bright);
    log(`  First (${START_INDEX + 1}): ${allDocuments[START_INDEX].title}`, colors.gray);
    log(`  Last (${END_INDEX + 1}): ${allDocuments[END_INDEX].title}`, colors.gray);
    log('');

    // Processing plan
    const totalDocs = END_INDEX - START_INDEX + 1;
    log('Processing Plan:', colors.bright);
    log(`  Documents: ${START_INDEX + 1} to ${END_INDEX + 1} (${totalDocs} total)`);
    log(`  Batch size: ${BATCH_SIZE}`);
    log(`  Number of batches: ${Math.ceil(totalDocs / BATCH_SIZE)}`);
    log(`  Estimated time: ${Math.ceil(totalDocs * 1.5)} minutes`);
    log(`  Estimated cost: $${(totalDocs * 0.15).toFixed(2)}\n`, colors.gray);

    // Process in batches
    const startTime = Date.now();
    let totalSucceeded = 0;
    let totalFailed = 0;
    const failedDocs: Array<{ doc: Document; error: string }> = [];

    for (let batchNum = 0; batchNum < Math.ceil(totalDocs / BATCH_SIZE); batchNum++) {
      const batchStart = batchNum * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, totalDocs);

      console.log('\n' + '-'.repeat(80));
      log(`📦 Batch ${batchNum + 1}/${Math.ceil(totalDocs / BATCH_SIZE)} - Documents ${START_INDEX + batchStart + 1} to ${START_INDEX + batchEnd}`, colors.bright + colors.magenta);
      console.log('-'.repeat(80));

      let batchSucceeded = 0;
      let batchFailed = 0;

      for (let i = batchStart; i < batchEnd; i++) {
        const docIndex = START_INDEX + i;
        const doc = allDocuments[docIndex];
        const docNum = docIndex + 1;

        log(`\n[${i - batchStart + 1}/${batchEnd - batchStart}] Document #${docNum}: ${doc.title.substring(0, 60)}...`, colors.cyan);
        log(`  Category: ${doc.category}`, colors.gray);
        log(`  File: ${doc.fileName}`, colors.gray);
        log(`  Current Status: ${doc.processingStatus}`, colors.gray);

        try {
          log(`  📄 Extracting PDF...`, colors.yellow);
          log(`  🤖 Analyzing with Claude AI...`, colors.yellow);

          const updatedDoc = await processDocument(doc);
          allDocuments[docIndex] = updatedDoc;

          log(`  ✓ Successfully processed!`, colors.green);

          if (updatedDoc.aiAnalysis) {
            if (updatedDoc.aiAnalysis.reportType) {
              log(`    Report Type: ${updatedDoc.aiAnalysis.reportType}`, colors.gray);
            }
            if (updatedDoc.aiAnalysis.extractedMetrics?.length > 0) {
              log(`    Metrics: ${updatedDoc.aiAnalysis.extractedMetrics.length}`, colors.gray);
            }
            if (updatedDoc.aiAnalysis.keyFindings?.length > 0) {
              log(`    Findings: ${updatedDoc.aiAnalysis.keyFindings.length}`, colors.gray);
            }
          }

          batchSucceeded++;
          totalSucceeded++;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          log(`  ✗ Failed: ${errorMessage}`, colors.red);

          allDocuments[docIndex].processingStatus = 'failed';
          failedDocs.push({ doc, error: errorMessage });
          batchFailed++;
          totalFailed++;
        }

        // Small delay between documents
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Save after each batch
      log(`\n💾 Saving batch results to JSON file...`, colors.yellow);
      await saveDocuments(allDocuments);
      log(`  ✓ Saved!`, colors.green);

      // Batch summary
      console.log('\n' + '-'.repeat(80));
      log(`Batch ${batchNum + 1} Complete:`, colors.bright);
      log(`  ✓ Succeeded: ${batchSucceeded}`, colors.green);
      if (batchFailed > 0) {
        log(`  ✗ Failed: ${batchFailed}`, colors.red);
      }
      log(`  Progress: ${totalSucceeded + totalFailed}/${totalDocs} (${Math.round((totalSucceeded + totalFailed) / totalDocs * 100)}%)`, colors.cyan);
      console.log('-'.repeat(80));

      // Pause between batches
      if (batchNum < Math.ceil(totalDocs / BATCH_SIZE) - 1) {
        log('\n⏸️  Pausing 3 seconds before next batch...', colors.yellow);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    // Final save
    log('\n\n💾 Saving final results...', colors.yellow);
    await saveDocuments(allDocuments);
    log('✓ All changes saved to documents.json\n', colors.green);

    // Final summary
    console.log('='.repeat(80));
    log('✨ Processing Complete!', colors.bright + colors.green);
    console.log('='.repeat(80));

    log(`\n📊 Final Results:`, colors.bright);
    log(`  ✓ Succeeded: ${totalSucceeded}`, colors.green);
    log(`  ✗ Failed: ${totalFailed}`, totalFailed > 0 ? colors.red : colors.gray);
    log(`  Total Processed: ${totalSucceeded + totalFailed}`, colors.cyan);
    log(`  Success Rate: ${Math.round((totalSucceeded / (totalSucceeded + totalFailed)) * 100)}%`, colors.cyan);

    log(`\n⏱️  Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`, colors.cyan);
    log(`💰 Estimated cost: $${(totalSucceeded * 0.15).toFixed(2)}`, colors.cyan);

    if (failedDocs.length > 0) {
      log(`\n❌ Failed Documents (${failedDocs.length}):`, colors.red);
      failedDocs.forEach(({ doc, error }, idx) => {
        log(`  ${idx + 1}. ${doc.title}`, colors.red);
        log(`     Error: ${error}`, colors.gray);
      });
    }

    log(`\n📁 Updated file: ${DOCUMENTS_FILE}`, colors.cyan);
    console.log('\n' + '='.repeat(80) + '\n');

    process.exit(totalFailed > 0 ? 1 : 0);

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
