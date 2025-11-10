# Quick Start Guide - AI Processing Pipeline

## 1. Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure API Key
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your Anthropic API key
# Get key from: https://console.anthropic.com/
```

In `.env.local`:
```env
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE
```

## 2. Usage

### Option A: CLI Tool (Easiest)

Process all documents:
```bash
npm run process
```

Process a specific file:
```bash
npm run process:file "filename.pdf"
```

### Option B: API Endpoint

Start the dev server:
```bash
npm run dev
```

Process a document via API:
```bash
# Check status
curl http://localhost:3000/api/process?documentId=doc-123

# Process document
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{"documentId": "doc-123"}'
```

### Option C: Programmatic

```typescript
import { processDocument } from '@/lib/ai-processor';
import { getDocumentById } from '@/lib/database';

const document = await getDocumentById('doc-id');
const result = await processDocument(document);

console.log('Summary:', result.aiAnalysis.summary);
console.log('Topics:', result.aiAnalysis.topics);
console.log('Entities:', result.aiAnalysis.entities);
```

## 3. What You Get

For each processed document, the AI extracts:

1. **Summary** - 2-3 paragraph executive summary
2. **Key Insights** - 5-10 actionable bullet points
3. **Topics** - Main subjects covered (e.g., "mobile gaming", "monetization")
4. **Entities** - Companies, products, regions mentioned
5. **Sentiment** - Overall tone (positive/neutral/negative)
6. **Category** - Document classification
7. **Confidence** - Analysis confidence score (70-95%)

## 4. Key Features

- ✅ **Smart Deduplication** - Won't reprocess unchanged files
- ✅ **Automatic Retries** - Handles API failures gracefully
- ✅ **Progress Tracking** - Real-time status updates
- ✅ **Large Document Support** - Processes documents of any size
- ✅ **Error Recovery** - Failed documents can be retried

## 5. File Structure

```
/src/lib/ai-processor.ts       ← Core processing logic
/src/app/api/process/route.ts  ← API endpoints
/scripts/process-documents.ts  ← CLI tool
/docs/AI_PROCESSOR.md          ← Full documentation
```

## 6. Common Commands

```bash
# Process all documents
npm run process

# Process specific document
npm run process:file "report.pdf"

# Start dev server (for API access)
npm run dev

# Check TypeScript compilation
npx tsc --noEmit
```

## 7. Troubleshooting

**Problem**: "ANTHROPIC_API_KEY not set"
- **Solution**: Add API key to `.env.local` file

**Problem**: "Failed to extract PDF text"
- **Solution**: Verify PDF is not corrupted or password-protected

**Problem**: API rate limiting
- **Solution**: Built-in delays handle this automatically

**Problem**: Document already processed
- **Solution**: This is normal - system prevents redundant processing
- **Force reprocess**: Use `force: true` parameter in API or reprocess manually

## 8. Cost Estimation

Typical costs per document (using Claude 3.5 Sonnet):
- 10-page PDF: ~$0.02-0.05
- 50-page PDF: ~$0.10-0.25
- 200-page PDF: ~$0.50-1.00

## 9. Need More Help?

- **Full Documentation**: `/docs/AI_PROCESSOR.md`
- **Implementation Summary**: `/AI_PROCESSOR_SUMMARY.md`
- **Code Examples**: `/scripts/process-documents.ts`

## 10. Quick Test

Test the system with a sample document:

```bash
# 1. Start the app
npm run dev

# 2. Upload a PDF through the web interface
# 3. Run processing
npm run process

# 4. Check the results in data/documents.json
```

That's it! Your AI processing pipeline is ready to use.
