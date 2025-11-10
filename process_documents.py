#!/usr/bin/env python3
"""
Process documents 301-429 from documents.json
Extract PDF text, analyze content, and update aiAnalysis
"""

import json
import os
import re
from pathlib import Path
from datetime import datetime
import PyPDF2

# Configuration
DOCUMENTS_JSON = "/home/user/gameindustryreports/data/documents.json"
START_INDEX = 300  # Document 301 (0-indexed)
END_INDEX = 429    # Document 429 (inclusive, so 428 in 0-indexed)
SAVE_INTERVAL = 20

def load_documents():
    """Load documents from JSON file"""
    with open(DOCUMENTS_JSON, 'r') as f:
        return json.load(f)

def save_documents(documents):
    """Save documents to JSON file"""
    with open(DOCUMENTS_JSON, 'w') as f:
        json.dump(documents, f, indent=2)
    print(f"✓ Saved to {DOCUMENTS_JSON}")

def extract_pdf_text(pdf_path):
    """Extract text from PDF file"""
    if not os.path.exists(pdf_path):
        return None

    try:
        text = ""
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error extracting PDF {pdf_path}: {e}")
        return None

def extract_metadata_from_text(text):
    """Extract key metadata from text"""
    metadata = {
        "companies": set(),
        "financial_terms": set(),
        "dates": set(),
        "key_numbers": [],
        "topics": set()
    }

    if not text:
        return metadata

    # Extract company patterns (capitalized sequences, stock tickers)
    company_patterns = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Inc|Corp|Ltd|LLC|AG|SA|GmbH|Limited|Corporation|Company))?\b', text)
    for comp in company_patterns:
        if len(comp) > 3 and comp not in ['The', 'This', 'That', 'These', 'Those', 'Page']:
            metadata["companies"].add(comp)

    # Extract financial terms
    financial_keywords = ['revenue', 'profit', 'loss', 'earnings', 'EBITDA', 'margin', 'growth',
                         'acquisition', 'merger', 'investment', 'valuation', 'IPO', 'funding',
                         'market share', 'sales', 'operating income']
    text_lower = text.lower()
    for term in financial_keywords:
        if term.lower() in text_lower:
            metadata["financial_terms"].add(term)

    # Extract dates (various formats)
    date_patterns = re.findall(r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b', text)
    date_patterns.extend(re.findall(r'\b\d{4}\b', text))
    metadata["dates"].update(date_patterns[:10])  # Limit to first 10

    # Extract numbers with context (revenues, percentages, etc.)
    number_patterns = re.findall(r'[\$€£¥]\s*\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:million|billion|trillion|M|B|bn|mn))?', text)
    number_patterns.extend(re.findall(r'\d+(?:\.\d+)?%', text))
    metadata["key_numbers"] = list(set(number_patterns[:20]))  # Limit to 20

    # Extract gaming-specific topics
    gaming_topics = ['mobile gaming', 'console', 'PC gaming', 'esports', 'streaming',
                     'monetization', 'free-to-play', 'F2P', 'IAP', 'in-app purchase',
                     'subscription', 'cloud gaming', 'metaverse', 'NFT', 'blockchain',
                     'AR', 'VR', 'augmented reality', 'virtual reality', 'AI', 'machine learning']
    for topic in gaming_topics:
        if topic.lower() in text_lower:
            metadata["topics"].add(topic)

    # Convert sets to lists for JSON serialization
    return {
        "companies": list(metadata["companies"])[:30],  # Top 30
        "financial_terms": list(metadata["financial_terms"]),
        "dates": list(metadata["dates"]),
        "key_numbers": metadata["key_numbers"],
        "topics": list(metadata["topics"])
    }

def analyze_document_content(text, filename):
    """Analyze document content and generate summary"""
    if not text or len(text.strip()) < 100:
        return {
            "summary": "Document could not be processed or contains insufficient text.",
            "key_findings": [],
            "document_type": "Unknown",
            "word_count": 0,
            "entities": {}
        }

    # Basic stats
    word_count = len(text.split())

    # Determine document type based on content
    text_lower = text.lower()
    doc_type = "Industry Report"
    if any(term in text_lower for term in ['quarterly', 'q1', 'q2', 'q3', 'q4', 'earnings']):
        doc_type = "Quarterly Report"
    elif any(term in text_lower for term in ['annual', 'yearly', '10-k', '10k']):
        doc_type = "Annual Report"
    elif any(term in text_lower for term in ['market research', 'market analysis', 'market overview']):
        doc_type = "Market Research"
    elif any(term in text_lower for term in ['investor', 'investment', 'equity']):
        doc_type = "Investor Report"
    elif any(term in text_lower for term in ['press release', 'announcement']):
        doc_type = "Press Release"

    # Extract key findings from first few paragraphs and throughout document
    sentences = re.split(r'[.!?]+', text)
    key_findings = []

    # Look for sentences with important indicators
    for sentence in sentences[:100]:  # Check first 100 sentences
        sentence = sentence.strip()
        if len(sentence) > 50 and any(indicator in sentence.lower() for indicator in
            ['key', 'important', 'significant', 'highlights', 'growth', 'revenue',
             'market', 'increased', 'decreased', 'announced', 'launched', 'expects']):
            key_findings.append(sentence[:200])  # Limit sentence length
            if len(key_findings) >= 5:
                break

    # Generate summary from first substantial paragraph
    paragraphs = [p.strip() for p in text.split('\n\n') if len(p.strip()) > 100]
    summary = ""
    if paragraphs:
        summary = paragraphs[0][:500] + ("..." if len(paragraphs[0]) > 500 else "")
    else:
        # Fallback: use first 500 chars
        summary = text[:500].strip() + ("..." if len(text) > 500 else "")

    # Extract entities
    entities = extract_metadata_from_text(text)

    return {
        "summary": summary,
        "key_findings": key_findings,
        "document_type": doc_type,
        "word_count": word_count,
        "entities": entities,
        "analyzed_at": datetime.now().isoformat()
    }

def process_documents():
    """Main processing function"""
    print(f"Loading documents from {DOCUMENTS_JSON}...")
    documents = load_documents()
    total_docs = len(documents)
    print(f"Total documents in file: {total_docs}")

    # Calculate actual end index
    actual_end = min(END_INDEX, total_docs)
    docs_to_process = actual_end - START_INDEX
    print(f"Processing documents {START_INDEX + 1} to {actual_end} ({docs_to_process} documents)")

    processed_count = 0
    updated_count = 0
    skipped_count = 0

    for idx in range(START_INDEX, actual_end):
        doc = documents[idx]
        doc_num = idx + 1

        print(f"\n[{doc_num}/{actual_end}] Processing: {doc.get('fileName', doc.get('title', 'Unknown'))}")

        # Get PDF path
        relative_path = doc.get('filePath')
        if not relative_path:
            print(f"  ⚠ No filepath found")
            skipped_count += 1
            continue

        # Construct full path
        pdf_path = os.path.join("/home/user/gameindustryreports", relative_path)
        if not os.path.exists(pdf_path):
            print(f"  ⚠ PDF file not found at {pdf_path}")
            doc['aiAnalysis'] = {
                "summary": "PDF file not found at expected location.",
                "key_findings": [],
                "document_type": "Unknown",
                "word_count": 0,
                "entities": {},
                "analyzed_at": datetime.now().isoformat(),
                "error": "PDF file not found"
            }
            skipped_count += 1
            continue

        # Check if already analyzed
        if doc.get('aiAnalysis') and doc['aiAnalysis'].get('summary'):
            print(f"  ℹ Already analyzed, re-analyzing...")

        # Extract PDF text
        print(f"  → Extracting text from PDF...")
        text = extract_pdf_text(pdf_path)

        if not text:
            print(f"  ⚠ Could not extract text")
            doc['aiAnalysis'] = {
                "summary": "PDF text extraction failed.",
                "key_findings": [],
                "document_type": "Unknown",
                "word_count": 0,
                "entities": {},
                "analyzed_at": datetime.now().isoformat(),
                "error": "PDF extraction failed"
            }
            skipped_count += 1
        else:
            # Analyze content
            print(f"  → Analyzing content ({len(text)} chars)...")
            analysis = analyze_document_content(text, doc.get('fileName', doc.get('title', '')))
            doc['aiAnalysis'] = analysis
            updated_count += 1

            print(f"  ✓ Type: {analysis['document_type']}")
            print(f"  ✓ Words: {analysis['word_count']}")
            print(f"  ✓ Entities: {len(analysis['entities'].get('companies', []))} companies, "
                  f"{len(analysis['entities'].get('topics', []))} topics")

        processed_count += 1

        # Save every SAVE_INTERVAL documents
        if processed_count % SAVE_INTERVAL == 0:
            print(f"\n{'='*60}")
            print(f"Saving progress... ({processed_count}/{docs_to_process} processed)")
            save_documents(documents)
            print(f"{'='*60}")

    # Final save
    print(f"\n{'='*60}")
    print(f"Final save...")
    save_documents(documents)

    # Summary
    print(f"\n{'='*60}")
    print(f"PROCESSING COMPLETE")
    print(f"{'='*60}")
    print(f"Documents processed: {processed_count}")
    print(f"Documents updated: {updated_count}")
    print(f"Documents skipped: {skipped_count}")
    print(f"{'='*60}")

if __name__ == "__main__":
    process_documents()
