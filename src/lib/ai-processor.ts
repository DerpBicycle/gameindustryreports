import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { AIAnalysis, Document, ProcessingRecord } from '@/types/document';
import {
  getProcessingRecord,
  saveDocument,
  saveProcessingRecord,
} from './database';

// Constants
const PROCESSING_VERSION = '1.0.0';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const CHUNK_SIZE = 100000; // Characters per chunk for large documents
const MAX_TOKENS = 4096; // Max tokens for Claude API response

// Initialize Anthropic client
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Generate SHA-256 hash of a file
 */
export async function generateFileHash(filePath: string): Promise<string> {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    throw new Error(`Failed to generate file hash: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text content from PDF file
 */
export async function extractPDFText(filePath: string): Promise<{
  text: string;
  pageCount: number;
}> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);

    return {
      text: data.text,
      pageCount: data.numpages,
    };
  } catch (error) {
    throw new Error(`Failed to extract PDF text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Split text into chunks for processing large documents
 */
function chunkText(text: string, maxChunkSize: number = CHUNK_SIZE): string[] {
  const chunks: string[] = [];

  if (text.length <= maxChunkSize) {
    return [text];
  }

  // Split by paragraphs first to maintain context
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length <= maxChunkSize) {
      currentChunk += paragraph + '\n\n';
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      // If single paragraph is too large, split by sentences
      if (paragraph.length > maxChunkSize) {
        const sentences = paragraph.split(/\.\s+/);
        let sentenceChunk = '';

        for (const sentence of sentences) {
          if ((sentenceChunk + sentence).length <= maxChunkSize) {
            sentenceChunk += sentence + '. ';
          } else {
            if (sentenceChunk) {
              chunks.push(sentenceChunk.trim());
            }
            sentenceChunk = sentence + '. ';
          }
        }

        if (sentenceChunk) {
          currentChunk = sentenceChunk;
        }
      } else {
        currentChunk = paragraph + '\n\n';
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call Claude API with retry logic
 */
async function callClaudeWithRetry(
  prompt: string,
  systemPrompt: string,
  retries: number = MAX_RETRIES
): Promise<string> {
  const client = getAnthropicClient();

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract text content from response
      const textContent = response.content.find(
        (block) => block.type === 'text'
      );

      if (textContent && textContent.type === 'text') {
        return textContent.text;
      }

      throw new Error('No text content in Claude response');
    } catch (error) {
      const isLastAttempt = attempt === retries - 1;

      if (isLastAttempt) {
        throw new Error(`Claude API call failed after ${retries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Exponential backoff
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw new Error('Claude API call failed');
}

/**
 * Generate AI analysis for a document chunk
 */
async function analyzeDocumentChunk(
  text: string,
  isFirstChunk: boolean = true
): Promise<{
  summary: string;
  keyInsights: string[];
  topics: string[];
  entities: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  category: string;
}> {
  const systemPrompt = `You are an expert analyst specializing in game industry reports and market intelligence. Your task is to analyze documents and extract structured information.`;

  const analysisPrompt = `Analyze the following document ${isFirstChunk ? '' : 'excerpt'} and provide a structured analysis:

${text}

Please provide your analysis in the following JSON format:
{
  "summary": "A 2-3 paragraph summary of the main points",
  "keyInsights": ["insight 1", "insight 2", "insight 3", "..."],
  "topics": ["topic 1", "topic 2", "..."],
  "entities": ["company/product/region 1", "company/product/region 2", "..."],
  "sentiment": "positive" or "neutral" or "negative",
  "category": "Choose one: Market Report, Financial Analysis, User Research, Industry Trends, Competitive Analysis, Technology Overview, Regional Analysis, or Other"
}

Guidelines:
- Summary: Focus on the main findings, trends, and conclusions
- Key Insights: Extract 5-10 actionable insights or important takeaways
- Topics: Identify 3-10 main topics (e.g., "mobile gaming", "monetization", "esports")
- Entities: Extract companies, products, regions, or technologies mentioned (10-20 items)
- Sentiment: Overall tone of the report (positive = optimistic/growth, neutral = factual, negative = concerns/decline)
- Category: Choose the most appropriate category from the list

Return ONLY valid JSON, no additional text.`;

  try {
    const response = await callClaudeWithRetry(analysisPrompt, systemPrompt);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Claude response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!analysis.summary || !analysis.keyInsights || !analysis.topics ||
        !analysis.entities || !analysis.sentiment || !analysis.category) {
      throw new Error('Missing required fields in analysis response');
    }

    return analysis;
  } catch (error) {
    throw new Error(`Failed to analyze document chunk: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Merge analyses from multiple chunks
 */
function mergeAnalyses(analyses: Array<{
  summary: string;
  keyInsights: string[];
  topics: string[];
  entities: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  category: string;
}>): {
  summary: string;
  keyInsights: string[];
  topics: string[];
  entities: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  category: string;
} {
  if (analyses.length === 0) {
    throw new Error('No analyses to merge');
  }

  if (analyses.length === 1) {
    return analyses[0];
  }

  // Merge summaries (use first chunk's summary as primary, append key points from others)
  const summary = analyses[0].summary;

  // Deduplicate and merge key insights
  const allInsights = analyses.flatMap(a => a.keyInsights);
  const uniqueInsights = Array.from(new Set(allInsights)).slice(0, 10);

  // Deduplicate and merge topics
  const allTopics = analyses.flatMap(a => a.topics);
  const topicCounts = allTopics.reduce((acc, topic) => {
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic)
    .slice(0, 10);

  // Deduplicate and merge entities
  const allEntities = analyses.flatMap(a => a.entities);
  const entityCounts = allEntities.reduce((acc, entity) => {
    acc[entity] = (acc[entity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const entities = Object.entries(entityCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([entity]) => entity)
    .slice(0, 20);

  // Use most common sentiment
  const sentiments = analyses.map(a => a.sentiment);
  const sentimentCounts = sentiments.reduce((acc, sent) => {
    acc[sent] = (acc[sent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const sentiment = Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1])[0][0] as 'positive' | 'neutral' | 'negative';

  // Use most common category
  const categories = analyses.map(a => a.category);
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const category = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0][0];

  return {
    summary,
    keyInsights: uniqueInsights,
    topics,
    entities,
    sentiment,
    category,
  };
}

/**
 * Process a PDF document with AI analysis
 */
export async function processDocument(
  document: Document,
  onProgress?: (stage: string, progress: number) => void
): Promise<{
  document: Document;
  aiAnalysis: AIAnalysis;
}> {
  const filePath = path.join(process.cwd(), document.filePath);

  try {
    // Update progress
    onProgress?.('Checking processing status', 0);

    // Generate file hash
    const fileHash = await generateFileHash(filePath);

    // Check if already processed
    const existingRecord = await getProcessingRecord(document.filePath);
    if (existingRecord &&
        existingRecord.status === 'completed' &&
        existingRecord.fileHash === fileHash) {
      throw new Error('Document already processed with same hash');
    }

    // Update progress
    onProgress?.('Extracting PDF text', 10);

    // Extract PDF text
    const { text, pageCount } = await extractPDFText(filePath);

    if (!text || text.trim().length === 0) {
      throw new Error('No text content extracted from PDF');
    }

    // Update progress
    onProgress?.('Chunking document', 20);

    // Split into chunks if necessary
    const chunks = chunkText(text);
    const totalChunks = chunks.length;

    // Update progress
    onProgress?.('Analyzing with Claude AI', 30);

    // Analyze each chunk
    const analyses = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkProgress = 30 + (50 * (i / totalChunks));
      onProgress?.(`Analyzing chunk ${i + 1}/${totalChunks}`, chunkProgress);

      const analysis = await analyzeDocumentChunk(chunks[i], i === 0);
      analyses.push(analysis);

      // Small delay between chunks to avoid rate limiting
      if (i < totalChunks - 1) {
        await sleep(1000);
      }
    }

    // Update progress
    onProgress?.('Merging analysis results', 80);

    // Merge analyses from all chunks
    const mergedAnalysis = mergeAnalyses(analyses);

    // Create AI analysis object
    const aiAnalysis: AIAnalysis = {
      summary: mergedAnalysis.summary,
      keyInsights: mergedAnalysis.keyInsights,
      topics: mergedAnalysis.topics,
      entities: mergedAnalysis.entities,
      sentiment: mergedAnalysis.sentiment,
      confidence: totalChunks === 1 ? 0.95 : Math.max(0.7, 0.95 - (totalChunks * 0.05)),
      ocrText: text.substring(0, 10000), // Store first 10k chars for search
      pageCount,
    };

    // Update progress
    onProgress?.('Saving results', 90);

    // Update document with AI analysis
    const updatedDocument: Document = {
      ...document,
      category: mergedAnalysis.category,
      processingStatus: 'completed',
      processedDate: new Date().toISOString(),
      aiAnalysis,
      metadata: {
        ...document.metadata,
        tags: [...new Set([...document.metadata.tags, ...mergedAnalysis.topics])],
      },
    };

    // Save updated document
    await saveDocument(updatedDocument);

    // Save processing record
    const processingRecord: ProcessingRecord = {
      documentId: document.id,
      filePath: document.filePath,
      fileHash,
      processedAt: new Date().toISOString(),
      processingVersion: PROCESSING_VERSION,
      status: 'completed',
    };
    await saveProcessingRecord(processingRecord);

    // Update progress
    onProgress?.('Complete', 100);

    return {
      document: updatedDocument,
      aiAnalysis,
    };
  } catch (error) {
    // Save failed processing record
    const fileHash = await generateFileHash(filePath).catch(() => 'unknown');
    const processingRecord: ProcessingRecord = {
      documentId: document.id,
      filePath: document.filePath,
      fileHash,
      processedAt: new Date().toISOString(),
      processingVersion: PROCESSING_VERSION,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    await saveProcessingRecord(processingRecord);

    // Update document status
    const failedDocument: Document = {
      ...document,
      processingStatus: 'failed',
    };
    await saveDocument(failedDocument);

    throw error;
  }
}

/**
 * Check if a document needs processing
 */
export async function shouldProcessDocument(filePath: string): Promise<{
  shouldProcess: boolean;
  reason: string;
}> {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const currentHash = await generateFileHash(fullPath);
    const existingRecord = await getProcessingRecord(filePath);

    if (!existingRecord) {
      return {
        shouldProcess: true,
        reason: 'No processing record found',
      };
    }

    if (existingRecord.status === 'failed') {
      return {
        shouldProcess: true,
        reason: 'Previous processing attempt failed',
      };
    }

    if (existingRecord.fileHash !== currentHash) {
      return {
        shouldProcess: true,
        reason: 'File has been modified',
      };
    }

    if (existingRecord.processingVersion !== PROCESSING_VERSION) {
      return {
        shouldProcess: true,
        reason: 'Processing version updated',
      };
    }

    return {
      shouldProcess: false,
      reason: 'Document already processed',
    };
  } catch (error) {
    return {
      shouldProcess: true,
      reason: `Error checking processing status: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Batch process multiple documents
 */
export async function batchProcessDocuments(
  documents: Document[],
  onProgress?: (documentIndex: number, stage: string, progress: number) => void,
  onDocumentComplete?: (document: Document, success: boolean, error?: string) => void
): Promise<{
  successful: number;
  failed: number;
  skipped: number;
  results: Array<{
    document: Document;
    success: boolean;
    error?: string;
  }>;
}> {
  const results: Array<{
    document: Document;
    success: boolean;
    error?: string;
  }> = [];

  let successful = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < documents.length; i++) {
    const document = documents[i];

    try {
      // Check if document needs processing
      const { shouldProcess, reason } = await shouldProcessDocument(document.filePath);

      if (!shouldProcess) {
        skipped++;
        results.push({
          document,
          success: true,
          error: `Skipped: ${reason}`,
        });
        onDocumentComplete?.(document, true, `Skipped: ${reason}`);
        continue;
      }

      // Process document
      const { document: updatedDocument } = await processDocument(
        document,
        (stage, progress) => {
          onProgress?.(i, stage, progress);
        }
      );

      successful++;
      results.push({
        document: updatedDocument,
        success: true,
      });
      onDocumentComplete?.(updatedDocument, true);
    } catch (error) {
      failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        document,
        success: false,
        error: errorMessage,
      });
      onDocumentComplete?.(document, false, errorMessage);
    }

    // Delay between documents to avoid rate limiting
    if (i < documents.length - 1) {
      await sleep(2000);
    }
  }

  return {
    successful,
    failed,
    skipped,
    results,
  };
}
