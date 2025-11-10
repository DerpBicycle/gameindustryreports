#!/usr/bin/env python3
"""
Process documents 301-429 from the Game Industry Reports collection.
This is the final batch of documents.
"""

import json
import os
import sys
from pathlib import Path
import PyPDF2
import anthropic
from datetime import datetime

# Initialize Anthropic client
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

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
        print(f"Error extracting PDF text from {pdf_path}: {e}")
        return None

def analyze_document(title, text, pdf_path):
    """Use Claude to analyze a document deeply."""

    # Truncate text if too long (keep first 100k chars)
    if len(text) > 100000:
        text = text[:100000] + "\n[...truncated...]"

    prompt = f"""Analyze this game industry report document deeply and provide structured insights.

Document Title: {title}
Document Path: {pdf_path}

Document Text:
{text}

Please provide a comprehensive analysis in JSON format with the following structure:
{{
    "summary": "A detailed 3-5 sentence summary of the document's main content and purpose",
    "keyFindings": [
        "List 5-10 key findings, insights, or conclusions from the report"
    ],
    "topics": [
        "List primary topics covered (e.g., 'Market Analysis', 'Financial Performance', 'Industry Trends', 'M&A Activity', etc.)"
    ],
    "companies": [
        "List all companies mentioned prominently in the report"
    ],
    "metrics": {{
        "revenue": "Any revenue figures mentioned",
        "marketSize": "Market size data if available",
        "growth": "Growth rates or projections",
        "other": "Other key metrics"
    }},
    "timeframe": "The time period this report covers (e.g., 'Q1 2024', '2023', 'H1 2024')",
    "geography": "Geographic focus (e.g., 'Global', 'North America', 'Asia-Pacific', etc.)",
    "reportType": "Type of report (e.g., 'Market Research', 'Financial Analysis', 'Industry Overview', 'Investment Report', etc.)"
}}

Respond ONLY with valid JSON, no additional text."""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        response_text = message.content[0].text

        # Try to parse JSON
        try:
            analysis = json.loads(response_text)
            return analysis
        except json.JSONDecodeError:
            # If response contains JSON within markdown code blocks, extract it
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
                analysis = json.loads(response_text)
                return analysis
            else:
                print(f"Failed to parse JSON response: {response_text[:200]}")
                return None

    except Exception as e:
        print(f"Error analyzing document: {e}")
        return None

def process_documents():
    """Process documents 301-429."""

    docs_path = "/home/user/gameindustryreports/data/documents.json"

    # Load documents
    print("Loading documents.json...")
    with open(docs_path, 'r') as f:
        documents = json.load(f)

    total_docs = len(documents)
    print(f"Total documents in file: {total_docs}")

    # Process documents 301-429 (indices 300-428)
    start_idx = 300
    end_idx = 429  # This will be 428 in 0-based indexing

    if end_idx > total_docs:
        end_idx = total_docs
        print(f"Adjusted end index to {end_idx} (total available)")

    docs_to_process = documents[start_idx:end_idx]
    print(f"\nProcessing documents {start_idx+1}-{end_idx} (indices {start_idx}-{end_idx-1})")
    print(f"Total documents to process: {len(docs_to_process)}\n")

    processed_count = 0
    skipped_count = 0
    error_count = 0

    for i, doc in enumerate(docs_to_process):
        doc_num = start_idx + i + 1
        print(f"\n{'='*80}")
        print(f"Processing document {doc_num}/{end_idx}: {doc.get('title', 'Untitled')}")
        print(f"{'='*80}")

        # Check if already processed
        if doc.get('aiAnalysis') and doc['aiAnalysis'].get('processed'):
            print(f"  ✓ Already processed, skipping...")
            skipped_count += 1
            continue

        # Get PDF path
        pdf_path = doc.get('filePath') or doc.get('path')
        if not pdf_path:
            print(f"  ✗ No filePath found for document")
            error_count += 1
            continue

        # Make path absolute if needed
        if not pdf_path.startswith('/'):
            pdf_path = f"/home/user/gameindustryreports/{pdf_path}"

        # Check if file exists
        if not os.path.exists(pdf_path):
            print(f"  ✗ File not found: {pdf_path}")
            error_count += 1
            continue

        print(f"  📄 Extracting text from PDF...")
        text = extract_pdf_text(pdf_path)

        if not text or len(text) < 100:
            print(f"  ✗ Failed to extract meaningful text (length: {len(text) if text else 0})")
            error_count += 1
            continue

        print(f"  ✓ Extracted {len(text)} characters")
        print(f"  🤖 Analyzing with Claude...")

        analysis = analyze_document(doc.get('title', 'Untitled'), text, pdf_path)

        if analysis:
            # Update document with AI analysis
            doc['aiAnalysis'] = {
                **analysis,
                "processed": True,
                "processedAt": datetime.now().isoformat(),
                "textLength": len(text)
            }

            print(f"  ✓ Analysis complete")
            print(f"    - Summary: {analysis.get('summary', 'N/A')[:100]}...")
            print(f"    - Topics: {', '.join(analysis.get('topics', [])[:3])}")
            print(f"    - Companies: {len(analysis.get('companies', []))} found")

            processed_count += 1
        else:
            print(f"  ✗ Analysis failed")
            error_count += 1

        # Save every 20 documents
        if (i + 1) % 20 == 0:
            print(f"\n📝 Saving progress (processed {processed_count} documents)...")
            with open(docs_path, 'w') as f:
                json.dump(documents, f, indent=2)
            print(f"✓ Saved to {docs_path}")

    # Final save
    print(f"\n{'='*80}")
    print(f"💾 Saving final results...")
    with open(docs_path, 'w') as f:
        json.dump(documents, f, indent=2)
    print(f"✓ Saved to {docs_path}")

    # Summary
    print(f"\n{'='*80}")
    print(f"PROCESSING COMPLETE - FINAL BATCH")
    print(f"{'='*80}")
    print(f"Documents processed: {processed_count}")
    print(f"Documents skipped (already processed): {skipped_count}")
    print(f"Errors encountered: {error_count}")
    print(f"Total in batch: {len(docs_to_process)}")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    process_documents()
