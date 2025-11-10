#!/usr/bin/env tsx
/**
 * Process documents 101-150 from the Game Industry Reports collection
 * with enhanced AI analysis, saving after each batch of 10
 */

import { getAllDocuments, saveDocument } from '../src/lib/database';
import { processDocumentEnhanced } from '../src/lib/enhanced-ai-processor';
import { Document } from '../src/types/document';

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

async function main() {
  console.log('\n' + '='.repeat(80));
  log('Processing Documents 101-150 with Enhanced AI Analysis', colors.bright + colors.cyan);
  console.log('='.repeat(80) + '\n');

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    log('❌ Error: ANTHROPIC_API_KEY environment variable is not set', colors.red);
    log('\nPlease add your API key to .env.local:', colors.yellow);
    log('  ANTHROPIC_API_KEY=your-key-here\n');
    process.exit(1);
  }

  try {
    // Load all documents
    log('📚 Loading documents from database...', colors.cyan);
    const allDocuments = await getAllDocuments();

    if (allDocuments.length === 0) {
      log('❌ No documents found in database', colors.red);
      log('   Run: npm run index', colors.gray);
      process.exit(1);
    }

    log(`✓ Found ${allDocuments.length} total documents\n`, colors.green);

    // Select documents 101-150
    if (allDocuments.length < END_INDEX + 1) {
      log(`❌ Error: Only ${allDocuments.length} documents available. Cannot process up to document 150.`, colors.red);
      process.exit(1);
    }

    const documentsToProcess = allDocuments.slice(START_INDEX, END_INDEX + 1);
    log(`📋 Selected documents ${START_INDEX + 1} to ${END_INDEX + 1} (${documentsToProcess.length} documents)\n`, colors.cyan);

    // Show document range info
    log('Document Range:', colors.bright);
    log(`  First: ${documentsToProcess[0].title}`, colors.gray);
    log(`  Last:  ${documentsToProcess[documentsToProcess.length - 1].title}`, colors.gray);
    log('');

    // Estimate
    log('Processing Plan:', colors.bright);
    log(`  Total documents: ${documentsToProcess.length}`);
    log(`  Batches of: ${BATCH_SIZE}`);
    log(`  Number of batches: ${Math.ceil(documentsToProcess.length / BATCH_SIZE)}`);
    log(`  Estimated time: ${Math.ceil(documentsToProcess.length * 1.5)} minutes`);
    log(`  Estimated cost: $${(documentsToProcess.length * 0.15).toFixed(2)}\n`, colors.gray);

    // Process in batches
    const startTime = Date.now();
    let totalSucceeded = 0;
    let totalFailed = 0;
    const failedDocs: Array<{ doc: Document; error: string }> = [];

    for (let batchNum = 0; batchNum < Math.ceil(documentsToProcess.length / BATCH_SIZE); batchNum++) {
      const batchStart = batchNum * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, documentsToProcess.length);
      const batch = documentsToProcess.slice(batchStart, batchEnd);

      console.log('\n' + '-'.repeat(80));
      log(`📦 Batch ${batchNum + 1}/${Math.ceil(documentsToProcess.length / BATCH_SIZE)} - Processing documents ${START_INDEX + batchStart + 1} to ${START_INDEX + batchEnd}`, colors.bright + colors.magenta);
      console.log('-'.repeat(80));

      let batchSucceeded = 0;
      let batchFailed = 0;

      for (let i = 0; i < batch.length; i++) {
        const doc = batch[i];
        const docNum = START_INDEX + batchStart + i + 1;

        log(`\n[${i + 1}/${batch.length}] Document #${docNum}: ${doc.title.substring(0, 70)}...`, colors.cyan);
        log(`  Category: ${doc.category}`, colors.gray);
        log(`  File: ${doc.fileName}`, colors.gray);
        log(`  Status: ${doc.processingStatus}`, colors.gray);

        try {
          // Process document
          const result = await processDocumentEnhanced(doc, (stage, progress) => {
            if (progress % 25 === 0) {
              process.stdout.write(`\r  ${colors.yellow}${stage}: ${progress}%${colors.reset}`);
            }
          });

          process.stdout.write('\r' + ' '.repeat(80) + '\r');
          log(`  ✓ Successfully processed!`, colors.green);

          if (result.document.aiAnalysis) {
            const analysis = result.document.aiAnalysis as any;
            if (analysis.reportType) {
              log(`    Report Type: ${analysis.reportType}`, colors.gray);
            }
            if (analysis.extractedMetrics?.length > 0) {
              log(`    Extracted Metrics: ${analysis.extractedMetrics.length}`, colors.gray);
            }
            if (analysis.keyFindings?.length > 0) {
              log(`    Key Findings: ${analysis.keyFindings.length}`, colors.gray);
            }
          }

          batchSucceeded++;
          totalSucceeded++;

        } catch (error) {
          process.stdout.write('\r' + ' '.repeat(80) + '\r');
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          log(`  ✗ Failed: ${errorMessage}`, colors.red);

          failedDocs.push({ doc, error: errorMessage });
          batchFailed++;
          totalFailed++;
        }

        // Small delay between documents
        if (i < batch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Batch summary
      console.log('\n' + '-'.repeat(80));
      log(`Batch ${batchNum + 1} Complete:`, colors.bright);
      log(`  ✓ Succeeded: ${batchSucceeded}`, colors.green);
      if (batchFailed > 0) {
        log(`  ✗ Failed: ${batchFailed}`, colors.red);
      }
      log(`  Progress: ${totalSucceeded + totalFailed}/${documentsToProcess.length} (${Math.round((totalSucceeded + totalFailed) / documentsToProcess.length * 100)}%)`, colors.cyan);
      console.log('-'.repeat(80));

      // Pause between batches
      if (batchNum < Math.ceil(documentsToProcess.length / BATCH_SIZE) - 1) {
        log('\n⏸️  Pausing 3 seconds before next batch...', colors.yellow);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    // Final summary
    console.log('\n\n' + '='.repeat(80));
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
