#!/usr/bin/env tsx
/**
 * Process Documents 1-100 with Direct AI Analysis
 *
 * Processes documents 0-99 (documents 1-100) from documents.json
 * Extracts PDF text and prepares for comprehensive analysis
 */

import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';

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

interface ExtractedDocument {
  index: number;
  document: Document;
  text: string;
  pageCount: number;
  textLength: number;
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
 * Main processing function
 */
async function main() {
  log('\n' + '='.repeat(70), colors.bright);
  log('Process Documents 1-100 - Text Extraction Phase', colors.bright + colors.cyan);
  log('='.repeat(70) + '\n', colors.bright);

  try {
    const documentsPath = path.join(process.cwd(), 'data', 'documents.json');
    log('📚 Reading documents.json...', colors.cyan);

    const fileContent = await fs.readFile(documentsPath, 'utf-8');
    const allDocuments: Document[] = JSON.parse(fileContent);

    log(`✓ Found ${allDocuments.length} total documents`, colors.green);

    // Select documents 0-99 (documents 1-100)
    const documentsToProcess = allDocuments.slice(0, 100);
    log(`📋 Selected documents 1-100 for processing\n`, colors.cyan);

    const extracted: ExtractedDocument[] = [];
    let succeeded = 0;
    let failed = 0;

    // Extract text from all PDFs
    for (let i = 0; i < documentsToProcess.length; i++) {
      const doc = documentsToProcess[i];

      log(`[${i + 1}/100] Extracting: ${doc.title}`, colors.cyan);

      try {
        const fullPath = path.join(process.cwd(), doc.filePath);
        const { text, pageCount } = await extractPDFText(fullPath);

        extracted.push({
          index: i,
          document: doc,
          text,
          pageCount,
          textLength: text.length
        });

        log(`  ✓ Pages: ${pageCount}, Text: ${text.length} chars`, colors.green);
        succeeded++;

      } catch (error) {
        log(`  ✗ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, colors.red);
        failed++;
      }
    }

    // Save extracted data for batch processing
    const extractedPath = path.join(process.cwd(), 'data', 'extracted-1-100.json');
    await fs.writeFile(extractedPath, JSON.stringify(extracted, null, 2), 'utf-8');

    log(`\n✓ Extraction complete!`, colors.green);
    log(`  Succeeded: ${succeeded}`, colors.green);
    log(`  Failed: ${failed}`, colors.red);
    log(`  Data saved to: ${extractedPath}`, colors.cyan);

    // Output summary for first few documents
    log('\n' + '='.repeat(70), colors.bright);
    log('First 5 Documents Summary', colors.bright + colors.cyan);
    log('='.repeat(70) + '\n', colors.bright);

    extracted.slice(0, 5).forEach((ext, idx) => {
      log(`${idx + 1}. ${ext.document.title}`, colors.bright);
      log(`   Source: ${ext.document.metadata.source || 'Unknown'}`, colors.gray);
      log(`   Category: ${ext.document.category}`, colors.gray);
      log(`   Pages: ${ext.pageCount}, Text length: ${ext.textLength}`, colors.gray);
      log(`   Text preview: ${ext.text.substring(0, 200).replace(/\n/g, ' ')}...`, colors.cyan);
      log('');
    });

  } catch (error) {
    log('\n❌ Fatal Error:', colors.red);
    log(error instanceof Error ? error.message : 'Unknown error', colors.red);
    process.exit(1);
  }
}

main();
