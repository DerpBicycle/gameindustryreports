#!/usr/bin/env node

/**
 * Document Indexing Script
 * Scans PDF files in the repository and indexes them into the database
 *
 * Usage:
 *   npm run index              - Index new documents
 *   npm run index -- --force   - Re-index all documents
 *   npm run index -- --dry-run - Preview what would be indexed
 *   npm run index -- --process - Also trigger AI processing for new documents
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Configuration
const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DOCUMENTS_DB = path.join(DATA_DIR, 'documents.json');
const PROCESSING_DB = path.join(DATA_DIR, 'processing-records.json');

// Categories to scan (directory names in root)
const CATEGORIES = [
  'Blockchain NFT Web3',
  'Cloud Gaming',
  'Esports',
  'General Industry',
  'HR',
  'Investments',
  'Marketing & Streaming',
  'Mobile',
  'Regional Reports',
  'XR Metaverse'
];

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  force: args.includes('--force'),
  dryRun: args.includes('--dry-run'),
  process: args.includes('--process'),
  help: args.includes('--help') || args.includes('-h')
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Statistics
const stats = {
  total: 0,
  new: 0,
  updated: 0,
  skipped: 0,
  errors: 0
};

/**
 * Print colored output
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print help message
 */
function printHelp() {
  log('\nDocument Indexing Script', 'bright');
  log('========================\n', 'bright');
  log('Usage:');
  log('  npm run index              Index new documents');
  log('  npm run index -- --force   Re-index all documents');
  log('  npm run index -- --dry-run Preview without making changes');
  log('  npm run index -- --process Also trigger AI processing');
  log('  npm run index -- --help    Show this help message\n');
  log('Options:');
  log('  --force      Re-index all documents, even if already indexed');
  log('  --dry-run    Show what would be indexed without making changes');
  log('  --process    Trigger AI processing for newly indexed documents');
  log('  --help, -h   Show this help message\n');
}

/**
 * Ensure data directory exists
 */
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

/**
 * Load existing documents
 */
async function loadDocuments() {
  try {
    const data = await fs.readFile(DOCUMENTS_DB, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

/**
 * Load processing records
 */
async function loadProcessingRecords() {
  try {
    const data = await fs.readFile(PROCESSING_DB, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

/**
 * Save documents to database
 */
async function saveDocuments(documents) {
  await ensureDataDir();
  await fs.writeFile(DOCUMENTS_DB, JSON.stringify(documents, null, 2));
}

/**
 * Generate a unique ID for a document
 */
function generateId(filePath) {
  return crypto.createHash('md5').update(filePath).digest('hex').substring(0, 16);
}

/**
 * Calculate file hash
 */
async function calculateFileHash(filePath) {
  try {
    const buffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch (error) {
    return null;
  }
}

/**
 * Parse filename to extract metadata
 * Examples:
 *   "Drake Star - Global Gaming Report (Q1 2025).pdf"
 *   "Newzoo - Global Games Market Report (2022).pdf"
 *   "DappRadar & BGA - State of blockchain gaming (Q1 2023).pdf"
 */
function parseFilename(filename) {
  // Remove .pdf extension
  const nameWithoutExt = filename.replace(/\.pdf$/i, '');

  const metadata = {
    source: null,
    title: null,
    year: null,
    quarter: null
  };

  // Extract year and quarter from parentheses
  const yearQuarterMatch = nameWithoutExt.match(/\(([^)]+)\)$/);
  if (yearQuarterMatch) {
    const yearQuarterStr = yearQuarterMatch[1];

    // Check for quarter (Q1, Q2, Q3, Q4)
    const quarterMatch = yearQuarterStr.match(/Q([1-4])/i);
    if (quarterMatch) {
      metadata.quarter = `Q${quarterMatch[1]}`;
    }

    // Check for half year (H1, H2)
    const halfMatch = yearQuarterStr.match(/H([1-2])/i);
    if (halfMatch) {
      metadata.quarter = `H${halfMatch[1]}`;
    }

    // Extract year
    const yearMatch = yearQuarterStr.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      metadata.year = parseInt(yearMatch[1], 10);
    }

    // Extract month if present
    const monthMatch = yearQuarterStr.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/i);
    if (monthMatch && !metadata.year) {
      metadata.year = parseInt(monthMatch[2], 10);
    }
  }

  // Extract source and title
  // Pattern: "Source - Title (Year/Quarter).pdf"
  const parts = nameWithoutExt.split(' - ');
  if (parts.length >= 2) {
    metadata.source = parts[0].trim();

    // Get everything after first " - " and before the year/quarter parentheses
    const titlePart = parts.slice(1).join(' - ');
    metadata.title = titlePart.replace(/\s*\([^)]+\)$/, '').trim();
  } else {
    // If no " - " separator, use the whole name (minus year/quarter) as title
    metadata.title = nameWithoutExt.replace(/\s*\([^)]+\)$/, '').trim();
  }

  return metadata;
}

/**
 * Find all PDF files recursively in a directory
 */
async function findPDFs(dir) {
  const pdfs = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subPdfs = await findPDFs(fullPath);
        pdfs.push(...subPdfs);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
        pdfs.push(fullPath);
      }
    }
  } catch (error) {
    // Skip directories that can't be read
  }

  return pdfs;
}

