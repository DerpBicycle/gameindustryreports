const fs = require('fs');
const results = JSON.parse(fs.readFileSync('/tmp/pdf_analysis_results.json', 'utf8'));

// Create summary without full text
const summary = results.map(r => ({
  category: r.category,
  title: r.title,
  source: r.source,
  year: r.year,
  numPages: r.numPages,
  textLength: r.textLength,
  success: r.success,
  error: r.error,
  textSamplePreview: r.textSample ? r.textSample.substring(0, 500) + '...' : null
}));

console.log(JSON.stringify(summary, null, 2));

// Save each document's full analysis to separate file
results.forEach((r, idx) => {
  fs.writeFileSync(`/tmp/doc_${idx}_analysis.json`, JSON.stringify(r, null, 2));
});

console.log('\n\nCreated individual analysis files in /tmp/');
