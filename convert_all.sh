#!/bin/bash
# Convenience script to convert all PDFs and generate catalog

set -e

echo "🎮 Game Industry Reports - PDF to Markdown Conversion"
echo "======================================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    exit 1
fi

# Check if requirements are installed
if ! python3 -c "import markitdown" 2>/dev/null; then
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
    echo ""
fi

# Determine number of workers
WORKERS=${1:-4}

echo "⚙️  Configuration:"
echo "   Workers: $WORKERS"
echo ""

# Convert PDFs
echo "📄 Converting PDFs to Markdown..."
python3 convert_pdfs_to_markdown.py --workers "$WORKERS"
echo ""

# Generate catalog
echo "📚 Generating catalog..."
python3 generate_catalog.py
echo ""

echo "✅ All done!"
echo ""
echo "📊 Check CATALOG.md for a searchable index of all reports"