/**
 * Scan all category directories for PDF files
 */
async function scanAllDirectories() {
  log('\nScanning directories for PDF files...', 'cyan');

  const allPDFs = [];

  for (const category of CATEGORIES) {
    const categoryPath = path.join(ROOT_DIR, category);

    try {
      await fs.access(categoryPath);
      const pdfs = await findPDFs(categoryPath);

      if (pdfs.length > 0) {
        log(`  ${category}: ${pdfs.length} PDFs found`, 'dim');
      }

      allPDFs.push(...pdfs.map(pdfPath => ({
        path: pdfPath,
        category
      })));
    } catch (error) {
      log(`  ${category}: directory not found, skipping`, 'yellow');
    }
  }

  log(`\nTotal PDFs found: ${allPDFs.length}`, 'bright');
  return allPDFs;
}

/**
 * Create a document entry from a PDF file
 */
async function createDocument(pdfInfo, existingDoc = null) {
  const { path: filePath, category } = pdfInfo;
  const fileName = path.basename(filePath);
  const fileStats = await fs.stat(filePath);
  const metadata = parseFilename(fileName);

  // Use existing ID if updating, otherwise generate new one
  const id = existingDoc ? existingDoc.id : generateId(filePath);

  const document = {
    id,
    title: metadata.title || fileName,
    fileName,
    filePath: filePath.replace(ROOT_DIR, '').replace(/^\//, ''), // Relative path
    fileSize: fileStats.size,
    category,
    uploadDate: existingDoc ? existingDoc.uploadDate : new Date().toISOString(),
    processedDate: existingDoc?.processedDate || undefined,
    processingStatus: existingDoc?.processingStatus || 'pending',
    metadata: {
      source: metadata.source,
      year: metadata.year,
      quarter: metadata.quarter,
      region: undefined,
      tags: [category],
      description: undefined
    },
    aiAnalysis: existingDoc?.aiAnalysis || undefined
  };

  return document;
}

/**
 * Main indexing function
 */
async function indexDocuments() {
  try {
    // Load existing data
    const existingDocuments = await loadDocuments();
    const processingRecords = await loadProcessingRecords();

    // Create lookup maps
    const existingDocsMap = new Map(existingDocuments.map(doc => [doc.filePath, doc]));
    const processingMap = new Map(processingRecords.map(rec => [rec.filePath, rec]));

    // Scan for PDFs
    const pdfFiles = await scanAllDirectories();
    stats.total = pdfFiles.length;

    if (pdfFiles.length === 0) {
      log('\nNo PDF files found to index.', 'yellow');
      return;
    }

    log('\nIndexing documents...', 'cyan');
    if (flags.dryRun) {
      log('(DRY RUN - no changes will be made)', 'yellow');
    }

    const documents = [];

    for (const pdfInfo of pdfFiles) {
      const relativePath = pdfInfo.path.replace(ROOT_DIR, '').replace(/^\//, '');
      const existingDoc = existingDocsMap.get(relativePath);

      try {
        // Check if should skip
        if (!flags.force && existingDoc) {
          stats.skipped++;
          log(`  ⊘ ${relativePath}`, 'dim');
          documents.push(existingDoc);
          continue;
        }

        // Create or update document
        const document = await createDocument(pdfInfo, existingDoc);

        if (existingDoc) {
          stats.updated++;
          log(`  ↻ ${relativePath}`, 'yellow');
        } else {
          stats.new++;
          log(`  + ${relativePath}`, 'green');
        }

        documents.push(document);
      } catch (error) {
        stats.errors++;
        log(`  ✗ ${relativePath}: ${error.message}`, 'red');
      }
    }

    // Save to database
    if (!flags.dryRun) {
      await saveDocuments(documents);
      log(`\n✓ Saved ${documents.length} documents to ${DOCUMENTS_DB}`, 'green');
    }

    // Print statistics
    log('\n' + '='.repeat(50), 'bright');
    log('Indexing Statistics', 'bright');
    log('='.repeat(50), 'bright');
    log(`Total PDFs found:    ${stats.total}`);
    log(`New documents:       ${stats.new}`, 'green');
    log(`Updated documents:   ${stats.updated}`, 'yellow');
    log(`Skipped documents:   ${stats.skipped}`, 'dim');
    log(`Errors:              ${stats.errors}`, stats.errors > 0 ? 'red' : 'reset');
    log('='.repeat(50) + '\n', 'bright');

    // Show sample of indexed documents
    if (stats.new > 0 || stats.updated > 0) {
      log('Sample of indexed documents:', 'cyan');
      const samples = documents
        .filter((doc, idx) => {
          const relativePath = doc.filePath;
          const existingDoc = existingDocsMap.get(relativePath);
          return !existingDoc || flags.force;
        })
        .slice(0, 5);

      for (const doc of samples) {
        log(`\n  Title:    ${doc.title}`, 'bright');
        log(`  Source:   ${doc.metadata.source || 'N/A'}`);
        log(`  Year:     ${doc.metadata.year || 'N/A'}`);
        log(`  Quarter:  ${doc.metadata.quarter || 'N/A'}`);
        log(`  Category: ${doc.category}`);
        log(`  Size:     ${(doc.fileSize / 1024 / 1024).toFixed(2)} MB`);
        log(`  Status:   ${doc.processingStatus}`);
      }

      if (documents.length > 5) {
        log(`\n  ... and ${documents.length - 5} more`, 'dim');
      }
    }

    // Show processing recommendation
    if (flags.process && stats.new > 0) {
      log('\n⚠ AI processing flag detected but processing script not implemented yet.', 'yellow');
      log('  Documents are indexed and ready for processing.', 'dim');
    } else if (!flags.process && stats.new > 0 && !flags.dryRun) {
      log(`\n💡 Tip: Run with --process flag to trigger AI processing for ${stats.new} new documents`, 'cyan');
    }

  } catch (error) {
    log(`\n✗ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Main entry point
 */
async function main() {
  log('\n' + '='.repeat(50), 'bright');
  log('Document Indexing Script', 'bright');
  log('='.repeat(50) + '\n', 'bright');

  if (flags.help) {
    printHelp();
    process.exit(0);
  }

  // Show flags
  if (flags.force) {
    log('⚠ Force mode: Re-indexing all documents', 'yellow');
  }
  if (flags.dryRun) {
    log('⚠ Dry run mode: No changes will be made', 'yellow');
  }
  if (flags.process) {
    log('⚠ Process mode: Will trigger AI processing', 'yellow');
  }

  await indexDocuments();
}

// Run the script
main();
