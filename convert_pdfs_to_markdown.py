#!/usr/bin/env python3
"""
PDF to Markdown Converter for Game Industry Reports

This script converts all PDF files in the repository to Markdown format
using Microsoft's MarkItDown library with parallel processing support.
"""

import os
import sys
import argparse
import logging
from pathlib import Path
from typing import List, Tuple
from concurrent.futures import ProcessPoolExecutor, as_completed
from datetime import datetime

try:
    from markitdown import MarkItDown
except ImportError:
    print("Error: MarkItDown is not installed.")
    print("Please install it with: pip install 'markitdown[all]'")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pdf_conversion.log'),
        logging.StreamHandler()
    ]
)


def find_pdf_files(root_dir: str = ".") -> List[Path]:
    """Find all PDF files in the directory tree."""
    root_path = Path(root_dir)
    pdf_files = list(root_path.rglob("*.pdf"))
    return sorted(pdf_files)


def convert_pdf_to_markdown_worker(args: Tuple[Path, bool]) -> Tuple[bool, str, Path]:
    """
    Worker function for parallel PDF conversion.

    Args:
        args: Tuple of (pdf_path, force)

    Returns:
        Tuple of (success: bool, message: str, pdf_path: Path)
    """
    pdf_path, force = args
    md_path = pdf_path.with_suffix('.md')

    # Skip if markdown already exists (unless force is True)
    if md_path.exists() and not force:
        return True, "skipped", pdf_path

    try:
        # Create a new converter instance for this process
        converter = MarkItDown()
        result = converter.convert(str(pdf_path))

        # Write the markdown content to file
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(result.text_content)

        logging.info(f"Successfully converted: {pdf_path}")
        return True, "converted", pdf_path

    except Exception as e:
        logging.error(f"Failed to convert {pdf_path}: {str(e)}")
        return False, str(e), pdf_path


def convert_pdf_to_markdown(
    pdf_path: Path,
    converter: MarkItDown,
    force: bool = False
) -> Tuple[bool, str]:
    """
    Convert a single PDF file to Markdown (synchronous version).

    Args:
        pdf_path: Path to the PDF file
        converter: MarkItDown converter instance
        force: If True, overwrite existing markdown files

    Returns:
        Tuple of (success: bool, message: str)
    """
    md_path = pdf_path.with_suffix('.md')

    # Skip if markdown already exists (unless force is True)
    if md_path.exists() and not force:
        return True, f"Skipped (already exists): {pdf_path.relative_to('.')}"

    try:
        # Convert PDF to Markdown
        result = converter.convert(str(pdf_path))

        # Write the markdown content to file
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(result.text_content)

        logging.info(f"Successfully converted: {pdf_path}")
        return True, f"✓ Converted: {pdf_path.relative_to('.')}"

    except Exception as e:
        logging.error(f"Failed to convert {pdf_path}: {str(e)}")
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
    parser.add_argument(
        "--workers",
        "-w",
        type=int,
        default=1,
        help="Number of parallel workers (default: 1, use -1 for CPU count)"
    )
    parser.add_argument(
        "--quiet",
        "-q",
        action="store_true",
        help="Reduce output verbosity"
    )

    args = parser.parse_args()

    # Adjust logging level
    if args.quiet:
        logging.getLogger().setLevel(logging.WARNING)

    start_time = datetime.now()

    # Find PDF files
    if args.single:
        pdf_files = [Path(args.single)]
        if not pdf_files[0].exists():
            print(f"Error: File not found: {args.single}")
            sys.exit(1)
        use_parallel = False
    else:
        print(f"Searching for PDF files in: {args.path}")
        pdf_files = find_pdf_files(args.path)
        print(f"Found {len(pdf_files)} PDF files")
        use_parallel = args.workers != 1 and len(pdf_files) > 1

    if not pdf_files:
        print("No PDF files found.")
        return

    # Determine number of workers
    workers = args.workers
    if workers == -1:
        workers = os.cpu_count() or 4
    workers = max(1, min(workers, len(pdf_files)))

    successful = 0
    failed = 0
    skipped = 0
    failed_files = []

    if use_parallel:
        print(f"\nStarting parallel conversion with {workers} workers...\n")

        # Prepare arguments for parallel processing
        tasks = [(pdf, args.force) for pdf in pdf_files]

        with ProcessPoolExecutor(max_workers=workers) as executor:
            futures = {executor.submit(convert_pdf_to_markdown_worker, task): task[0]
                      for task in tasks}

            completed = 0
            for future in as_completed(futures):
                pdf_path = futures[future]
                completed += 1

                try:
                    success, status, path = future.result()

                    if not args.quiet:
                        print(f"[{completed}/{len(pdf_files)}] {path.relative_to('.')}: ", end="")

                    if success:
                        if status == "skipped":
                            skipped += 1
                            if not args.quiet:
                                print("⊙ Skipped (already exists)")
                        else:
                            successful += 1
                            if not args.quiet:
                                print("✓ Converted")
                    else:
                        failed += 1
                        failed_files.append((str(path), status))
                        if not args.quiet:
                            print(f"✗ Failed: {status}")

                except Exception as e:
                    failed += 1
                    failed_files.append((str(pdf_path), str(e)))
                    if not args.quiet:
                        print(f"[{completed}/{len(pdf_files)}] {pdf_path.relative_to('.')}: ✗ Error: {str(e)}")
    else:
        # Single-threaded conversion
        print("\nStarting conversion...\n")
        converter = MarkItDown()

        for i, pdf_path in enumerate(pdf_files, 1):
            if not args.quiet:
                print(f"[{i}/{len(pdf_files)}] Processing: {pdf_path.relative_to('.')}")
            success, message = convert_pdf_to_markdown(pdf_path, converter, args.force)
            if not args.quiet:
                print(f"    {message}")

            if success:
                if "Skipped" in message:
                    skipped += 1
                else:
                    successful += 1
            else:
                failed += 1
                failed_files.append((str(pdf_path), message))

    # Calculate duration
    duration = datetime.now() - start_time

    # Print summary
    print("\n" + "="*60)
    print("CONVERSION SUMMARY")
    print("="*60)
    print(f"Total PDFs processed: {len(pdf_files)}")
    print(f"Successfully converted: {successful}")
    print(f"Skipped (already exist): {skipped}")
    print(f"Failed: {failed}")
    print(f"Duration: {duration}")
    print("="*60)

    # Print failed files details
    if failed_files:
        print("\nFailed conversions:")
        for filepath, error in failed_files:
            print(f"  - {filepath}")
            print(f"    Error: {error}")

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
