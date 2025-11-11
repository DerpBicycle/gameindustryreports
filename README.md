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

This repository includes a tool to convert all PDF reports to Markdown format for easier text analysis and processing.

### Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Convert all PDFs to Markdown:**
   ```bash
   python convert_pdfs_to_markdown.py
   ```

### Usage Options

- **Convert all PDFs:**
  ```bash
  python convert_pdfs_to_markdown.py
  ```

- **Force reconversion (overwrite existing markdown files):**
  ```bash
  python convert_pdfs_to_markdown.py --force
  ```

- **Convert a single PDF:**
  ```bash
  python convert_pdfs_to_markdown.py --single "path/to/report.pdf"
  ```

- **Specify a custom path:**
  ```bash
  python convert_pdfs_to_markdown.py --path "./Regional Reports"
  ```

The script will create `.md` files alongside each PDF, preserving the directory structure.

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
