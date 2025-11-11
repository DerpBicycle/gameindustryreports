# Contributing to Game Industry Reports

Thank you for your interest in contributing to this repository! This guide will help you add new reports and maintain the collection.

## Adding New Reports

### Step 1: Prepare Your Report

1. **File Format**: Reports should be in PDF format
2. **Naming Convention**: Use the format: `<Author/Company> - <Title> (<Year>).pdf`
   - Example: `Newzoo - Global Games Market Report (2024).pdf`
3. **No DRM**: Ensure the PDF doesn't have proprietary restrictions
4. **Verify Permissions**: Only add publicly available reports you have rights to share

### Step 2: Add to Repository

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/gameindustryreports.git
   cd gameindustryreports
   ```

2. **Create a new branch:**
   ```bash
   git checkout -b add-report-name
   ```

3. **Place the PDF in the appropriate category folder:**
   - `Blockchain NFT Web3/`
   - `Cloud Gaming/`
   - `Esports/`
   - `General Industry/`
   - `HR/`
   - `Investments/`
   - `Marketing & Streaming/`
   - `Mobile/`
   - `Regional Reports/`
   - `XR Metaverse/`

4. **Generate Markdown and Catalog (Optional but Recommended):**
   ```bash
   # Install dependencies if not already installed
   pip install -r requirements.txt

   # Convert your new PDF to markdown
   python convert_pdfs_to_markdown.py --single "path/to/your/report.pdf"

   # Update the catalog
   python generate_catalog.py
   ```

5. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add [Report Name] by [Author]"
   git push origin add-report-name
   ```

6. **Open a Pull Request:**
   - Go to the repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Describe what report you're adding and why it's valuable

## Automated Processing

Don't worry if you skip the markdown conversion and catalog steps! When your PR is merged, our GitHub Actions workflow will automatically:

1. Convert the PDF to Markdown format
2. Update the catalog with the new report
3. Commit these changes back to the repository

## File Naming Guidelines

### Good Examples ✓
- `Newzoo - Global Games Market Report (2024).pdf`
- `Sensor Tower - Mobile Gaming Insights (2023).pdf`
- `GDC - State of the Game Industry (2025).pdf`

### Bad Examples ✗
- `report.pdf` (too generic)
- `Newzoo_2024.pdf` (missing title)
- `2024 Gaming Report.pdf` (missing author)

## Category Guidelines

Choose the most appropriate category for your report:

- **Blockchain NFT Web3**: Web3 gaming, NFTs, blockchain technology
- **Cloud Gaming**: Game streaming, cloud platforms
- **Esports**: Competitive gaming, tournaments, esports industry
- **General Industry**: Broad market reports, trends, industry analysis
- **HR**: Hiring, salaries, workplace culture, diversity
- **Investments**: M&A, funding, venture capital, IPOs
- **Marketing & Streaming**: User acquisition, retention, streaming platforms
- **Mobile**: Mobile gaming specific reports
- **Regional Reports**: Country or region-specific analysis
- **XR Metaverse**: VR, AR, MR, metaverse platforms

If you're unsure, use **General Industry** and mention it in your PR.

## Code Contributions

If you'd like to improve the conversion scripts or automation:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a PR with a clear description of the improvements

## Questions?

If you have questions or need help, please:
- Open a [Discussion](https://github.com/DerpBicycle/gameindustryreports/discussions)
- Or create an [Issue](https://github.com/DerpBicycle/gameindustryreports/issues)

## Code of Conduct

- Be respectful and inclusive
- Only share reports you have permission to distribute
- Give proper attribution to report authors
- Help maintain the quality and organization of the collection

Thank you for contributing! 🎮
