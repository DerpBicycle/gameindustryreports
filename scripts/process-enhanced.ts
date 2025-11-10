#!/usr/bin/env tsx
/**
 * Enhanced Document Processing Script
 *
 * Processes documents using the enhanced AI pipeline with:
 * - Advanced classification taxonomy
 * - Entity and metric extraction
 * - Priority-based processing
 * - Comprehensive analysis
 *
 * Usage:
 *   npm run process:enhanced           # Process all pending documents
 *   npm run process:enhanced -- --all  # Process all documents (force reprocess)
 *   npm run process:enhanced -- --file "path/to/doc.pdf"
 *   npm run process:enhanced -- --sample 10  # Process 10 random documents
 */

import { getAllDocuments } from '../src/lib/database';
import { processDocumentEnhanced, batchProcessDocuments } from '../src/lib/enhanced-ai-processor';
import { Document } from '../src/types/document';
import path from 'path';

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

function printHeader() {
  log('\n' + '='.repeat(70), colors.bright);
  log('Enhanced Document Processing Pipeline', colors.bright + colors.cyan);
  log('='.repeat(70) + '\n', colors.bright);
}

function printUsage() {
  log('Usage:', colors.bright);
  log('  npm run process:enhanced              # Process all pending documents');
  log('  npm run process:enhanced -- --all     # Process all documents (force)');
  log('  npm run process:enhanced -- --file "path"  # Process specific file');
  log('  npm run process:enhanced -- --sample N     # Process N random documents');
  log('  npm run process:enhanced -- --help    # Show this help\n');
}

