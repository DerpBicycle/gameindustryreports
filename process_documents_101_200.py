#!/usr/bin/env python3
"""
Process documents 101-200 from documents.json
Analyzes PDFs and updates aiAnalysis field
"""

import json
import os
import re
from pathlib import Path
from datetime import datetime
import PyPDF2

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF file"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
    except Exception as e:
        print(f"Error reading PDF {pdf_path}: {e}")
        return None

def analyze_report_type(text):
    """Determine report type from content"""
    text_lower = text.lower()

    if any(word in text_lower for word in ['market research', 'market analysis', 'market overview', 'market size']):
        return "Market Research Report"
    elif any(word in text_lower for word in ['investment', 'investor', 'venture capital', 'funding']):
        return "Investment Report"
    elif any(word in text_lower for word in ['survey', 'respondents', 'questionnaire']):
        return "Survey Report"
    elif any(word in text_lower for word in ['forecast', 'prediction', 'outlook', 'projections']):
        return "Market Forecast"
    elif any(word in text_lower for word in ['financial results', 'earnings', 'revenue report', 'quarterly results']):
        return "Financial Report"
    elif any(word in text_lower for word in ['industry trends', 'trend analysis']):
        return "Trend Analysis"
    elif any(word in text_lower for word in ['white paper', 'technical paper']):
        return "White Paper"
    else:
        return "Industry Report"

def extract_metrics(text):
    """Extract numerical metrics with context"""
    metrics = []

    # Look for common patterns like "$X million", "X%", "X billion users"
    patterns = [
        r'\$(\d+(?:\.\d+)?)\s*(billion|million|trillion|bn|mn)',
        r'(\d+(?:\.\d+)?)\s*(%|percent|percentage)',
        r'(\d+(?:\.\d+)?)\s*(billion|million|thousand)\s*(users|players|downloads|devices)',
        r'(\d+(?:\.\d+)?)\s*(billion|million|trillion)\s*(revenue|market size|sales)',
    ]

    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            # Get context (50 chars before and after)
            start = max(0, match.start() - 50)
            end = min(len(text), match.end() + 50)
            context = text[start:end].strip()

            metrics.append({
                "value": match.group(1),
                "unit": match.group(2) if len(match.groups()) > 1 else "number",
                "context": context[:100]  # Limit context length
            })

    # Limit to top 10 metrics
    return metrics[:10]

def extract_companies(text):
    """Extract company and game names"""
    companies = []

    # Common gaming companies
    known_companies = [
        'Microsoft', 'Sony', 'Nintendo', 'Tencent', 'NetEase', 'Activision', 'Blizzard',
        'Electronic Arts', 'EA', 'Ubisoft', 'Take-Two', 'Rockstar', 'Epic Games',
        'Valve', 'Roblox', 'Unity', 'Unreal', 'Steam', 'Xbox', 'PlayStation',
        'Apple', 'Google', 'Amazon', 'Meta', 'Facebook', 'Riot Games', 'Supercell',
        'King', 'Zynga', 'Gearbox', 'Bungie', 'CD Projekt', 'Square Enix',
        'Capcom', 'Bandai Namco', 'Sega', 'Konami', 'Nexon', 'NCSoft',
        'Krafton', 'miHoYo', 'Niantic', 'Rovio', 'Gameloft', 'Glu Mobile'
    ]

    for company in known_companies:
        if re.search(r'\b' + re.escape(company) + r'\b', text, re.IGNORECASE):
            if company not in companies:
                companies.append(company)

    return companies[:15]  # Limit to 15

def extract_topics(text):
    """Identify main topics from content"""
    topics = []
    text_lower = text.lower()

    topic_keywords = {
        'Mobile Gaming': ['mobile gaming', 'mobile games', 'smartphone gaming', 'ios', 'android'],
        'Cloud Gaming': ['cloud gaming', 'game streaming', 'xcloud', 'geforce now', 'stadia'],
        'Esports': ['esports', 'e-sports', 'competitive gaming', 'tournament'],
        'VR/AR': ['virtual reality', 'augmented reality', 'vr', 'ar', 'mixed reality', 'meta quest'],
        'Blockchain & NFT': ['blockchain', 'nft', 'web3', 'cryptocurrency', 'crypto gaming'],
        'Metaverse': ['metaverse', 'virtual world', 'digital world'],
        'Market Growth': ['market growth', 'growth rate', 'cagr', 'expansion'],
        'Revenue & Monetization': ['revenue', 'monetization', 'in-app purchase', 'microtransaction'],
        'Player Behavior': ['player behavior', 'user behavior', 'gaming habits', 'engagement'],
        'Game Development': ['game development', 'game engine', 'unity', 'unreal engine'],
        'AI & Machine Learning': ['artificial intelligence', 'machine learning', 'ai', 'ml'],
        'User Acquisition': ['user acquisition', 'marketing', 'advertising', 'ua'],
        'Cross-Platform': ['cross-platform', 'multiplatform', 'cross-play'],
        'Subscription Services': ['subscription', 'game pass', 'ps plus', 'apple arcade'],
        'Console Gaming': ['console', 'playstation', 'xbox', 'nintendo switch'],
        'PC Gaming': ['pc gaming', 'steam', 'epic games store'],
    }

    for topic, keywords in topic_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            topics.append(topic)

    return topics[:10]  # Limit to 10

