const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const documents = [
  {
    "category": "Blockchain NFT Web3",
    "title": "Trends to Watch in 2022 - Games Esports Live Streaming Cloud and the Metaverse",
    "fileName": "Newzoo - Trends to Watch in 2022 - Games Esports Live Streaming Cloud and the Metaverse (2022).pdf",
    "filePath": "Blockchain NFT Web3/Newzoo - Trends to Watch in 2022 - Games Esports Live Streaming Cloud and the Metaverse (2022).pdf",
    "source": "Newzoo",
    "year": 2022
  },
  {
    "category": "Cloud Gaming",
    "title": "Global Cloud Gaming Report",
    "fileName": "Newzoo - Global Cloud Gaming Report (2022).pdf",
    "filePath": "Cloud Gaming/Newzoo - Global Cloud Gaming Report (2022).pdf",
    "source": "Newzoo",
    "year": 2022
  },
  {
    "category": "Esports",
    "title": "Europe and Esports - High Engagement and Even Higher Potential",
    "fileName": "Newzoo Paypal - Europe and Esports - High Engagement and Even Higher Potential (2020).pdf",
    "filePath": "Esports/Newzoo Paypal - Europe and Esports - High Engagement and Even Higher Potential (2020).pdf",
    "source": "Newzoo Paypal",
    "year": 2020
  },
  {
    "category": "General Industry",
    "title": "Game & Network Services Segment",
    "fileName": "PlayStation - Game & Network Services Segment (2024).pdf",
    "filePath": "General Industry/PlayStation - Game & Network Services Segment (2024).pdf",
    "source": "PlayStation",
    "year": 2024
  },
  {
    "category": "HR",
    "title": "State of the Game Development Industry - Workplace Culture, Mental Health and HR Trends",
    "fileName": "80LV - State of the Game Development Industry - Workplace Culture, Mental Health and HR Trends (2023).pdf",
    "filePath": "HR/80LV - State of the Game Development Industry - Workplace Culture, Mental Health and HR Trends (2023).pdf",
    "source": "80LV",
    "year": 2023
  },
  {
    "category": "Investments",
    "title": "Q2",
    "fileName": "InvestGame - Q2 (2024).pdf",
    "filePath": "Investments/InvestGame - Q2 (2024).pdf",
    "source": "InvestGame",
    "year": 2024
  },
  {
    "category": "Marketing & Streaming",
    "title": "report_ugc_ninja_x_apptica",
    "fileName": "report_ugc_ninja_x_apptica.pdf",
    "filePath": "Marketing & Streaming/report_ugc_ninja_x_apptica.pdf",
    "source": null,
    "year": null
  },
  {
    "category": "Mobile",
    "title": "Mobile App Trends (APAC)",
    "fileName": "Adjust - Mobile App Trends (APAC) (2021).pdf",
    "filePath": "Mobile/Adjust - Mobile App Trends (APAC) (2021).pdf",
    "source": "Adjust",
    "year": 2021
  },
  {
    "category": "Regional Reports",
    "title": "Paas for Mobile Cloud Gaming",
    "fileName": "Niko - Paas for Mobile Cloud Gaming (November 2021).pdf",
    "filePath": "Regional Reports/Niko - Paas for Mobile Cloud Gaming (November 2021).pdf",
    "source": "Niko",
    "year": 2021
  },
  {
    "category": "XR Metaverse",
    "title": "Games Esports Cloud Metaverse Trends",
    "fileName": "Newzoo - Games Esports Cloud Metaverse Trends (2022).pdf",
    "filePath": "XR Metaverse/Newzoo - Games Esports Cloud Metaverse Trends (2022).pdf",
    "source": "Newzoo",
    "year": 2022
  }
];

const baseDir = '/home/user/gameindustryreports';

async function analyzePDF(doc) {
  try {
    const fullPath = path.join(baseDir, doc.filePath);
    
    if (!fs.existsSync(fullPath)) {
      return {
        ...doc,
        error: `File not found: ${fullPath}`
      };
    }
    
    const dataBuffer = fs.readFileSync(fullPath);
    const data = await pdf(dataBuffer);
    
    // Extract first ~8000 characters to analyze (approximately 5-10 pages depending on content density)
    const textSample = data.text.substring(0, 8000);
    
    return {
      ...doc,
      numPages: data.numpages,
      textLength: data.text.length,
      textSample: textSample,
      success: true
    };
  } catch (error) {
    return {
      ...doc,
      error: error.message,
      success: false
    };
  }
}

async function main() {
  const results = [];
  
  for (const doc of documents) {
    console.log(`Processing: ${doc.fileName}...`);
    const result = await analyzePDF(doc);
    results.push(result);
  }
  
  // Save results to a file
  fs.writeFileSync('/tmp/pdf_analysis_results.json', JSON.stringify(results, null, 2));
  console.log('\n\nAnalysis complete! Results saved to /tmp/pdf_analysis_results.json');
}

main().catch(console.error);
