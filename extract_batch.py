#!/usr/bin/env python3
"""
Extract text from a batch of documents for analysis.
"""

import json
import sys
import PyPDF2
import os

def extract_pdf_text(pdf_path):
    """Extract text from a PDF file."""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
    except Exception as e:
        print(f"Error extracting PDF: {e}", file=sys.stderr)
        return None

def main():
    if len(sys.argv) != 3:
        print("Usage: python3 extract_batch.py <start_index> <end_index>")
        sys.exit(1)

    start_idx = int(sys.argv[1])
    end_idx = int(sys.argv[2])

    docs_path = "/home/user/gameindustryreports/data/documents.json"

    # Load documents
    with open(docs_path, 'r') as f:
        documents = json.load(f)

    batch = []

    for i in range(start_idx, min(end_idx, len(documents))):
        doc = documents[i]

        # Skip if already processed
        if doc.get('aiAnalysis', {}).get('processed'):
            continue

        # Get PDF path
        pdf_path = doc.get('filePath') or doc.get('path')
        if not pdf_path:
            continue

        if not pdf_path.startswith('/'):
            pdf_path = f"/home/user/gameindustryreports/{pdf_path}"

        if not os.path.exists(pdf_path):
            continue

        # Extract text
        text = extract_pdf_text(pdf_path)
        if not text or len(text) < 100:
            continue

        # Truncate if too long
        if len(text) > 50000:
            text = text[:50000] + "\n[...truncated...]"

        batch.append({
            "index": i,
            "id": doc.get("id"),
            "title": doc.get("title"),
            "fileName": doc.get("fileName"),
            "category": doc.get("category"),
            "text": text
        })

    # Output as JSON
    print(json.dumps(batch, indent=2))

if __name__ == "__main__":
    main()