def generate_summary(text, title):
    """Generate a 2-3 paragraph summary"""
    # Extract first few meaningful paragraphs
    paragraphs = [p.strip() for p in text.split('\n\n') if len(p.strip()) > 100]

    # Get executive summary or introduction if present
    summary_sections = []
    text_lower = text.lower()

    # Look for common summary sections
    for section_name in ['executive summary', 'summary', 'abstract', 'introduction', 'overview']:
        idx = text_lower.find(section_name)
        if idx != -1:
            # Extract text after this heading
            section_text = text[idx:idx+2000]
            # Clean up
            section_text = re.sub(r'\n+', ' ', section_text)
            section_text = re.sub(r'\s+', ' ', section_text)
            if len(section_text) > 200:
                summary_sections.append(section_text[:1000])
                break

    if summary_sections:
        return summary_sections[0]
    elif paragraphs:
        # Use first few substantial paragraphs
        summary = ' '.join(paragraphs[:3])
        # Clean up
        summary = re.sub(r'\n+', ' ', summary)
        summary = re.sub(r'\s+', ' ', summary)
        return summary[:1000]
    else:
        return f"Analysis of {title}. This report covers gaming industry insights and trends."

def extract_key_findings(text):
    """Extract 5-10 key findings from the document"""
    findings = []

    # Look for bullet points, numbered lists, or "key findings" sections
    text_lower = text.lower()

    # Find key findings section
    for section_name in ['key findings', 'key takeaways', 'highlights', 'main findings']:
        idx = text_lower.find(section_name)
        if idx != -1:
            # Extract next 2000 chars
            section_text = text[idx:idx+2000]

            # Look for bullet points or numbered items
            lines = section_text.split('\n')
            for line in lines:
                line = line.strip()
                # Check if it looks like a bullet point or numbered item
                if (line.startswith('•') or line.startswith('-') or
                    line.startswith('*') or re.match(r'^\d+\.', line)):
                    finding = re.sub(r'^[•\-*\d\.]+\s*', '', line).strip()
                    if len(finding) > 20 and len(finding) < 500:
                        findings.append(finding)
                        if len(findings) >= 10:
                            break
            if len(findings) >= 5:
                break

    # If we don't have enough findings, extract sentences with key indicators
    if len(findings) < 5:
        key_indicators = [
            r'[Tt]he (global|worldwide|total) (gaming|game|market|industry).{10,200}(billion|million|grew|increased)',
            r'\d+% (of|growth|increase|rise).{10,200}(players|users|gamers|market)',
            r'(expected to|projected to|forecast to|will|estimated to).{10,200}(reach|grow|increase)',
        ]

        for pattern in key_indicators:
            matches = re.finditer(pattern, text)
            for match in matches:
                sentence_start = text.rfind('.', 0, match.start()) + 1
                sentence_end = text.find('.', match.end()) + 1
                if sentence_end > sentence_start:
                    finding = text[sentence_start:sentence_end].strip()
                    if len(finding) > 20 and len(finding) < 500:
                        findings.append(finding)
                        if len(findings) >= 10:
                            break
            if len(findings) >= 10:
                break

    # Fallback: extract sentences with numbers
    if len(findings) < 5:
        sentences = re.split(r'[.!?]', text)
        for sentence in sentences:
            if re.search(r'\d+', sentence) and len(sentence.strip()) > 30:
                findings.append(sentence.strip()[:300])
                if len(findings) >= 10:
                    break

    return findings[:10]

