import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import crypto from 'crypto';
import pdf from 'pdf-parse';
import path from 'path';
import { Document, AIAnalysis, ProcessingRecord } from '@/types/document';
import { saveDocument, saveProcessingRecord } from '@/lib/database';
import { ENHANCED_TAXONOMY, ENTITY_TYPES, PROCESSING_PRIORITIES, SPECIAL_HANDLING } from '@/config/taxonomy';

const PROCESSING_VERSION = '2.0.0'; // Enhanced version
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface EnhancedAIAnalysis extends AIAnalysis {
  reportType: string;
  contentFocus: string[];
  geographicScope: string;
  temporalNature: string[];
  dataCharacteristics: string;
  targetAudience: string[];
  extractedMetrics: ExtractedMetric[];
  extractedEntities: ExtractedEntities;
  keyFindings: string[];
  methodology?: string;
  dataQuality: DataQuality;
}

interface ExtractedMetric {
  value: string;
  context: string;
  unit?: string;
  timeframe?: string;
  region?: string;
}

interface ExtractedEntities {
  companies: string[];
  games: string[];
  technologies: string[];
  regions: string[];
  genres: string[];
  platforms: string[];
  businessModels: string[];
}

interface DataQuality {
  textExtractionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  dataCompleteness: number; // 0-1
  confidence: number; // 0-1
  processingNotes: string[];
}

/**
 * Generate SHA-256 hash of file content
 */
async function generateFileHash(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

/**
 * Extract text from PDF
 */
async function extractPDFText(filePath: string): Promise<{ text: string; pageCount: number }> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);

    return {
      text: data.text,
      pageCount: data.numpages
    };
  } catch (error) {
    throw new Error(`Failed to extract PDF text: ${error}`);
  }
}

/**
 * Assess document characteristics to determine processing approach
 */
function assessDocumentCharacteristics(text: string, pageCount: number): {
  approach: string;
  textQuality: 'excellent' | 'good' | 'fair' | 'poor';
  estimatedDataIntensity: 'very_high' | 'high' | 'medium' | 'low';
} {
  const textLength = text.length;
  const textPerPage = textLength / pageCount;

  // Assess text extraction quality
  let textQuality: 'excellent' | 'good' | 'fair' | 'poor';
  if (textPerPage > 1500) {
    textQuality = 'excellent';
  } else if (textPerPage > 800) {
    textQuality = 'good';
  } else if (textPerPage > 300) {
    textQuality = 'fair';
  } else {
    textQuality = 'poor';
  }

  // Determine approach based on characteristics
  let approach = 'standard';
  if (textQuality === 'poor') {
    approach = SPECIAL_HANDLING.chartHeavy.approach;
  } else if (text.match(/\$[\d,.]+[BM]|[\d,.]+%|[\d,.]+[Mm]illion/gi)?.length || 0 > 50) {
    approach = SPECIAL_HANDLING.dataIntensive.approach;
  } else if (text.match(/trend|forecast|prediction|outlook/gi)?.length || 0 > 20) {
    approach = SPECIAL_HANDLING.narrative.approach;
  }

  // Estimate data intensity
  const metricPatterns = text.match(/\d+[\d,.]*\s*(?:%|billion|million|thousand|\$|users|players)/gi) || [];
  let estimatedDataIntensity: 'very_high' | 'high' | 'medium' | 'low';
  if (metricPatterns.length > 100) {
    estimatedDataIntensity = 'very_high';
  } else if (metricPatterns.length > 50) {
    estimatedDataIntensity = 'high';
  } else if (metricPatterns.length > 20) {
    estimatedDataIntensity = 'medium';
  } else {
    estimatedDataIntensity = 'low';
  }

  return { approach, textQuality, estimatedDataIntensity };
}

/**
 * Chunk text for processing
 */
