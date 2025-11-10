#!/usr/bin/env tsx
/**
 * Upload processed documents from local JSON to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.log('\nAdd to .env.local:');
  console.log('  SUPABASE_URL=your-project-url');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your-service-key\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function convertToDbFormat(doc: any) {
  return {
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
    ai_key_insights: doc.aiAnalysis?.keyInsights || doc.aiAnalysis?.keyFindings || [],
    ai_topics: doc.aiAnalysis?.topics || [],
    ai_entities: doc.aiAnalysis?.extractedEntities || doc.aiAnalysis?.entities || null,
    ai_sentiment: doc.aiAnalysis?.sentiment || null,
    ai_confidence: doc.aiAnalysis?.confidence || null,
    ai_page_count: doc.aiAnalysis?.pageCount || null,
    report_type: doc.aiAnalysis?.reportType || null,
    content_focus: doc.aiAnalysis?.contentFocus || [],
    geographic_scope: doc.aiAnalysis?.geographicScope || doc.aiAnalysis?.geography || null,
    temporal_nature: doc.aiAnalysis?.temporalNature || [],
    data_characteristics: doc.aiAnalysis?.dataCharacteristics || null,
    target_audience: doc.aiAnalysis?.targetAudience || [],
    extracted_metrics: doc.aiAnalysis?.extractedMetrics || doc.aiAnalysis?.metrics || null,
    key_findings: doc.aiAnalysis?.keyFindings || [],
    methodology: doc.aiAnalysis?.methodology || null,
    data_quality: doc.aiAnalysis?.dataQuality || null,
  };
}

async function main() {
  console.log('🚀 Uploading documents to Supabase\n');

  // Read local documents
  const documentsPath = path.join(process.cwd(), 'data', 'documents.json');
  const data = await fs.readFile(documentsPath, 'utf-8');
  const documents = JSON.parse(data);

  console.log(`📄 Found ${documents.length} documents`);

  // Filter to only completed ones
  const completedDocs = documents.filter((d: any) => d.processingStatus === 'completed');
  const pendingDocs = documents.filter((d: any) => d.processingStatus === 'pending');

  console.log(`✓ ${completedDocs.length} completed (will upload)`);
  console.log(`⏳ ${pendingDocs.length} pending (will skip)\n`);

  if (completedDocs.length === 0) {
    console.log('No completed documents to upload!');
    return;
  }

  let succeeded = 0;
  let failed = 0;

  // Upload in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < completedDocs.length; i += BATCH_SIZE) {
    const batch = completedDocs.slice(i, i + BATCH_SIZE);
    const dbDocs = batch.map(convertToDbFormat);

    console.log(`📤 Uploading batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} docs)...`);

    const { data, error } = await supabase
      .from('documents')
      .upsert(dbDocs, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Batch failed:`, error.message);
      failed += batch.length;
    } else {
      succeeded += batch.length;
      console.log(`✓ Uploaded ${succeeded}/${completedDocs.length}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Upload Complete!');
  console.log('='.repeat(60));
  console.log(`✓ Succeeded: ${succeeded}`);
  console.log(`✗ Failed: ${failed}`);
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