def determine_content_focus(text, topics):
    """Determine content focus areas"""
    focus_areas = []
    text_lower = text.lower()

    if 'Market Analysis' in topics or 'Market Growth' in topics:
        focus_areas.append('Market Analysis')
    if 'Player Behavior' in topics or 'User Acquisition' in topics:
        focus_areas.append('User Behavior')
    if any(t in topics for t in ['VR/AR', 'Cloud Gaming', 'AI & Machine Learning']):
        focus_areas.append('Technology')
    if 'Revenue & Monetization' in topics:
        focus_areas.append('Business Models')
    if 'Game Development' in topics:
        focus_areas.append('Development & Technology')
    if 'Blockchain & NFT' in topics:
        focus_areas.append('Blockchain & Web3')
    if 'Esports' in topics:
        focus_areas.append('Competitive Gaming')

    if not focus_areas:
        focus_areas = ['General Industry Analysis']

    return focus_areas[:5]

def analyze_document(doc, base_path):
    """Analyze a single document"""
    # PDFs are directly in category folders, not in data/ subfolder
    file_path = os.path.join(base_path, doc['filePath'])

    print(f"\nProcessing: {doc['title']}")
    print(f"File: {doc['fileName']}")

    # Extract text from PDF
    text = extract_text_from_pdf(file_path)
    if not text:
        print(f"Failed to extract text from {file_path}")
        return None

    print(f"Extracted {len(text)} characters")

    # Analyze content
    report_type = analyze_report_type(text)
    topics = extract_topics(text)
    companies = extract_companies(text)
    metrics = extract_metrics(text)
    summary = generate_summary(text, doc['title'])
    key_findings = extract_key_findings(text)
    content_focus = determine_content_focus(text, topics)

    # Build aiAnalysis object
    ai_analysis = {
        "reportType": report_type,
        "contentFocus": content_focus,
        "geographicScope": "Global",  # Default, could be enhanced
        "temporalNature": [f"Historical ({doc['metadata'].get('year', 'Unknown')})"],
        "dataCharacteristics": "Mixed",
        "targetAudience": ["Industry Professionals", "Investors"],
        "summary": summary,
        "keyFindings": key_findings,
        "topics": topics,
        "extractedMetrics": metrics,
        "companies": companies,
        "analyzedDate": datetime.utcnow().isoformat() + "Z"
    }

    print(f"Report Type: {report_type}")
    print(f"Topics: {', '.join(topics)}")
    print(f"Companies: {', '.join(companies[:5])}")
    print(f"Metrics extracted: {len(metrics)}")
    print(f"Key findings: {len(key_findings)}")

    return ai_analysis

def main():
    base_path = '/home/user/gameindustryreports'
    json_path = os.path.join(base_path, 'data', 'documents.json')

    # Load documents
    with open(json_path, 'r') as f:
        documents = json.load(f)

    print(f"Total documents: {len(documents)}")
    print(f"Processing documents 101-200 (indices 100-199)")

    # Process documents 100-199 (documents 101-200)
    processed_count = 0
    failed_count = 0

    for i in range(100, 200):
        if i >= len(documents):
            print(f"Index {i} out of range")
            break

        doc = documents[i]

        try:
            ai_analysis = analyze_document(doc, base_path)

            if ai_analysis:
                doc['aiAnalysis'] = ai_analysis
                doc['processingStatus'] = 'completed'
                doc['processedDate'] = datetime.utcnow().isoformat() + "Z"
                processed_count += 1
            else:
                doc['processingStatus'] = 'failed'
                failed_count += 1
        except Exception as e:
            print(f"Error processing document {i}: {e}")
            doc['processingStatus'] = 'failed'
            failed_count += 1

        # Save every 20 documents
        if (processed_count + failed_count) % 20 == 0:
            print(f"\n=== Saving progress: {processed_count} processed, {failed_count} failed ===")
            with open(json_path, 'w') as f:
                json.dump(documents, f, indent=2)
            print("Progress saved!")

    # Final save
    print(f"\n=== Final save: {processed_count} processed, {failed_count} failed ===")
    with open(json_path, 'w') as f:
        json.dump(documents, f, indent=2)

    print(f"\nProcessing complete!")
    print(f"Successfully processed: {processed_count}")
    print(f"Failed: {failed_count}")

    # Show sample results
    print("\n=== SAMPLE RESULTS ===")
    for i in range(100, min(105, len(documents))):
        doc = documents[i]
        if 'aiAnalysis' in doc:
            print(f"\n--- Document {i+1}: {doc['title']} ---")
            print(f"Report Type: {doc['aiAnalysis']['reportType']}")
            print(f"Topics: {', '.join(doc['aiAnalysis']['topics'][:5])}")
            print(f"Key Findings: {len(doc['aiAnalysis']['keyFindings'])}")
            print(f"Summary (first 200 chars): {doc['aiAnalysis']['summary'][:200]}...")

if __name__ == '__main__':
    main()