function chunkText(text: string, maxChunkSize: number = 100000): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = '';

  const paragraphs = text.split(/\n\n+/);

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length <= maxChunkSize) {
      currentChunk += paragraph + '\n\n';
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = paragraph + '\n\n';
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Enhanced AI analysis with Claude
 */
async function analyzeWithClaude(
  text: string,
  document: Document,
  characteristics: ReturnType<typeof assessDocumentCharacteristics>
): Promise<EnhancedAIAnalysis> {
  const chunks = chunkText(text);
  const analysisPrompt = `You are analyzing a game industry report. Provide a comprehensive, structured analysis.

Document Title: ${document.title}
Category: ${document.category}
Source: ${document.metadata.source || 'Unknown'}
Year: ${document.metadata.year || 'Unknown'}
Text Quality: ${characteristics.textQuality}
Estimated Data Intensity: ${characteristics.estimatedDataIntensity}

TAXONOMY FOR CLASSIFICATION:
Report Types: ${ENHANCED_TAXONOMY.reportTypes.join(', ')}
Content Focus Areas: ${ENHANCED_TAXONOMY.contentFocus.join(', ')}
Geographic Scopes: ${ENHANCED_TAXONOMY.geographicScope.join(', ')}
Temporal Nature: ${ENHANCED_TAXONOMY.temporalNature.join(', ')}
Data Characteristics: ${ENHANCED_TAXONOMY.dataCharacteristics.join(', ')}

Analyze the following document excerpt (${chunks.length > 1 ? 'part 1 of ' + chunks.length : 'complete'}):

${chunks[0].substring(0, 80000)}

Provide your analysis in this JSON format:
{
  "reportType": "string (choose from taxonomy)",
  "contentFocus": ["array of strings (choose from taxonomy)"],
  "geographicScope": "string (choose from taxonomy)",
  "temporalNature": ["array of strings (choose from taxonomy)"],
  "dataCharacteristics": "string (choose from taxonomy)",
  "targetAudience": ["array of strings"],

  "summary": "2-3 paragraph executive summary focusing on key insights and findings",

  "keyFindings": [
    "Finding 1",
    "Finding 2",
    "Finding 3",
    "Finding 4",
    "Finding 5"
  ],

  "keyInsights": [
    "Actionable insight 1",
    "Actionable insight 2",
    "Actionable insight 3",
    "Actionable insight 4",
    "Actionable insight 5"
  ],

  "topics": ["topic1", "topic2", "topic3", "topic4", "topic5"],

  "extractedMetrics": [
    {
      "value": "31.7M",
      "context": "paying cloud gaming users globally",
      "unit": "users",
      "timeframe": "2022",
      "region": "Global"
    }
  ],

  "extractedEntities": {
    "companies": ["Company1", "Company2"],
    "games": ["Game1", "Game2"],
    "technologies": ["Tech1", "Tech2"],
    "regions": ["Region1", "Region2"],
    "genres": ["Genre1", "Genre2"],
    "platforms": ["Platform1", "Platform2"],
    "businessModels": ["Model1", "Model2"]
  },

  "methodology": "Brief description of research methodology if mentioned",

  "sentiment": "positive/neutral/negative",
  "confidence": 0.85
}

Focus on extracting concrete data points, metrics, and insights. Be precise and comprehensive.`;

  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < MAX_RETRIES) {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ]
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Process multiple chunks if needed
      if (chunks.length > 1) {
        // Process additional chunks and merge results
        for (let i = 1; i < Math.min(chunks.length, 3); i++) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting

          const chunkPrompt = `Continue analyzing part ${i + 1} of ${chunks.length}. Extract any additional metrics, entities, and insights not captured in previous parts.

${chunks[i].substring(0, 80000)}

Return only additional findings in the same JSON format, focusing on NEW information.`;

          const chunkMessage = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2048,
            messages: [{ role: 'user', content: chunkPrompt }]
          });

          const chunkText = chunkMessage.content[0].type === 'text' ? chunkMessage.content[0].text : '';
          const chunkJson = chunkText.match(/\{[\s\S]*\}/);

          if (chunkJson) {
            const chunkAnalysis = JSON.parse(chunkJson[0]);

            // Merge results (avoid duplicates)
            if (chunkAnalysis.extractedMetrics) {
              analysis.extractedMetrics = [
                ...(analysis.extractedMetrics || []),
                ...chunkAnalysis.extractedMetrics
              ];
            }

            if (chunkAnalysis.keyFindings) {
              analysis.keyFindings = [
                ...new Set([...(analysis.keyFindings || []), ...chunkAnalysis.keyFindings])
              ];
            }

            if (chunkAnalysis.extractedEntities) {
              Object.keys(chunkAnalysis.extractedEntities).forEach(key => {
                if (analysis.extractedEntities[key]) {
                  analysis.extractedEntities[key] = [
                    ...new Set([
                      ...analysis.extractedEntities[key],
                      ...chunkAnalysis.extractedEntities[key]
                    ])
                  ];
                }
              });
            }
          }
        }
      }

      // Calculate data quality
      const dataQuality: DataQuality = {
        textExtractionQuality: characteristics.textQuality,
        dataCompleteness: Math.min(1, (analysis.extractedMetrics?.length || 0) / 20 + 0.5),
        confidence: analysis.confidence || 0.75,
        processingNotes: [
          `Processed ${chunks.length} chunk(s)`,
          `Text quality: ${characteristics.textQuality}`,
          `Approach: ${characteristics.approach}`
        ]
      };

      return {
        ...analysis,
        dataQuality,
        ocrText: text.substring(0, 10000),
        pageCount: Math.ceil(text.length / 2000)
      };

    } catch (error) {
      lastError = error as Error;
      attempts++;

      if (attempts < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempts));
      }
    }
  }

  throw new Error(`Failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

/**
 * Process a document with enhanced AI analysis
 */
export async function processDocumentEnhanced(
  document: Document,
  onProgress?: (stage: string, progress: number) => void
): Promise<{ document: Document; record: ProcessingRecord }> {
  try {
    onProgress?.('Initializing enhanced processing', 0);

    // Generate file hash
    const fullPath = path.join(process.cwd(), document.filePath);
    const fileHash = await generateFileHash(fullPath);

    onProgress?.('Extracting PDF content', 20);

    // Extract PDF text
    const { text, pageCount } = await extractPDFText(fullPath);

    onProgress?.('Assessing document characteristics', 30);

    // Assess document characteristics
    const characteristics = assessDocumentCharacteristics(text, pageCount);

    onProgress?.('Analyzing with Claude AI', 40);

    // Analyze with Claude
    const analysis = await analyzeWithClaude(text, document, characteristics);

    onProgress?.('Finalizing results', 90);

    // Update document with enhanced analysis
    const updatedDocument: Document = {
      ...document,
      processingStatus: 'completed',
      processedDate: new Date().toISOString(),
      aiAnalysis: analysis
    };

    // Create processing record
    const record: ProcessingRecord = {
      documentId: document.id,
      filePath: document.filePath,
      fileHash,
      processedAt: new Date().toISOString(),
      processingVersion: PROCESSING_VERSION,
      status: 'completed'
    };

    // Save to database
    await saveDocument(updatedDocument);
    await saveProcessingRecord(record);

    onProgress?.('Enhanced processing complete', 100);

    return { document: updatedDocument, record };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    const record: ProcessingRecord = {
      documentId: document.id,
      filePath: document.filePath,
      fileHash: '',
      processedAt: new Date().toISOString(),
      processingVersion: PROCESSING_VERSION,
      status: 'failed',
      error: errorMessage
    };

    await saveProcessingRecord(record);

    throw error;
  }
}

/**
 * Batch process documents with priority ordering
 */
export async function batchProcessDocuments(
  documents: Document[],
  onProgress?: (current: number, total: number, documentTitle: string) => void
): Promise<{ succeeded: number; failed: number; results: Array<{ document: Document; success: boolean; error?: string }> }> {
  // Sort by priority
  const sortedDocuments = [...documents].sort((a, b) => {
    const aPriority = PROCESSING_PRIORITIES.high.some(type =>
      a.category.includes(type) || a.title.includes(type)
    ) ? 3 : PROCESSING_PRIORITIES.medium.some(type =>
      a.category.includes(type) || a.title.includes(type)
    ) ? 2 : 1;

    const bPriority = PROCESSING_PRIORITIES.high.some(type =>
      b.category.includes(type) || b.title.includes(type)
    ) ? 3 : PROCESSING_PRIORITIES.medium.some(type =>
      b.category.includes(type) || b.title.includes(type)
    ) ? 2 : 1;

    return bPriority - aPriority;
  });

  let succeeded = 0;
  let failed = 0;
  const results: Array<{ document: Document; success: boolean; error?: string }> = [];

  for (let i = 0; i < sortedDocuments.length; i++) {
    const doc = sortedDocuments[i];
    onProgress?.(i + 1, sortedDocuments.length, doc.title);

    try {
      const result = await processDocumentEnhanced(doc);
      succeeded++;
      results.push({ document: result.document, success: true });
    } catch (error) {
      failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ document: doc, success: false, error: errorMessage });
    }

    // Rate limiting between documents
    if (i < sortedDocuments.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return { succeeded, failed, results };
}
