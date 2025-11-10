#!/usr/bin/env tsx
/**
 * Analyze and Update Documents with AI Analysis
 *
 * Reads extracted text and analysis objects, updates documents.json
 */

import fs from 'fs/promises';
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

async function main() {
  log('\n' + '='.repeat(70), colors.bright);
  log('Analyze Documents 1-100', colors.bright + colors.cyan);
  log('='.repeat(70) + '\n', colors.bright);

  try {
    // Read extracted documents
    const extractedPath = path.join(process.cwd(), 'data', 'extracted-1-100.json');
    const extractedContent = await fs.readFile(extractedPath, 'utf-8');
    const extracted: ExtractedDocument[] = JSON.parse(extractedContent);

    log(`✓ Loaded ${extracted.length} extracted documents`, colors.green);

    // Read current documents.json
    const documentsPath = path.join(process.cwd(), 'data', 'documents.json');
    const documentsContent = await fs.readFile(documentsPath, 'utf-8');
    const allDocuments: Document[] = JSON.parse(documentsContent);

    log(`✓ Loaded ${allDocuments.length} total documents`, colors.green);

    // Read analysis file (will be provided externally)
    const analysisPath = path.join(process.cwd(), 'data', 'analysis-1-100.json');

    try {
      await fs.access(analysisPath);
      log(`✓ Found analysis file`, colors.green);

      const analysisContent = await fs.readFile(analysisPath, 'utf-8');
      const analyses = JSON.parse(analysisContent);

      log(`\n📝 Updating documents with analysis...`, colors.cyan);

      let updated = 0;
      for (let i = 0; i < Math.min(100, analyses.length); i++) {
        const analysis = analyses[i];

        if (analysis && allDocuments[i]) {
          allDocuments[i] = {
            ...allDocuments[i],
            processingStatus: 'completed',
            processedDate: new Date().toISOString(),
            aiAnalysis: analysis
          };
          updated++;
        }

        // Save after every 20 documents
        if ((i + 1) % 20 === 0) {
          await fs.writeFile(documentsPath, JSON.stringify(allDocuments, null, 2), 'utf-8');
          log(`  ✓ Saved batch ${Math.floor(i / 20) + 1} (${i + 1} documents)`, colors.green);
        }
      }

      // Final save
      await fs.writeFile(documentsPath, JSON.stringify(allDocuments, null, 2), 'utf-8');
      log(`\n✓ Updated ${updated} documents in documents.json`, colors.green);

    } catch (error) {
      log(`\n⚠️  No analysis file found at ${analysisPath}`, colors.yellow);
      log(`Creating template for analysis...`, colors.cyan);

      // Create a template showing what analysis is needed
      const template = extracted.map((ext, idx) => ({
        index: idx,
        documentId: ext.document.id,
        title: ext.document.title,
        source: ext.document.metadata.source,
        category: ext.document.category,
        pageCount: ext.pageCount,
        textLength: ext.textLength,
        textSample: ext.text.substring(0, 2000),
        // Template for analysis to be filled
        aiAnalysis: {
          reportType: "TBD",
          contentFocus: [],
          geographicScope: "TBD",
          summary: "TBD",
          keyFindings: [],
          topics: [],
          extractedMetrics: [],
          extractedEntities: {
            companies: [],
            games: [],
            technologies: [],
            regions: [],
            genres: [],
            platforms: []
          },
          sentiment: "neutral",
          confidence: 0.0
        }
      }));

      const templatePath = path.join(process.cwd(), 'data', 'analysis-template.json');
      await fs.writeFile(templatePath, JSON.stringify(template, null, 2), 'utf-8');
      log(`✓ Template created at ${templatePath}`, colors.green);
    }

  } catch (error) {
    log('\n❌ Error:', colors.red);
    log(error instanceof Error ? error.message : 'Unknown error', colors.red);
    process.exit(1);
  }
}

main();
