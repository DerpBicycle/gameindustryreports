#!/usr/bin/env node

/**
 * Example script for processing PDF documents with AI
 *
 * Usage:
 *   npx tsx scripts/process-documents.ts
 *
 * This script demonstrates how to:
 * - Process individual documents
 * - Batch process multiple documents
 * - Track progress
 * - Handle errors
 */

import { getAllDocuments } from '../src/lib/database';
import {
  processDocument,
  shouldProcessDocument,
  batchProcessDocuments,
  generateFileHash
} from '../src/lib/ai-processor';
import { Document } from '../src/types/document';

async function processAllDocuments() {
  console.log('🚀 Starting document processing...\n');

  try {
    // Get all documents
    const documents = await getAllDocuments();
    console.log(`📚 Found ${documents.length} documents\n`);

    if (documents.length === 0) {
      console.log('No documents to process. Upload some PDFs first.');
      return;
    }

    // Filter documents that need processing
    const documentsToProcess: Document[] = [];
    for (const doc of documents) {
      const { shouldProcess, reason } = await shouldProcessDocument(doc.filePath);
      if (shouldProcess) {
        console.log(`✓ ${doc.fileName}: ${reason}`);
        documentsToProcess.push(doc);
      } else {
        console.log(`⊘ ${doc.fileName}: ${reason}`);
      }
    }

    console.log(`\n📝 Processing ${documentsToProcess.length} documents...\n`);

    if (documentsToProcess.length === 0) {
      console.log('All documents are already processed!');
      return;
    }

    // Batch process documents
    const results = await batchProcessDocuments(
      documentsToProcess,
      (documentIndex, stage, progress) => {
        const doc = documentsToProcess[documentIndex];
        console.log(`[${documentIndex + 1}/${documentsToProcess.length}] ${doc.fileName}: ${stage} (${Math.round(progress)}%)`);
      },
      (document, success, error) => {
        if (success) {
          console.log(`✅ ${document.fileName}: ${error || 'Completed successfully'}\n`);
        } else {
          console.log(`❌ ${document.fileName}: ${error}\n`);
        }
      }
    );

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Processing Summary');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${results.successful}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⊘ Skipped: ${results.skipped}`);
    console.log(`📄 Total: ${documents.length}`);
    console.log('='.repeat(60) + '\n');

    // Show details of processed documents
    if (results.successful > 0) {
      console.log('✨ Successfully processed documents:\n');
      results.results
        .filter(r => r.success && !r.error?.startsWith('Skipped'))
        .forEach(({ document }) => {
          console.log(`📄 ${document.fileName}`);
          console.log(`   Category: ${document.category}`);
          if (document.aiAnalysis) {
            console.log(`   Topics: ${document.aiAnalysis.topics.slice(0, 5).join(', ')}`);
            console.log(`   Entities: ${document.aiAnalysis.entities.slice(0, 5).join(', ')}`);
            console.log(`   Sentiment: ${document.aiAnalysis.sentiment}`);
            console.log(`   Confidence: ${(document.aiAnalysis.confidence * 100).toFixed(1)}%`);
          }
          console.log('');
        });
    }

    if (results.failed > 0) {
      console.log('⚠️  Failed documents:\n');
      results.results
        .filter(r => !r.success)
        .forEach(({ document, error }) => {
          console.log(`📄 ${document.fileName}`);
          console.log(`   Error: ${error}\n`);
        });
    }

  } catch (error) {
    console.error('❌ Error processing documents:', error);
    process.exit(1);
  }
}

async function processSingleDocument(fileName: string) {
  console.log(`🚀 Processing single document: ${fileName}\n`);

  try {
    const documents = await getAllDocuments();
    const document = documents.find(d => d.fileName === fileName);

    if (!document) {
      console.error(`❌ Document not found: ${fileName}`);
      process.exit(1);
    }

    // Check if processing is needed
    const { shouldProcess, reason } = await shouldProcessDocument(document.filePath);
    console.log(`Status check: ${reason}\n`);

    if (!shouldProcess) {
      console.log('Document is already up to date. Use --force to reprocess.');
      return;
    }

    // Process document with progress tracking
    const result = await processDocument(
      document,
      (stage, progress) => {
        console.log(`${stage}: ${Math.round(progress)}%`);
      }
    );

    console.log('\n✅ Processing complete!\n');
    console.log('='.repeat(60));
    console.log('📊 Analysis Results');
    console.log('='.repeat(60));
    console.log(`Document: ${result.document.fileName}`);
    console.log(`Category: ${result.document.category}`);
    console.log(`Status: ${result.document.processingStatus}`);
    console.log(`Pages: ${result.aiAnalysis.pageCount}`);
    console.log(`Confidence: ${(result.aiAnalysis.confidence * 100).toFixed(1)}%`);
    console.log(`Sentiment: ${result.aiAnalysis.sentiment}`);
    console.log('');
    console.log('Summary:');
    console.log(result.aiAnalysis.summary);
    console.log('');
    console.log('Key Insights:');
    result.aiAnalysis.keyInsights.forEach((insight, i) => {
      console.log(`  ${i + 1}. ${insight}`);
    });
    console.log('');
    console.log('Topics:', result.aiAnalysis.topics.join(', '));
    console.log('');
    console.log('Entities:', result.aiAnalysis.entities.slice(0, 10).join(', '));
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error processing document:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const fileName = args.find(arg => !arg.startsWith('--'));

if (fileName) {
  processSingleDocument(fileName);
} else {
  processAllDocuments();
}
