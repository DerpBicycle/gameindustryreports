import { promises as fs } from 'fs';
import path from 'path';
import { Document, ProcessingRecord } from '@/types/document';

const DATA_DIR = path.join(process.cwd(), 'data');
const DOCUMENTS_DB = path.join(DATA_DIR, 'documents.json');
const PROCESSING_DB = path.join(DATA_DIR, 'processing-records.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

// Document operations
export async function getAllDocuments(): Promise<Document[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DOCUMENTS_DB, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const documents = await getAllDocuments();
  return documents.find(doc => doc.id === id) || null;
}

export async function saveDocument(document: Document): Promise<void> {
  await ensureDataDir();
  const documents = await getAllDocuments();
  const index = documents.findIndex(doc => doc.id === document.id);

  if (index >= 0) {
    documents[index] = document;
  } else {
    documents.push(document);
  }

  await fs.writeFile(DOCUMENTS_DB, JSON.stringify(documents, null, 2));
}

export async function deleteDocument(id: string): Promise<void> {
  const documents = await getAllDocuments();
  const filtered = documents.filter(doc => doc.id !== id);
  await fs.writeFile(DOCUMENTS_DB, JSON.stringify(filtered, null, 2));
}

// Processing records operations
export async function getAllProcessingRecords(): Promise<ProcessingRecord[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(PROCESSING_DB, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function getProcessingRecord(filePath: string): Promise<ProcessingRecord | null> {
  const records = await getAllProcessingRecords();
  return records.find(record => record.filePath === filePath) || null;
}

export async function saveProcessingRecord(record: ProcessingRecord): Promise<void> {
  await ensureDataDir();
  const records = await getAllProcessingRecords();
  const index = records.findIndex(r => r.filePath === record.filePath);

  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }

  await fs.writeFile(PROCESSING_DB, JSON.stringify(records, null, 2));
}

export async function isDocumentProcessed(filePath: string): Promise<boolean> {
  const record = await getProcessingRecord(filePath);
  return record !== null && record.status === 'completed';
}
