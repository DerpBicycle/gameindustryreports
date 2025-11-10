-- Game Industry Reports Database Schema

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  category TEXT NOT NULL,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_date TIMESTAMPTZ,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),

  -- Metadata
  source TEXT,
  year INTEGER,
  quarter TEXT,
  region TEXT,
  tags TEXT[],
  description TEXT,

  -- AI Analysis
  ai_summary TEXT,
  ai_key_insights TEXT[],
  ai_topics TEXT[],
  ai_entities JSONB,
  ai_sentiment TEXT,
  ai_confidence DECIMAL(3,2),
  ai_page_count INTEGER,

  -- Enhanced fields
  report_type TEXT,
  content_focus TEXT[],
  geographic_scope TEXT,
  temporal_nature TEXT[],
  data_characteristics TEXT,
  target_audience TEXT[],
  extracted_metrics JSONB,
  key_findings TEXT[],
  methodology TEXT,
  data_quality JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Processing records table
CREATE TABLE IF NOT EXISTS processing_records (
  id SERIAL PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processing_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
  error TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_year ON documents(year);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_source ON documents(source);
CREATE INDEX IF NOT EXISTS idx_documents_report_type ON documents(report_type);
CREATE INDEX IF NOT EXISTS idx_processing_records_document_id ON processing_records(document_id);
CREATE INDEX IF NOT EXISTS idx_processing_records_file_hash ON processing_records(file_hash);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_documents_title_search ON documents USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_documents_summary_search ON documents USING GIN (to_tsvector('english', COALESCE(ai_summary, '')));

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
