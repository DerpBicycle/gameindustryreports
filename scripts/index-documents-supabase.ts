#!/usr/bin/env tsx
/**
 * Index documents from PDF directories into Supabase
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { saveDocument } from '../src/lib/database';
import { Document } from '../src/types/document';

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

function generateDocId(filePath: string): string {
  return crypto.createHash('md5').update(filePath).digest('hex').substring(0, 16);
}

function parseFileName(fileName: string): {
  source?: string;
  title: string;
  year?: number;
  quarter?: string;
} {
  const cleanName = fileName.replace(/\.pdf$/i, '');

  const yearMatch = cleanName.match(/\((\d{4})\)/);
  const year = yearMatch ? parseInt(yearMatch[1]) : undefined;

  const quarterMatch = cleanName.match(/\((Q[1-4]|H[1-2])\s*\d{4}\)/i);
  const quarter = quarterMatch ? quarterMatch[1].toUpperCase() : undefined;

  const parts = cleanName.split(' - ');
  const source = parts.length > 1 ? parts[0].trim() : undefined;
  const titlePart = parts.length > 1 ? parts.slice(1).join(' - ') : cleanName;
  const title = titlePart.replace(/\s*\((?:Q[1-4]|H[1-2]\s*)?\d{4}\)/g, '').trim();

  return { source, title, year, quarter };
}

async function scanCategory(category: string): Promise<Document[]> {
  const categoryPath = path.join(process.cwd(), category);
  const documents: Document[] = [];

  try {
    const files = await fs.readdir(categoryPath);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

    for (const fileName of pdfFiles) {
      const filePath = path.join(category, fileName);
      const fullPath = path.join(process.cwd(), filePath);

      try {
        const stats = await fs.stat(fullPath);
        const parsed = parseFileName(fileName);

        const document: Document = {
          id: generateDocId(filePath),
          title: parsed.title,
          fileName,
          filePath,
          fileSize: stats.size,
          category,
          uploadDate: new Date().toISOString(),
          processingStatus: 'pending',
          metadata: {
            source: parsed.source,
            year: parsed.year,
            quarter: parsed.quarter,
            tags: [category],
          },
        };

        documents.push(document);
      } catch (error) {
        console.error(`Error processing ${fileName}:`, error);
      }
    }
  } catch (error) {
    console.log(`Category ${category} not found, skipping...`);
  }

  return documents;
}

async function main() {
  console.log('\n🚀 Indexing PDFs to Supabase...\n');

  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');

  if (dryRun) {
    console.log('📝 DRY RUN MODE - No changes will be made\n');
  }

  let totalFound = 0;
  let totalIndexed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const category of CATEGORIES) {
    process.stdout.write(`📁 ${category}...`);
    const documents = await scanCategory(category);

    if (documents.length === 0) {
      process.stdout.write(' 0 PDFs\n');
      continue;
    }

    totalFound += documents.length;
    process.stdout.write(` ${documents.length} PDFs\n`);

    if (!dryRun) {
      for (const doc of documents) {
        try {
          await saveDocument(doc);
          totalIndexed++;
          process.stdout.write('.');
        } catch (error) {
          totalErrors++;
          process.stdout.write('✗');
        }
      }
      process.stdout.write('\n');
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Total PDFs found: ${totalFound}`);

  if (!dryRun) {
    console.log(`✓ Indexed: ${totalIndexed}`);
    console.log(`✗ Errors: ${totalErrors}`);
  }

  console.log('='.repeat(50) + '\n');

  if (dryRun) {
    console.log('Run without --dry-run to actually index documents');
  } else {
    console.log('✨ Done! Documents indexed to Supabase');
  }
}

main().catch(console.error);
