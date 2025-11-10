# AI Processing Pipeline Documentation

## Overview

The AI Processing Pipeline is a robust system for automatically analyzing PDF documents using the Anthropic Claude API. It extracts text content, generates summaries, identifies key insights, extracts entities, and categorizes documents.

## Architecture

### Core Components

1. **File Hash Generation** - Creates SHA-256 hashes to track file changes
2. **PDF Text Extraction** - Extracts text content from PDF files using pdf-parse
3. **Text Chunking** - Splits large documents into manageable chunks
4. **Claude API Integration** - Analyzes content using Claude 3.5 Sonnet
5. **Result Aggregation** - Merges analyses from multiple chunks
6. **Processing Records** - Tracks processing status and prevents reprocessing

### Features

- **Automatic Deduplication**: Checks file hashes to avoid reprocessing unchanged files
- **Retry Logic**: Automatically retries failed API calls with exponential backoff
- **Chunk Processing**: Handles large documents by splitting into smaller chunks
- **Progress Tracking**: Provides real-time progress updates
- **Error Handling**: Comprehensive error handling with detailed error messages
- **Batch Processing**: Process multiple documents in sequence

## Setup

### 1. Install Dependencies

The required dependencies are already in package.json:

```bash
npm install
```

Required packages:
- `@anthropic-ai/sdk` - Anthropic Claude API client
- `pdf-parse` - PDF text extraction
- Built-in Node.js `crypto` module for hashing

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Add your Anthropic API key:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Get your API key from: https://console.anthropic.com/

### 3. Verify Setup

Test that the processor can access the Claude API:

```typescript
import { getAnthropicClient } from '@/lib/ai-processor';

try {
  const client = getAnthropicClient();
  console.log('✅ Claude API client initialized');
} catch (error) {
  console.error('❌ API key not configured');
}
```

## Usage

### Basic Usage

```typescript
import { processDocument } from '@/lib/ai-processor';
import { getDocumentById } from '@/lib/database';

// Process a single document
const document = await getDocumentById('doc-id');

const result = await processDocument(
  document,
  (stage, progress) => {
    console.log(`${stage}: ${progress}%`);
  }
);

console.log('Analysis:', result.aiAnalysis);
```

### Batch Processing

```typescript
import { batchProcessDocuments } from '@/lib/ai-processor';
import { getAllDocuments } from '@/lib/database';

const documents = await getAllDocuments();

const results = await batchProcessDocuments(
  documents,
  (docIndex, stage, progress) => {
    console.log(`[${docIndex + 1}] ${stage}: ${progress}%`);
  },
  (document, success, error) => {
    if (success) {
      console.log(`✅ ${document.fileName} completed`);
    } else {
      console.log(`❌ ${document.fileName} failed: ${error}`);
    }
  }
);

console.log(`Processed: ${results.successful}`);
console.log(`Failed: ${results.failed}`);
console.log(`Skipped: ${results.skipped}`);
```

### Check Processing Status

```typescript
import { shouldProcessDocument } from '@/lib/ai-processor';

const { shouldProcess, reason } = await shouldProcessDocument(
  '/path/to/document.pdf'
);

if (shouldProcess) {
  console.log(`Should process: ${reason}`);
} else {
  console.log(`Skip processing: ${reason}`);
}
```

### Generate File Hash

```typescript
import { generateFileHash } from '@/lib/ai-processor';

const hash = await generateFileHash('/path/to/file.pdf');
console.log('File hash:', hash);
```

## CLI Script

Use the included CLI script to process documents:

### Process All Documents

```bash
npx tsx scripts/process-documents.ts
```

### Process Single Document

```bash
npx tsx scripts/process-documents.ts "filename.pdf"
```

## API Integration

### Claude API Configuration

The processor uses Claude 3.5 Sonnet with the following settings:

- **Model**: `claude-3-5-sonnet-20241022`
- **Max Tokens**: 4,096 tokens per response
- **Retry Attempts**: 3 attempts with exponential backoff
- **Rate Limiting**: 1-2 second delays between chunks/documents

### Prompt Structure

The processor uses structured prompts to extract:

1. **Summary**: 2-3 paragraph overview
2. **Key Insights**: 5-10 actionable takeaways
3. **Topics**: 3-10 main subjects
4. **Entities**: Companies, products, regions (10-20 items)
5. **Sentiment**: positive, neutral, or negative
6. **Category**: Document classification

