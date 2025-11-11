[![Update CSV File](https://github.com/EricDiepeveen/gameindustryreports/actions/workflows/csvupdate.yml/badge.svg)](https://github.com/EricDiepeveen/gameindustryreports/actions/workflows/csvupdate.yml) [![Generate Images from PDFs](https://github.com/EricDiepeveen/gameindustryreports/actions/workflows/generatepreviewimages.yml/badge.svg)](https://github.com/EricDiepeveen/gameindustryreports/actions/workflows/generatepreviewimages.yml)
# 🎮 Game Industry Reports 📚

A comprehensive collection of publicly available game industry reports, aggregated and maintained via Git.

---

## 🎯 Purpose

This repository aims to provide a centralized location for game industry reports, making it easier for researchers, developers, and enthusiasts to access and reference these valuable resources.

---

## 🤝 Contributing

We invite the community to contribute by adding new reports to this repository. To do so:

1. **Clone** the original repository: `git clone https://github.com/your-username/GameIndustryReports.git`
2. **Create a new branch** (e.g., `feature/new-report`) to work on.
3. **Add the new report** to the corresponding folder and commit changes: `git add .` followed by `git commit -m "Added new report"`
4. **Push changes** to your own forked repository's branch (e.g., `origin/feature/new-report`): `git push origin feature/new-report`
5. **Open a pull request** from your branch (`feature/new-report`) to the main branch (`master`)

---

## 📝 Format Requirements

Reports should be in PDF format, preferably:

* Standardized naming convention (e.g., `<Writer> - <Title> <(YEAR)>.pdf`)
* No DRM or proprietary restrictions

---

## 📄 PDF to Markdown Conversion

This repository includes powerful tools to convert all PDF reports to Markdown format and generate a searchable catalog of all reports.

### Features

- **Parallel Processing**: Convert multiple PDFs simultaneously for faster processing
- **Smart Caching**: Automatically skips already-converted files
- **Error Handling**: Comprehensive logging and error reporting
- **Catalog Generation**: Creates a searchable index of all reports with metadata
- **GitHub Actions**: Automated conversion when new PDFs are added

### Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### Usage

#### Convert PDFs to Markdown

- **Basic conversion (single-threaded):**
  ```bash
  python convert_pdfs_to_markdown.py
  ```

- **Fast parallel conversion (4 workers):**
  ```bash
  python convert_pdfs_to_markdown.py --workers 4
  ```

- **Use all available CPU cores:**
  ```bash
  python convert_pdfs_to_markdown.py --workers -1
  ```

- **Force reconversion (overwrite existing markdown files):**
  ```bash
  python convert_pdfs_to_markdown.py --force --workers 4
  ```

- **Convert a single PDF:**
  ```bash
  python convert_pdfs_to_markdown.py --single "path/to/report.pdf"
  ```

- **Quiet mode (less verbose output):**
  ```bash
  python convert_pdfs_to_markdown.py --workers 4 --quiet
  ```

#### Generate Report Catalog

Create a comprehensive catalog of all reports with metadata:

```bash
python generate_catalog.py
```

This generates `CATALOG.md` with:
- Statistics on all reports (count, total size, categories)
- Organized table of contents by category
- Searchable tables with author, title, year, size
- Direct links to PDFs and markdown versions

### Automation

The repository includes a GitHub Actions workflow that automatically:
- Converts new PDFs to Markdown when they're added
- Updates the catalog with new reports
- Commits changes back to the repository

The workflow runs automatically when PDFs are pushed, or can be triggered manually from the Actions tab.

---

## ✅ TO DO List

- [ ] Rename files to adhere to naming convention
- [ ] Figure out folder structure. Suggestions are welcome

---

## 🙏 Acknowledgments

This project relies on the contributions of the game industry community. We appreciate your help in maintaining and expanding this repository.

---

## 🌟 Get Involved!

If you have any questions, suggestions, or would like to contribute, feel free to [open an discussion]([https://github.com/EricDiepeveen/GameIndustryReports/issues](https://github.com/EricDiepeveen/gameindustryreports/discussions)) or reach out directly.
