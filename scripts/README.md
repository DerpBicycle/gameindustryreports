# Document Indexing Script

This directory contains scripts for managing the game industry reports database.

## index-documents.js

A comprehensive document indexing script that scans PDF files in the repository and creates a searchable database.

### Features

- **Automatic PDF Discovery**: Recursively scans all category directories for PDF files
- **Intelligent Metadata Extraction**: Parses filenames to extract:
  - Source (e.g., "Drake Star", "Newzoo", "DappRadar & BGA")
  - Title
  - Year (from parentheses or within filename)
  - Quarter (Q1-Q4) or Half (H1-H2)
  - Category (from directory name)
- **File Tracking**: Monitors file size and generates unique IDs for each document
- **Smart Indexing**: Skips already-indexed documents by default
- **Progress Reporting**: Shows detailed progress with color-coded output
- **Multiple Modes**: Supports dry-run, force re-indexing, and more

### Usage

#### Basic Usage

```bash
# Index new documents only
npm run index

# Re-index all documents (including already indexed ones)
npm run index -- --force

# Preview what would be indexed (no changes made)
npm run index -- --dry-run

# Index new documents and trigger AI processing
npm run index -- --process

# Show help
npm run index -- --help
```

#### Flags

- `--force` - Re-index all documents, even if already indexed
- `--dry-run` - Preview what would be indexed without making changes
- `--process` - Trigger AI processing for newly indexed documents (placeholder for future implementation)
- `--help` or `-h` - Display help message

### Output

The script generates:
- `/data/documents.json` - Main document database with all indexed PDFs
- Color-coded terminal output:
  - 🟢 Green `+` - New documents added
  - 🟡 Yellow `↻` - Documents updated
  - ⊘ Dimmed - Documents skipped (already indexed)
  - 🔴 Red `✗` - Errors

### Example Output

```
==================================================
Document Indexing Script
==================================================

Scanning directories for PDF files...
  Blockchain NFT Web3: 12 PDFs found
  Cloud Gaming: 3 PDFs found
  Esports: 6 PDFs found
  General Industry: 93 PDFs found
  Mobile: 157 PDFs found
  ...

Total PDFs found: 429

Indexing documents...
  + Blockchain NFT Web3/DappRadar & BGA - State of blockchain gaming (Q1 2023).pdf
  + General Industry/Drake Star - Global Gaming Report (Q1 2025).pdf
  ...

✓ Saved 429 documents to /data/documents.json

==================================================
Indexing Statistics
==================================================
Total PDFs found:    429
New documents:       429
Updated documents:   0
Skipped documents:   0
Errors:              0
==================================================

Sample of indexed documents:

  Title:    State of blockchain gaming
  Source:   DappRadar & BGA
  Year:     2023
  Quarter:  Q1
  Category: Blockchain NFT Web3
  Size:     2.45 MB
  Status:   pending
  ...
```

### Document Schema

Each indexed document includes:

```typescript
{
  id: string;                    // Unique identifier
  title: string;                 // Extracted title
  fileName: string;              // Original filename
  filePath: string;              // Relative path from root
  fileSize: number;              // Size in bytes
  category: string;              // Category from directory
  uploadDate: string;            // ISO timestamp
  processedDate?: string;        // ISO timestamp (if processed)
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  metadata: {
    source?: string;             // Report source/publisher
    year?: number;               // Publication year
    quarter?: string;            // Quarter (Q1-Q4) or Half (H1-H2)
    region?: string;             // Geographic region
    tags: string[];              // Tags (includes category)
    description?: string;        // Description
  };
  aiAnalysis?: {                 // Added by AI processing
    summary: string;
    keyInsights: string[];
    topics: string[];
    entities: string[];
    sentiment?: string;
    confidence: number;
    ocrText?: string;
    pageCount?: number;
  };
}
```

### Filename Parsing Examples

The script intelligently parses various filename formats:

| Filename | Extracted Metadata |
|----------|-------------------|
| `Drake Star - Global Gaming Report (Q1 2025).pdf` | Source: "Drake Star"<br>Title: "Global Gaming Report"<br>Year: 2025<br>Quarter: "Q1" |
| `Newzoo - Global Games Market Report (2022).pdf` | Source: "Newzoo"<br>Title: "Global Games Market Report"<br>Year: 2022 |
| `DappRadar & BGA - State of blockchain gaming (Q1 2023).pdf` | Source: "DappRadar & BGA"<br>Title: "State of blockchain gaming"<br>Year: 2023<br>Quarter: "Q1" |
| `Drake Star - Global Gaming Report (H1 2022).pdf` | Source: "Drake Star"<br>Title: "Global Gaming Report"<br>Year: 2022<br>Quarter: "H1" |

### Categories

The script scans these category directories:
- Blockchain NFT Web3
- Cloud Gaming
- Esports
- General Industry
- HR
- Investments
- Marketing & Streaming
- Mobile
- Regional Reports
- XR Metaverse

### Integration

The script uses:
- Types from: `/src/types/document.ts`
- Database functions from: `/src/lib/database.ts`
- Outputs to: `/data/documents.json`

### Tips

1. **First-time indexing**: Run without flags to index all documents
2. **Regular updates**: Run periodically to pick up new PDFs
3. **Verify changes**: Use `--dry-run` to preview before actual indexing
4. **Complete re-index**: Use `--force` if you've modified the parsing logic
5. **Check results**: Review `/data/documents.json` after indexing

### Troubleshooting

**No documents found?**
- Verify PDF files exist in category directories
- Check that filenames end with `.pdf` (case-insensitive)

**Incorrect metadata?**
- Check filename format matches expected patterns
- Modify the `parseFilename()` function in the script for custom formats

**All documents skipped?**
- Documents are already indexed
- Use `--force` flag to re-index
- Or use `--dry-run` to verify
