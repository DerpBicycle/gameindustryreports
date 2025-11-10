import { createClient } from '@supabase/supabase-js';
import { Document, ProcessingRecord } from '@/types/document';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to convert Document to DB format
function documentToDb(doc: Document): any {
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

    // Metadata
    source: doc.metadata.source || null,
    year: doc.metadata.year || null,
    quarter: doc.metadata.quarter || null,
    region: doc.metadata.region || null,
    tags: doc.metadata.tags || [],
    description: doc.metadata.description || null,

    // AI Analysis
    ai_summary: doc.aiAnalysis?.summary || null,
    ai_key_insights: doc.aiAnalysis?.keyInsights || [],
    ai_topics: doc.aiAnalysis?.topics || [],
    ai_entities: doc.aiAnalysis?.entities ? JSON.stringify(doc.aiAnalysis.entities) : null,
    ai_sentiment: doc.aiAnalysis?.sentiment || null,
    ai_confidence: doc.aiAnalysis?.confidence || null,
    ai_page_count: doc.aiAnalysis?.pageCount || null,

    // Enhanced fields
    report_type: (doc.aiAnalysis as any)?.reportType || null,
    content_focus: (doc.aiAnalysis as any)?.contentFocus || [],
    geographic_scope: (doc.aiAnalysis as any)?.geographicScope || null,
    temporal_nature: (doc.aiAnalysis as any)?.temporalNature || [],
    data_characteristics: (doc.aiAnalysis as any)?.dataCharacteristics || null,
    target_audience: (doc.aiAnalysis as any)?.targetAudience || [],
    extracted_metrics: (doc.aiAnalysis as any)?.extractedMetrics ? JSON.stringify((doc.aiAnalysis as any).extractedMetrics) : null,
    key_findings: (doc.aiAnalysis as any)?.keyFindings || [],
    methodology: (doc.aiAnalysis as any)?.methodology || null,
    data_quality: (doc.aiAnalysis as any)?.dataQuality ? JSON.stringify((doc.aiAnalysis as any).dataQuality) : null,
  };
}

// Helper to convert DB format to Document
function dbToDocument(row: any): Document {
  const doc: Document = {
    id: row.id,
    title: row.title,
    fileName: row.file_name,
    filePath: row.file_path,
    fileSize: row.file_size,
    category: row.category,
    uploadDate: row.upload_date,
    processedDate: row.processed_date,
    processingStatus: row.processing_status,
    metadata: {
      source: row.source,
      year: row.year,
      quarter: row.quarter,
      region: row.region,
      tags: row.tags || [],
      description: row.description,
    },
  };

  // Add AI analysis if available
  if (row.ai_summary || row.ai_key_insights?.length > 0) {
    doc.aiAnalysis = {
      summary: row.ai_summary || '',
      keyInsights: row.ai_key_insights || [],
      topics: row.ai_topics || [],
      entities: row.ai_entities ? (typeof row.ai_entities === 'string' ? JSON.parse(row.ai_entities) : row.ai_entities) : [],
      sentiment: row.ai_sentiment,
      confidence: row.ai_confidence || 0,
      pageCount: row.ai_page_count,
      ...(row.report_type && { reportType: row.report_type }),
      ...(row.content_focus && { contentFocus: row.content_focus }),
      ...(row.geographic_scope && { geographicScope: row.geographic_scope }),
      ...(row.temporal_nature && { temporalNature: row.temporal_nature }),
      ...(row.data_characteristics && { dataCharacteristics: row.data_characteristics }),
      ...(row.target_audience && { targetAudience: row.target_audience }),
      ...(row.extracted_metrics && { extractedMetrics: typeof row.extracted_metrics === 'string' ? JSON.parse(row.extracted_metrics) : row.extracted_metrics }),
      ...(row.key_findings && { keyFindings: row.key_findings }),
      ...(row.methodology && { methodology: row.methodology }),
      ...(row.data_quality && { dataQuality: typeof row.data_quality === 'string' ? JSON.parse(row.data_quality) : row.data_quality }),
    };
  }

  return doc;
}

// Document operations
export async function getAllDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('upload_date', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }

  return data.map(dbToDocument);
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching document:', error);
    return null;
  }

  return data ? dbToDocument(data) : null;
}

export async function saveDocument(document: Document): Promise<void> {
  const dbDoc = documentToDb(document);

  const { error } = await supabase
    .from('documents')
    .upsert(dbDoc, { onConflict: 'id' });

  if (error) {
    console.error('Error saving document:', error);
    throw new Error(`Failed to save document: ${error.message}`);
  }
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting document:', error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

// Processing records operations
export async function getAllProcessingRecords(): Promise<ProcessingRecord[]> {
  const { data, error } = await supabase
    .from('processing_records')
    .select('*')
    .order('processed_at', { ascending: false });

  if (error) {
    console.error('Error fetching processing records:', error);
    return [];
  }

  return data.map(row => ({
    documentId: row.document_id,
    filePath: row.file_path,
    fileHash: row.file_hash,
    processedAt: row.processed_at,
    processingVersion: row.processing_version,
    status: row.status,
    error: row.error,
  }));
}

export async function getProcessingRecord(filePath: string): Promise<ProcessingRecord | null> {
  const { data, error } = await supabase
    .from('processing_records')
    .select('*')
    .eq('file_path', filePath)
    .order('processed_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    documentId: data.document_id,
    filePath: data.file_path,
    fileHash: data.file_hash,
    processedAt: data.processed_at,
    processingVersion: data.processing_version,
    status: data.status,
    error: data.error,
  };
}

export async function saveProcessingRecord(record: ProcessingRecord): Promise<void> {
  const { error } = await supabase
    .from('processing_records')
    .insert({
      document_id: record.documentId,
      file_path: record.filePath,
      file_hash: record.fileHash,
      processed_at: record.processedAt,
      processing_version: record.processingVersion,
      status: record.status,
      error: record.error || null,
    });

  if (error) {
    console.error('Error saving processing record:', error);
    throw new Error(`Failed to save processing record: ${error.message}`);
  }
}

export async function isDocumentProcessed(filePath: string): Promise<boolean> {
  const record = await getProcessingRecord(filePath);
  return record !== null && record.status === 'completed';
}

// Search and filter operations
export async function searchDocuments(query: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .or(`title.ilike.%${query}%,ai_summary.ilike.%${query}%,description.ilike.%${query}%`)
    .order('upload_date', { ascending: false });

  if (error) {
    console.error('Error searching documents:', error);
    return [];
  }

  return data.map(dbToDocument);
}

export async function filterDocuments(filters: {
  category?: string;
  year?: number;
  quarter?: string;
  region?: string;
  reportType?: string;
  processingStatus?: string;
}): Promise<Document[]> {
  let query = supabase.from('documents').select('*');

  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.year) {
    query = query.eq('year', filters.year);
  }
  if (filters.quarter) {
    query = query.eq('quarter', filters.quarter);
  }
  if (filters.region) {
    query = query.eq('region', filters.region);
  }
  if (filters.reportType) {
    query = query.eq('report_type', filters.reportType);
  }
  if (filters.processingStatus) {
    query = query.eq('processing_status', filters.processingStatus);
  }

  const { data, error } = await query.order('upload_date', { ascending: false });

  if (error) {
    console.error('Error filtering documents:', error);
    return [];
  }

  return data.map(dbToDocument);
}