### Response Format

Claude returns structured JSON:

```json
{
  "summary": "Executive summary...",
  "keyInsights": ["insight 1", "insight 2"],
  "topics": ["mobile gaming", "monetization"],
  "entities": ["Unity", "Epic Games", "North America"],
  "sentiment": "positive",
  "category": "Market Report"
}
```

## Document Categories

The processor classifies documents into these categories:

- **Market Report** - Industry analysis and market trends
- **Financial Analysis** - Revenue, earnings, and financial data
- **User Research** - Player behavior and preferences
- **Industry Trends** - Emerging patterns and technologies
- **Competitive Analysis** - Company and product comparisons
- **Technology Overview** - Technical developments
- **Regional Analysis** - Geographic market studies
- **Other** - Uncategorized content

## Processing Pipeline

### Step-by-Step Flow

1. **Check Processing Status** (0%)
   - Generate file hash
   - Check processing records
   - Determine if processing is needed

2. **Extract PDF Text** (10%)
   - Parse PDF file
   - Extract text content
   - Count pages

3. **Chunk Document** (20%)
   - Split text into chunks (100k chars max)
   - Maintain paragraph boundaries
   - Preserve context

4. **Analyze with AI** (30-80%)
   - Process each chunk with Claude
   - Extract structured data
   - Apply retry logic

5. **Merge Results** (80%)
   - Combine chunk analyses
   - Deduplicate topics/entities
   - Calculate confidence score

6. **Save Results** (90%)
   - Update document record
   - Save AI analysis
   - Create processing record

7. **Complete** (100%)

### Chunk Processing

For large documents:

- **Chunk Size**: 100,000 characters
- **Strategy**: Split by paragraphs, then sentences
- **Context**: Maintains natural text boundaries
- **Delay**: 1 second between chunks to avoid rate limits

### Confidence Scoring

- Single chunk: 95% confidence
- Multiple chunks: 95% - (5% × number of chunks)
- Minimum: 70% confidence

## Error Handling

### Automatic Retries

The processor automatically retries failed operations:

- **API Calls**: 3 attempts with exponential backoff
- **Initial Delay**: 2 seconds
- **Backoff**: 2x multiplier per attempt
- **Max Delay**: 8 seconds

### Error Types

1. **Configuration Errors**
   - Missing API key
   - Invalid environment setup

2. **File Errors**
   - File not found
   - Corrupted PDF
   - Empty content

3. **API Errors**
   - Rate limiting
   - Network timeouts
   - Invalid responses

4. **Processing Errors**
   - JSON parsing failures
   - Missing required fields
   - Chunk processing failures

### Error Recovery

Failed processing:
- Saves error in processing record
- Updates document status to 'failed'
- Can be retried later
- Error message preserved for debugging

## Performance

### Processing Times

- **Small document** (10 pages): ~30-45 seconds
- **Medium document** (50 pages): ~60-90 seconds
- **Large document** (200+ pages): ~3-5 minutes

### Rate Limits

- **Delay between chunks**: 1 second
- **Delay between documents**: 2 seconds
- **API retry backoff**: 2-8 seconds

### Optimization Tips

1. Process documents during off-peak hours
2. Use batch processing for multiple documents
3. Monitor API usage and costs
4. Implement caching for frequently accessed content

## Data Storage

### Processing Records

Stored in `/data/processing-records.json`:

```json
{
  "documentId": "doc-123",
  "filePath": "/uploads/report.pdf",
  "fileHash": "a1b2c3...",
  "processedAt": "2025-01-15T10:30:00Z",
  "processingVersion": "1.0.0",
  "status": "completed",
  "error": null
}
```

### Document Updates

AI analysis added to document record:

```json
{
  "id": "doc-123",
  "aiAnalysis": {
    "summary": "...",
    "keyInsights": ["..."],
    "topics": ["..."],
    "entities": ["..."],
    "sentiment": "positive",
    "confidence": 0.95,
    "ocrText": "...",
    "pageCount": 42
  }
}
```

## Monitoring

### Progress Tracking

```typescript
const result = await processDocument(document, (stage, progress) => {
  // Log or update UI
  console.log(`${stage}: ${Math.round(progress)}%`);
});
```

