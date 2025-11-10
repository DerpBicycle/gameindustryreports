import { promises as fs } from 'fs';
import path from 'path';
import { Document } from '../src/types/document';
import { processDocument } from '../src/lib/ai-processor';
import { getAllDocuments, saveDocument } from '../src/lib/database';

const SAVE_INTERVAL = 20;
const LOG_FILE = path.join(process.cwd(), 'logs', 'batch-201-300.log');

async function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());

  try {
    await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
    await fs.appendFile(LOG_FILE, logMessage);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

async function processBatch201to300() {
  try {
    await log('=== Starting Batch Processing: Documents 201-300 ===');

    // Load all documents from database
    await log('Loading documents from database...');
    const allDocuments = await getAllDocuments();
    await log(`Total documents in database: ${allDocuments.length}`);

    // Extract documents 201-300 (indices 200-299)
    const startIndex = 200;
    const endIndex = 300;
    const documentsToProcess = allDocuments.slice(startIndex, endIndex);

    await log(`Selected documents ${startIndex + 1} to ${endIndex} (${documentsToProcess.length} documents)`);

    if (documentsToProcess.length === 0) {
      await log('No documents to process');
      return;
    }

    // Statistics
    let successful = 0;
    let failed = 0;
    let skipped = 0;
    const errors: Array<{ docNumber: number; title: string; error: string }> = [];

    // Process each document
    for (let i = 0; i < documentsToProcess.length; i++) {
      const docNumber = startIndex + i + 1;
      const document = documentsToProcess[i];

      await log(`\n--- Processing Document ${docNumber}/${endIndex} ---`);
      await log(`Title: ${document.title}`);
      await log(`File: ${document.fileName}`);
      await log(`Status: ${document.processingStatus}`);

      try {
        // Check if already processed
        if (document.processingStatus === 'completed' && document.aiAnalysis) {
          await log(`Skipping: Already processed`);
          skipped++;
          continue;
        }

        // Update status to processing
        document.processingStatus = 'processing';
        await saveDocument(document);

        await log(`Extracting and analyzing PDF...`);

        // Process the document
        const result = await processDocument(document, (stage, progress) => {
          log(`  ${stage}: ${progress.toFixed(0)}%`);
        });

        await log(`✓ Successfully processed`);
        await log(`  Summary length: ${result.aiAnalysis.summary.length} chars`);
        await log(`  Key insights: ${result.aiAnalysis.keyInsights.length}`);
        await log(`  Topics: ${result.aiAnalysis.topics.join(', ')}`);
        await log(`  Entities: ${result.aiAnalysis.entities.slice(0, 5).join(', ')}...`);
        await log(`  Sentiment: ${result.aiAnalysis.sentiment}`);
        await log(`  Confidence: ${(result.aiAnalysis.confidence * 100).toFixed(1)}%`);

        successful++;

        // Progress checkpoint notification
        if ((i + 1) % SAVE_INTERVAL === 0) {
          await log(`\n>>> Checkpoint: ${i + 1}/${documentsToProcess.length} documents processed <<<`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await log(`✗ Failed: ${errorMessage}`);

        // Update status to failed
        try {
          document.processingStatus = 'failed';
          await saveDocument(document);
        } catch (saveError) {
          await log(`  Warning: Failed to save error status: ${saveError}`);
        }

        errors.push({
          docNumber,
          title: document.title,
          error: errorMessage,
        });

        failed++;
      }

      // Add delay between documents to avoid rate limiting
      if (i < documentsToProcess.length - 1) {
        await log('Waiting 3 seconds before next document...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Print summary
    await log('\n=== Batch Processing Summary ===');
    await log(`Total documents: ${documentsToProcess.length}`);
    await log(`Successfully processed: ${successful}`);
    await log(`Failed: ${failed}`);
    await log(`Skipped (already processed): ${skipped}`);
    await log(`Success rate: ${((successful / documentsToProcess.length) * 100).toFixed(1)}%`);

    if (errors.length > 0) {
      await log('\n=== Errors ===');
      for (const error of errors) {
        await log(`Doc ${error.docNumber}: ${error.title}`);
        await log(`  Error: ${error.error}`);
      }
    }

    await log('\n=== Batch Processing Complete ===');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await log(`\n!!! FATAL ERROR !!!`);
    await log(`Error: ${errorMessage}`);
    if (error instanceof Error && error.stack) {
      await log(`Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Run the batch processing
processBatch201to300()
  .then(() => {
    console.log('Batch processing completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Batch processing failed:', error);
    process.exit(1);
  });
