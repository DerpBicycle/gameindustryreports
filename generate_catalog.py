#!/usr/bin/env python3
"""
Catalog Generator for Game Industry Reports

This script generates a searchable catalog of all PDF reports in the repository,
extracting metadata and creating an organized markdown index.
"""

import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple
from collections import defaultdict
from datetime import datetime


def parse_filename(filename: str) -> Dict[str, str]:
    """
    Parse report filename to extract metadata.
    Expected format: <Author/Company> - <Title> (<Year>).pdf

    Args:
        filename: The PDF filename

    Returns:
        Dictionary with parsed metadata
    """
    # Remove .pdf extension
    name = filename.replace('.pdf', '')

    # Try to extract year from parentheses
    year_match = re.search(r'\((\d{4})\)', name)
    year = year_match.group(1) if year_match else "Unknown"

    # Try to split on first dash to separate author and title
    parts = name.split(' - ', 1)
    if len(parts) == 2:
        author = parts[0].strip()
        title = parts[1].strip()
        # Remove year from title if present
        title = re.sub(r'\s*\(\d{4}\)\s*$', '', title)
    else:
        author = "Unknown"
        title = name

    return {
        'author': author,
        'title': title,
        'year': year,
        'filename': filename
    }


def get_file_size_mb(file_path: Path) -> float:
    """Get file size in megabytes."""
    return file_path.stat().st_size / (1024 * 1024)


def categorize_reports(root_dir: str = ".") -> Dict[str, List[Dict]]:
    """
    Categorize all PDF reports by directory.

    Args:
        root_dir: Root directory to search

    Returns:
        Dictionary mapping category names to lists of report metadata
    """
    root_path = Path(root_dir)
    categories = defaultdict(list)

    # Find all PDF files
    pdf_files = sorted(root_path.rglob("*.pdf"))

    for pdf_path in pdf_files:
        # Determine category from directory structure
        relative_path = pdf_path.relative_to(root_path)
        category = str(relative_path.parent) if relative_path.parent != Path('.') else "Root"

        # Parse metadata
        metadata = parse_filename(pdf_path.name)
        metadata['path'] = str(relative_path)
        metadata['size_mb'] = get_file_size_mb(pdf_path)

        # Check if markdown version exists
        md_path = pdf_path.with_suffix('.md')
        metadata['has_markdown'] = md_path.exists()

        categories[category].append(metadata)

    return dict(categories)


def generate_catalog_markdown(categories: Dict[str, List[Dict]]) -> str:
    """
    Generate markdown content for the catalog.

    Args:
        categories: Dictionary of categorized reports

    Returns:
        Markdown string
    """
    md = []

    # Header
    md.append("# Game Industry Reports Catalog")
    md.append("")
    md.append(f"*Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*")
    md.append("")

    # Statistics
    total_reports = sum(len(reports) for reports in categories.values())
    total_with_md = sum(1 for reports in categories.values()
                       for r in reports if r['has_markdown'])
    total_size = sum(r['size_mb'] for reports in categories.values() for r in reports)

    md.append("## Statistics")
    md.append("")
    md.append(f"- **Total Reports**: {total_reports}")
    md.append(f"- **Markdown Versions Available**: {total_with_md} ({total_with_md/total_reports*100:.1f}%)")
    md.append(f"- **Total Size**: {total_size:.2f} MB")
    md.append(f"- **Categories**: {len(categories)}")
    md.append("")

    # Table of Contents
    md.append("## Table of Contents")
    md.append("")
    for category in sorted(categories.keys()):
        anchor = category.lower().replace(' ', '-').replace('/', '-')
        count = len(categories[category])
        md.append(f"- [{category}](#{anchor}) ({count} reports)")
    md.append("")

    # Reports by Category
    md.append("---")
    md.append("")

    for category in sorted(categories.keys()):
        reports = categories[category]
        anchor = category.lower().replace(' ', '-').replace('/', '-')

        md.append(f"## {category}")
        md.append("")
        md.append(f"*{len(reports)} reports*")
        md.append("")

        # Sort reports by year (newest first), then by author
        sorted_reports = sorted(
            reports,
            key=lambda r: (r['year'] if r['year'] != 'Unknown' else '0000', r['author']),
            reverse=True
        )

        # Create table
        md.append("| Author | Title | Year | Size | Links |")
        md.append("|--------|-------|------|------|-------|")

        for report in sorted_reports:
            author = report['author']
            title = report['title']
            year = report['year']
            size = f"{report['size_mb']:.1f} MB"

            # Create links
            pdf_link = f"[PDF]({report['path']})"
            md_link = f"[MD]({report['path'].replace('.pdf', '.md')})" if report['has_markdown'] else "—"
            links = f"{pdf_link} · {md_link}"

            md.append(f"| {author} | {title} | {year} | {size} | {links} |")

        md.append("")

    # Footer
    md.append("---")
    md.append("")
    md.append("*This catalog was automatically generated by `generate_catalog.py`*")

    return "\n".join(md)


def main():
    """Main function to generate the catalog."""
    print("Generating catalog of game industry reports...")
    print()

    # Find and categorize all reports
    print("Scanning for PDF files...")
    categories = categorize_reports(".")

    if not categories:
        print("No PDF files found.")
        sys.exit(1)

    # Generate markdown
    print(f"Found {sum(len(r) for r in categories.values())} reports across {len(categories)} categories")
    print("Generating catalog...")
    catalog_md = generate_catalog_markdown(categories)

    # Write to file
    output_path = Path("CATALOG.md")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(catalog_md)

    print(f"✓ Catalog generated: {output_path}")
    print(f"  Total reports: {sum(len(r) for r in categories.values())}")
    print(f"  Categories: {len(categories)}")


if __name__ == "__main__":
    main()