Progress stages:
- Checking processing status
- Extracting PDF text
- Chunking document
- Analyzing with Claude AI
- Analyzing chunk N/M
- Merging analysis results
- Saving results
- Complete

### Batch Processing Stats

```typescript
const { successful, failed, skipped, results } = await batchProcessDocuments(
  documents
);

console.log(`Success rate: ${(successful / documents.length * 100).toFixed(1)}%`);
```

## Troubleshooting

### Common Issues

1. **"ANTHROPIC_API_KEY environment variable is not set"**
   - Add API key to `.env.local`
   - Restart the development server

2. **"Failed to extract PDF text"**
   - Verify PDF is not corrupted
   - Check file permissions
   - Ensure pdf-parse is installed

3. **"Claude API call failed after 3 attempts"**
   - Check internet connection
   - Verify API key is valid
   - Check API usage limits

4. **"No text content extracted from PDF"**
   - PDF may be image-only (scanned)
   - Consider using OCR preprocessing
   - Check PDF is not password-protected

### Debug Mode

Enable detailed logging:

```typescript
// Add at the start of processing
console.log('Processing document:', document.fileName);
console.log('File path:', document.filePath);
console.log('File size:', document.fileSize);

// Add in progress callback
const result = await processDocument(document, (stage, progress) => {
  console.log(`[${new Date().toISOString()}] ${stage}: ${progress}%`);
});
```

## Cost Estimation

### Claude API Pricing

Based on Claude 3.5 Sonnet pricing (as of Jan 2025):

- **Input**: ~$3 per million tokens
- **Output**: ~$15 per million tokens

### Example Costs

- **10-page document**: ~$0.02-0.05
- **50-page document**: ~$0.10-0.25
- **200-page document**: ~$0.50-1.00

Actual costs depend on:
- Document complexity
- Text density
- Analysis depth

## Best Practices

1. **Process in Batches**: Use batch processing for multiple documents
2. **Monitor Progress**: Track processing stages and handle errors
3. **Check Before Processing**: Use `shouldProcessDocument()` to avoid redundant processing
4. **Handle Failures**: Implement retry logic for failed documents
5. **Cache Results**: Store AI analysis in database, don't reprocess
6. **Rate Limiting**: Respect API rate limits with delays
7. **Error Logging**: Log errors for debugging and monitoring
8. **Cost Tracking**: Monitor API usage and costs

## Future Enhancements

Potential improvements:

1. **Parallel Processing**: Process multiple documents simultaneously
2. **Advanced OCR**: Support for scanned PDFs with OCR preprocessing
3. **Custom Categories**: User-defined document categories
4. **Multi-language**: Support for non-English documents
5. **Enhanced Extraction**: Tables, charts, and image analysis
6. **Streaming**: Real-time analysis updates
7. **Webhooks**: Notify external systems on completion
8. **Analytics Dashboard**: Processing metrics and insights

## API Reference

### `processDocument()`

Process a single PDF document with AI analysis.

```typescript
async function processDocument(
  document: Document,
  onProgress?: (stage: string, progress: number) => void
): Promise<{
  document: Document;
  aiAnalysis: AIAnalysis;
}>
```

### `batchProcessDocuments()`

Process multiple documents in sequence.

```typescript
async function batchProcessDocuments(
  documents: Document[],
  onProgress?: (documentIndex: number, stage: string, progress: number) => void,
  onDocumentComplete?: (document: Document, success: boolean, error?: string) => void
): Promise<{
  successful: number;
  failed: number;
  skipped: number;
  results: Array<{ document: Document; success: boolean; error?: string }>;
}>
```

### `shouldProcessDocument()`

Check if a document needs processing.

```typescript
async function shouldProcessDocument(
  filePath: string
): Promise<{
  shouldProcess: boolean;
  reason: string;
}>
```

### `generateFileHash()`

Generate SHA-256 hash of a file.

```typescript
async function generateFileHash(filePath: string): Promise<string>
```

### `extractPDFText()`

Extract text content from a PDF file.

```typescript
async function extractPDFText(filePath: string): Promise<{
  text: string;
  pageCount: number;
}>
```

## Support

For issues or questions:

1. Check this documentation
2. Review error messages and logs
3. Verify API key configuration
4. Check Anthropic API status
5. Review code examples in `/scripts`

## License

Part of the Game Industry Reports project.
