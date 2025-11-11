#!/usr/bin/env python3
"""
PDF to Markdown Converter for Game Industry Reports

This script converts all PDF files in the repository to Markdown format
using Microsoft's MarkItDown library.
"""

import os
import sys
import argparse
from pathlib import Path
from typing import List, Tuple

try:
    from markitdown import MarkItDown
except ImportError:
    print("Error: MarkItDown is not installed.")
    print("Please install it with: pip install 'markitdown[all]'")
    sys.exit(1)


def find_pdf_files(root_dir: str = ".") -> List[Path]:
    """Find all PDF files in the directory tree."""
    root_path = Path(root_dir)
    pdf_files = list(root_path.rglob("*.pdf"))
    return sorted(pdf_files)


def convert_pdf_to_markdown(
    pdf_path: Path,
    converter: MarkItDown,
    force: bool = False
) -> Tuple[bool, str]:
    """
    Convert a single PDF file to Markdown.

    Args:
        pdf_path: Path to the PDF file
        converter: MarkItDown converter instance
        force: If True, overwrite existing markdown files

    Returns:
        Tuple of (success: bool, message: str)
    """
    # Determine output path (same location, .md extension)
    md_path = pdf_path.with_suffix('.md')

    # Skip if markdown already exists (unless force is True)
    if md_path.exists() and not force:
        return True, f"Skipped (already exists): {md_path.relative_to('.')}"

    try:
        # Convert PDF to Markdown
        result = converter.convert(str(pdf_path))

        # Write the markdown content to file
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(result.text_content)

        return True, f"✓ Converted: {pdf_path.relative_to('.')}"

    except Exception as e:
        return False, f"✗ Failed: {pdf_path.relative_to('.')} - Error: {str(e)}"


def main():
    parser = argparse.ArgumentParser(
        description="Convert PDF files to Markdown using MarkItDown"
    )
    parser.add_argument(
        "--force",
        "-f",
        action="store_true",
        help="Overwrite existing markdown files"
    )
    parser.add_argument(
        "--path",
        "-p",
        default=".",
        help="Root path to search for PDFs (default: current directory)"
    )
    parser.add_argument(
        "--single",
        "-s",
        help="Convert a single PDF file instead of all PDFs"
    )

    args = parser.parse_args()

    # Initialize the MarkItDown converter
    print("Initializing MarkItDown converter...")
    converter = MarkItDown()

    # Find PDF files
    if args.single:
        pdf_files = [Path(args.single)]
        if not pdf_files[0].exists():
            print(f"Error: File not found: {args.single}")
            sys.exit(1)
    else:
        print(f"Searching for PDF files in: {args.path}")
        pdf_files = find_pdf_files(args.path)
        print(f"Found {len(pdf_files)} PDF files")

    if not pdf_files:
        print("No PDF files found.")
        return

    # Convert each PDF
    print("\nStarting conversion...\n")
    successful = 0
    failed = 0
    skipped = 0

    for i, pdf_path in enumerate(pdf_files, 1):
        print(f"[{i}/{len(pdf_files)}] Processing: {pdf_path.relative_to('.')}")
        success, message = convert_pdf_to_markdown(pdf_path, converter, args.force)
        print(f"    {message}")

        if success:
            if "Skipped" in message:
                skipped += 1
            else:
                successful += 1
        else:
            failed += 1

    # Print summary
    print("\n" + "="*60)
    print("CONVERSION SUMMARY")
    print("="*60)
    print(f"Total PDFs processed: {len(pdf_files)}")
    print(f"Successfully converted: {successful}")
    print(f"Skipped (already exist): {skipped}")
    print(f"Failed: {failed}")
    print("="*60)

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