async function main() {
  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    printHeader();
    printUsage();
    process.exit(0);
  }

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    log('❌ Error: ANTHROPIC_API_KEY environment variable is not set', colors.red);
    log('\nPlease add your API key to .env.local:', colors.yellow);
    log('  ANTHROPIC_API_KEY=your-key-here\n');
    process.exit(1);
  }

  printHeader();

  try {
    // Load all documents
    log('📚 Loading documents from database...', colors.cyan);
    const allDocuments = await getAllDocuments();

    if (allDocuments.length === 0) {
      log('❌ No documents found in database', colors.red);
      log('   Run: npm run index', colors.gray);
      process.exit(1);
    }

    log(`✓ Found ${allDocuments.length} documents\n`, colors.green);

    // Determine which documents to process
    let documentsToProcess: Document[] = [];

    if (args.includes('--file')) {
      // Process specific file
      const fileIndex = args.indexOf('--file');
      const filePath = args[fileIndex + 1];

      if (!filePath) {
        log('❌ Error: --file requires a file path', colors.red);
        process.exit(1);
      }

      const doc = allDocuments.find(d => d.filePath === filePath || d.fileName === path.basename(filePath));

      if (!doc) {
        log(`❌ Error: Document not found: ${filePath}`, colors.red);
        process.exit(1);
      }

      documentsToProcess = [doc];
      log(`📄 Processing single document: ${doc.title}`, colors.cyan);

    } else if (args.includes('--sample')) {
      // Process random sample
      const sampleIndex = args.indexOf('--sample');
      const sampleSize = parseInt(args[sampleIndex + 1] || '10');

      if (isNaN(sampleSize) || sampleSize < 1) {
        log('❌ Error: --sample requires a positive number', colors.red);
        process.exit(1);
      }

      // Select random documents
      const shuffled = [...allDocuments].sort(() => Math.random() - 0.5);
      documentsToProcess = shuffled.slice(0, Math.min(sampleSize, shuffled.length));

      log(`🎲 Processing ${documentsToProcess.length} random documents`, colors.cyan);

    } else if (args.includes('--all')) {
      // Process all documents
      documentsToProcess = allDocuments;
      log(`🔄 Force reprocessing all ${documentsToProcess.length} documents`, colors.yellow);

    } else {
      // Process only pending documents
      documentsToProcess = allDocuments.filter(d =>
        d.processingStatus === 'pending' || d.processingStatus === 'failed'
      );

      if (documentsToProcess.length === 0) {
        log('✓ All documents are already processed', colors.green);
        log('\nUse --all flag to force reprocessing', colors.gray);
        process.exit(0);
      }

      log(`📋 Processing ${documentsToProcess.length} pending/failed documents\n`, colors.cyan);
    }

    // Show processing plan
    log('Processing Plan:', colors.bright);
    log(`  Total documents: ${documentsToProcess.length}`);
    log(`  Estimated time: ${Math.ceil(documentsToProcess.length * 1.5)} minutes`);
    log(`  Estimated cost: $${(documentsToProcess.length * 0.15).toFixed(2)}\n`, colors.gray);

    // Start processing
    const startTime = Date.now();

    const result = await batchProcessDocuments(
      documentsToProcess,
      (current, total, title) => {
        const percent = Math.round((current / total) * 100);
        const bar = '█'.repeat(Math.floor(percent / 2)) + '░'.repeat(50 - Math.floor(percent / 2));
        process.stdout.write(`\r${colors.cyan}[${bar}] ${percent}%${colors.reset} - ${title.substring(0, 40)}${colors.gray}`);
      }
    );

    // Clear progress bar
    process.stdout.write('\r' + ' '.repeat(120) + '\r');

    const duration = Math.round((Date.now() - startTime) / 1000);

    // Show results
    log('\n' + '-'.repeat(70), colors.gray);
    log('Processing Complete!', colors.bright + colors.green);
    log('-'.repeat(70), colors.gray);

    log(`\n✓ Succeeded: ${result.succeeded}`, colors.green);

    if (result.failed > 0) {
      log(`✗ Failed: ${result.failed}`, colors.red);

      log('\nFailed documents:', colors.red);
      result.results
        .filter(r => !r.success)
        .forEach(r => {
          log(`  - ${r.document.title}`, colors.red);
          log(`    Error: ${r.error}`, colors.gray);
        });
    }

    log(`\n⏱️  Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`, colors.cyan);
    log(`💰 Estimated cost: $${(result.succeeded * 0.15).toFixed(2)}`, colors.cyan);

    // Show sample enhanced analysis
    const successfulDocs = result.results.filter(r => r.success);
    if (successfulDocs.length > 0 && successfulDocs[0].document.aiAnalysis) {
      const sampleDoc = successfulDocs[0].document;
      const analysis = sampleDoc.aiAnalysis as any;

      log('\n' + '-'.repeat(70), colors.gray);
      log('Sample Enhanced Analysis:', colors.bright + colors.cyan);
      log('-'.repeat(70), colors.gray);

      log(`\nDocument: ${sampleDoc.title}`, colors.bright);

      if (analysis.reportType) {
        log(`\nReport Type: ${analysis.reportType}`, colors.cyan);
      }

      if (analysis.contentFocus && analysis.contentFocus.length > 0) {
        log(`Content Focus: ${analysis.contentFocus.join(', ')}`, colors.cyan);
      }

      if (analysis.extractedMetrics && analysis.extractedMetrics.length > 0) {
        log(`\nKey Metrics (${analysis.extractedMetrics.length} total):`, colors.yellow);
        analysis.extractedMetrics.slice(0, 3).forEach((metric: any) => {
          log(`  • ${metric.value} - ${metric.context}`, colors.gray);
        });
      }

      if (analysis.extractedEntities) {
        log(`\nExtracted Entities:`, colors.yellow);
        Object.entries(analysis.extractedEntities).forEach(([type, entities]: [string, any]) => {
          if (entities && entities.length > 0) {
            log(`  ${type}: ${entities.slice(0, 5).join(', ')}`, colors.gray);
          }
        });
      }

      if (analysis.keyFindings && analysis.keyFindings.length > 0) {
        log(`\nKey Findings:`, colors.yellow);
        analysis.keyFindings.slice(0, 3).forEach((finding: string) => {
          log(`  • ${finding}`, colors.gray);
        });
      }

      if (analysis.dataQuality) {
        log(`\nData Quality:`, colors.yellow);
        log(`  Text Extraction: ${analysis.dataQuality.textExtractionQuality}`, colors.gray);
        log(`  Completeness: ${Math.round(analysis.dataQuality.dataCompleteness * 100)}%`, colors.gray);
        log(`  Confidence: ${Math.round(analysis.dataQuality.confidence * 100)}%`, colors.gray);
      }
    }

    log('\n' + '='.repeat(70), colors.bright);
    log('✨ Enhanced processing complete!', colors.bright + colors.green);
    log('='.repeat(70) + '\n', colors.bright);

    process.exit(result.failed > 0 ? 1 : 0);

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
