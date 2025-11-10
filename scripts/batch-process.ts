#!/usr/bin/env tsx
/**
 * Batch process documents with AI analysis
 * Processes documents in parallel batches for faster completion
 */

import { getAllDocuments } from '../src/lib/database';
import { processDocumentEnhanced } from '../src/lib/enhanced-ai-processor';

const BATCH_SIZE = 10; // Process 10 at a time
const MAX_PARALLEL = 3; // Run 3 batches in parallel

async function processBatch(documents: any[], batchNum: number, total: number) {
  console.log(`\n📦 Batch ${batchNum}/${total} - Processing ${documents.length} documents...`);

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    try {
      console.log(`  [${i + 1}/${documents.length}] ${doc.title.substring(0, 60)}...`);

      await processDocumentEnhanced(doc, (stage, progress) => {
        if (progress % 25 === 0) {
          process.stdout.write(`\r    ${stage}: ${progress}%`);
        }
      });

      succeeded++;
      console.log(`\r    ✓ Complete`);
    } catch (error) {
      failed++;
      console.log(`\r    ✗ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { succeeded, failed };
}

async function main() {
  console.log('🚀 Starting batch document processing\n');

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not set in environment');
    console.log('\nAdd to .env.local:');
    console.log('  ANTHROPIC_API_KEY=your-key-here\n');
    process.exit(1);
  }

  // Get documents
  const allDocs = await getAllDocuments();
  console.log(`📚 Found ${allDocs.length} total documents`);

  // Filter to pending/failed only (unless --all flag)
  const forceAll = process.argv.includes('--all');
  let docsToProcess = forceAll
    ? allDocs
    : allDocs.filter(d => d.processingStatus === 'pending' || d.processingStatus === 'failed');

  console.log(`📋 Processing ${docsToProcess.length} documents (${forceAll ? 'all' : 'pending/failed'})\n`);

  if (docsToProcess.length === 0) {
    console.log('✓ No documents to process!');
    return;
  }

  // Split into batches
  const batches: any[][] = [];
  for (let i = 0; i < docsToProcess.length; i += BATCH_SIZE) {
    batches.push(docsToProcess.slice(i, i + BATCH_SIZE));
  }

  console.log(`🔄 ${batches.length} batches of ~${BATCH_SIZE} documents each\n`);

  // Process batches
  let totalSucceeded = 0;
  let totalFailed = 0;
  const startTime = Date.now();

  for (let i = 0; i < batches.length; i += MAX_PARALLEL) {
    const parallelBatches = batches.slice(i, i + MAX_PARALLEL);

    const results = await Promise.all(
      parallelBatches.map((batch, idx) =>
        processBatch(batch, i + idx + 1, batches.length)
      )
    );

    results.forEach(r => {
      totalSucceeded += r.succeeded;
      totalFailed += r.failed;
    });
  }

  const duration = Math.round((Date.now() - startTime) / 1000);

  console.log('\n' + '='.repeat(60));
  console.log('✨ Processing Complete!');
  console.log('='.repeat(60));
  console.log(`✓ Succeeded: ${totalSucceeded}`);
  console.log(`✗ Failed: ${totalFailed}`);
  console.log(`⏱️  Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`);
  console.log(`💰 Est. Cost: $${(totalSucceeded * 0.15).toFixed(2)}`);
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
