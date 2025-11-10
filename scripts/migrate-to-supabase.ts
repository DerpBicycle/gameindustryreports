#!/usr/bin/env tsx
/**
 * Migrate existing JSON data to Supabase
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('🚀 Starting migration to Supabase...\n');

  // Read existing documents
  const documentsPath = path.join(process.cwd(), 'data', 'documents.json');

  let documents = [];
  try {
    const data = await fs.readFile(documentsPath, 'utf-8');
    documents = JSON.parse(data);
    console.log(`📄 Found ${documents.length} documents to migrate\n`);
  } catch (error) {
    console.log('ℹ️  No existing documents.json found, starting fresh\n');
    return;
  }

  let succeeded = 0;
  let failed = 0;

  for (const doc of documents) {
    try {
      const dbDoc = {
        id: doc.id,
        title: doc.title,
        file_name: doc.fileName,
        file_path: doc.filePath,
        file_size: doc.fileSize,
        category: doc.category,
        upload_date: doc.uploadDate,
        processed_date: doc.processedDate || null,
        processing_status: doc.processingStatus,
        source: doc.metadata?.source || null,
        year: doc.metadata?.year || null,
        quarter: doc.metadata?.quarter || null,
        region: doc.metadata?.region || null,
        tags: doc.metadata?.tags || [],
        description: doc.metadata?.description || null,
        ai_summary: doc.aiAnalysis?.summary || null,
        ai_key_insights: doc.aiAnalysis?.keyInsights || [],
        ai_topics: doc.aiAnalysis?.topics || [],
        ai_entities: doc.aiAnalysis?.entities || null,
        ai_sentiment: doc.aiAnalysis?.sentiment || null,
        ai_confidence: doc.aiAnalysis?.confidence || null,
        ai_page_count: doc.aiAnalysis?.pageCount || null,
      };

      const { error } = await supabase
        .from('documents')
        .upsert(dbDoc, { onConflict: 'id' });

      if (error) throw error;

      succeeded++;
      process.stdout.write(`\r✓ Migrated: ${succeeded}/${documents.length}`);
    } catch (error) {
      failed++;
      console.error(`\n❌ Failed to migrate ${doc.title}:`, error);
    }
  }

  console.log(`\n\n✨ Migration complete!`);
  console.log(`   Succeeded: ${succeeded}`);
  console.log(`   Failed: ${failed}\n`);
}

migrate().catch(console.error);
