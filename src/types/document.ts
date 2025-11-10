export interface Document {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  category: string;
  uploadDate: string;
  processedDate?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  metadata: DocumentMetadata;
  aiAnalysis?: AIAnalysis;
}

export interface DocumentMetadata {
  source?: string;
  year?: number;
  quarter?: string;
  region?: string;
  tags: string[];
  description?: string;
}

export interface AIAnalysis {
  summary: string;
  keyInsights: string[];
  topics: string[];
  entities: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  confidence: number;
  ocrText?: string;
  pageCount?: number;
}

export interface ProcessingRecord {
  documentId: string;
  filePath: string;
  fileHash: string;
  processedAt: string;
  processingVersion: string;
  status: 'completed' | 'failed';
  error?: string;
}

export interface FilterOptions {
  category?: string;
  year?: number;
  quarter?: string;
  region?: string;
  tags?: string[];
  searchQuery?: string;
  sortBy?: 'date' | 'title' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}
