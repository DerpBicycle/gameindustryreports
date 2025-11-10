#!/usr/bin/env python3
"""
Update documents.json with AI analyses.
"""

import json
import sys
from datetime import datetime

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 update_analyses.py <analyses.json>")
        sys.exit(1)

    analyses_file = sys.argv[1]
    docs_path = "/home/user/gameindustryreports/data/documents.json"

    # Load analyses
    with open(analyses_file, 'r') as f:
        analyses = json.load(f)

    # Load documents
    with open(docs_path, 'r') as f:
        documents = json.load(f)

    # Update documents
    updated_count = 0
    for analysis in analyses:
        idx = analysis['index']
        if idx < len(documents):
            # Remove index from analysis before adding to document
            analysis_data = {k: v for k, v in analysis.items() if k != 'index'}
            analysis_data['processed'] = True
            analysis_data['processedAt'] = datetime.now().isoformat()

            documents[idx]['aiAnalysis'] = analysis_data
            updated_count += 1
            print(f"Updated document {idx + 1}: {documents[idx].get('title')}")

    # Save documents
    with open(docs_path, 'w') as f:
        json.dump(documents, f, indent=2)

    print(f"\nUpdated {updated_count} documents")
    print(f"Saved to {docs_path}")

if __name__ == "__main__":
    main()
