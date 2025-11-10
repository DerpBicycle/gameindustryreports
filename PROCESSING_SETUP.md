# Enhanced AI Document Processing Setup

## Overview

This setup processes the first 50 documents from the Game Industry Reports collection with enhanced AI analysis using Claude API.

## What's Been Created

### 1. Processing Script (`scripts/process-first-50.ts`)

A custom script that:
- Reads the first 50 documents from `data/documents.json`
- Extracts text from PDF files using pdf-parse
- Analyzes each document with Claude API using enhanced taxonomy
- Extracts: report type, content focus, geographic scope, entities, metrics, key findings, summary
- Saves results back to `documents.json` after each batch of 10 documents
- Provides detailed progress tracking and error reporting

### 2. Enhanced Analysis Features

The script uses the enhanced taxonomy from `src/config/taxonomy.ts` to classify documents with:

**Classification Dimensions:**
- Report Type (Market Research, Financial Report, Trend Analysis, etc.)
- Content Focus (Market Analysis, Technology, User Behavior, etc.)
- Geographic Scope (Global, Regional, Country-Specific, Multi-Regional)
- Temporal Nature (Historical, Current State, Forward-Looking, Periodic Update)
- Data Characteristics (Quantitative, Mixed, Qualitative, Primary/Secondary Research)
- Target Audience (Executives, Investors, Developers, Marketers, Analysts)

**Extracted Data:**
- Key Metrics (with value, context, unit, timeframe, region)
- Entities (companies, games, technologies, regions, genres, platforms, business models)
- Key Findings (top 5 insights from each document)
- Key Insights (actionable takeaways)
- Methodology (research approach if mentioned)
- Data Quality Assessment (text extraction quality, completeness, confidence)

## Current Status

### Documents to Process

- **Total documents in collection:** 429
- **Documents to process:** First 50
- **Current status:** All 50 are pending (not yet processed)

### Category Breakdown (First 50)

- Blockchain NFT Web3: 12 documents
- Cloud Gaming: 3 documents
- Esports: 6 documents
- General Industry: 29 documents

### File Verification

✓ All PDF files exist and are accessible
✓ File paths are correctly configured
✓ Processing script is ready to run

## Setup Requirements

### 1. Anthropic API Key

**Required:** You need a valid Anthropic API key to process documents.

**How to get it:**
1. Visit https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key

**How to configure it:**
1. Open `.env.local` file in the project root
2. Replace the placeholder with your actual API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
   ```
3. Save the file

### 2. Estimated Costs

- **Per document:** $0.10-0.15 (varies based on document length and complexity)
- **For 50 documents:** Approximately $5.00-$7.50
- **API calls:** ~1-3 calls per document (depending on length)

### 3. Processing Time

- **Per document:** 2-3 minutes (including API calls and rate limiting)
- **For 50 documents:** Approximately 100-150 minutes (1.5-2.5 hours)
- **Batch saving:** Every 10 documents (5 save points total)

## How to Run

Once you have configured the API key:

```bash
# Run the processing script
npx tsx scripts/process-first-50.ts
```

Or add to package.json and run:

```bash
npm run process:first-50
```

## What Happens During Processing

1. **Initialization**
   - Validates API key
   - Loads documents.json
   - Selects first 50 documents

2. **Batch Processing (5 batches of 10 documents)**
   - For each document:
     - Extracts text from PDF
     - Assesses document characteristics
     - Analyzes with Claude API
     - Updates document with AI analysis
   - After each batch of 10:
     - Saves results to documents.json
     - Shows progress update

3. **Results Report**
   - Success/failure counts
   - Processing duration
   - Estimated costs
   - Error details (if any)
   - Sample analyses (first 3 successful documents)

## Output Format

Each processed document in `documents.json` will have an enhanced `aiAnalysis` field:

```json
{
  "id": "...",
  "title": "...",
  "aiAnalysis": {
    "reportType": "Market Research Report",
    "contentFocus": ["Market & Industry Analysis", "Regional Analysis"],
    "geographicScope": "Global",
    "temporalNature": ["Current State", "Forward-Looking"],
    "dataCharacteristics": "Heavily Quantitative",
    "targetAudience": ["Executives & Decision Makers", "Analysts & Researchers"],
    "summary": "Executive summary...",
    "keyFindings": ["Finding 1", "Finding 2", ...],
    "keyInsights": ["Insight 1", "Insight 2", ...],
    "topics": ["topic1", "topic2", ...],
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
    "methodology": "Survey of 1000+ respondents...",
    "sentiment": "positive",
    "confidence": 0.85,
    "pageCount": 45,
    "dataQuality": {
      "textExtractionQuality": "excellent",
      "dataCompleteness": 0.85,
      "confidence": 0.85,
      "processingNotes": ["Text quality: excellent", "Data intensity: high"]
    }
  }
}
```

## Error Handling

- **API Errors:** Automatic retry with exponential backoff (max 3 attempts)
- **PDF Extraction Errors:** Logged and marked as failed
- **Rate Limiting:** 2-second delay between documents
- **Batch Saving:** Results preserved even if processing is interrupted

## Resuming Processing

If processing is interrupted:
1. The script can be re-run
2. Already processed documents (those with `processingStatus: "completed"`) will be skipped
3. Only pending or failed documents will be processed

## Support

For issues or questions:
1. Check that API key is correctly set in `.env.local`
2. Verify PDF files exist at specified paths
3. Check console output for specific error messages
4. Review processing logs for failed documents

## Next Steps

After processing is complete:
1. Review sample analyses in the console output
2. Check `data/documents.json` for updated documents
3. Use the enhanced metadata for filtering and searching
4. Consider processing remaining documents (379 more)

---

**Ready to process?** Configure your API key and run the script!
