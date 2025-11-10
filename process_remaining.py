#!/usr/bin/env python3
"""
Process remaining documents efficiently by generating summaries for Claude to analyze.
"""

import json
import PyPDF2
import os
import sys

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
        return None

def main():
    docs_path = "/home/user/gameindustryreports/data/documents.json"

    # Load documents
    with open(docs_path, 'r') as f:
        documents = json.load(f)

    # Process documents 301-429 (indices 300-428)
    start_idx = 300
    end_idx = 429

    # Find documents that need processing
    to_process = []
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

        to_process.append({
            'index': i,
            'doc': doc,
            'path': pdf_path
        })

    print(f"Total documents to process: {len(to_process)}")
    print(f"Documents already processed: {end_idx - start_idx - len(to_process)}")

    # Create summary file for Claude to work from
    summary_file = "/tmp/documents_to_process.txt"
    with open(summary_file, 'w') as f:
        f.write(f"DOCUMENTS TO PROCESS: {len(to_process)} remaining\n")
        f.write("="*80 + "\n\n")

        for item in to_process:
            i = item['index']
            doc = item['doc']
            f.write(f"Index: {i} (Document #{i+1})\n")
            f.write(f"ID: {doc.get('id')}\n")
            f.write(f"Title: {doc.get('title')}\n")
            f.write(f"Category: {doc.get('category')}\n")
            f.write(f"File: {doc.get('fileName')}\n")
            f.write("-"*80 + "\n\n")

    print(f"\nSummary written to {summary_file}")
    print(f"\nNext steps:")
    print(f"1. Review the summary file to see remaining documents")
    print(f"2. Process in batches using the extract_batch.py script")
    print(f"3. Continue from index {to_process[0]['index']} onwards")

if __name__ == "__main__":
    main()
