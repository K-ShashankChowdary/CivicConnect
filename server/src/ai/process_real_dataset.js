import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Category mapping from BBMP categories to our system
const categoryMapping = {
  'Electrical': 'electricity',
  'Solid Waste (Garbage) Related': 'waste_management',
  'Roads': 'roads',
  'Water Supply': 'water_supply',
  'Drainage': 'drainage',
  'Street Light': 'street_lighting',
  'Public Safety': 'public_safety',
  'Parks': 'parks_recreation',
  'Noise': 'noise_pollution',
  'Traffic': 'traffic',
  'Air Quality': 'air_quality',
  'Building': 'building_maintenance',
  'Animal': 'animal_control',
  'Transport': 'public_transport',
  'Sanitation': 'sanitation'
};

// Calculate priority based on category and sub-category
function calculatePriority(category, subCategory, status, wardName) {
  let priority = 0.5; // Base priority
  
  // Category-based priority
  const urgentCategories = ['Electrical', 'Water Supply', 'Drainage', 'Public Safety', 'Sanitation'];
  if (urgentCategories.includes(category)) {
    priority += 0.2;
  }
  
  // Sub-category urgency keywords
  const urgentKeywords = [
    'not working', 'broken', 'burst', 'overflow', 'dump', 'block', 
    'accident', 'danger', 'leak', 'flood', 'damage'
  ];
  
  const subCatLower = (subCategory || '').toLowerCase();
  const urgencyCount = urgentKeywords.filter(kw => subCatLower.includes(kw)).length;
  priority += urgencyCount * 0.1;
  
  // Status-based adjustment
  if (status === 'Closed' || status === 'Resolved') {
    priority -= 0.1; // Lower priority for resolved issues (historical data)
  }
  
  // Add some randomness for variety
  priority += (Math.random() * 0.1 - 0.05);
  
  // Clamp between 0.15 and 0.99
  return Math.min(0.99, Math.max(0.15, priority));
}

// Determine impact level from priority
function getImpactLevel(priority) {
  if (priority >= 0.9) return 'critical';
  if (priority >= 0.7) return 'high';
  if (priority >= 0.4) return 'medium';
  return 'low';
}

// Map category to our system
function mapCategory(bbmpCategory) {
  for (const [key, value] of Object.entries(categoryMapping)) {
    if (bbmpCategory.includes(key)) {
      return value;
    }
  }
  return 'waste_management'; // Default fallback
}

// Generate description from available data
function generateDescription(category, subCategory, wardName, status) {
  const templates = [
    `${subCategory} reported in ${wardName}`,
    `${subCategory} issue in ${wardName} area`,
    `Complaint regarding ${subCategory} at ${wardName}`,
    `${subCategory} problem in ${wardName} ward`,
    `Issue with ${subCategory} in ${wardName}`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

// Process the CSV file
function processDataset(inputFile, outputFile, sampleSize = 15000) {
  console.log(`Reading dataset from: ${inputFile}`);
  
  const data = fs.readFileSync(inputFile, 'utf-8');
  const lines = data.split('\n');
  const headers = lines[0].split(',');
  
  console.log(`Total rows: ${lines.length - 1}`);
  console.log(`Sampling ${sampleSize} rows for training...`);
  
  // Skip header, sample rows
  const dataLines = lines.slice(1).filter(line => line.trim());
  
  // Sample evenly across the dataset
  const step = Math.floor(dataLines.length / sampleSize);
  const sampledLines = [];
  for (let i = 0; i < dataLines.length && sampledLines.length < sampleSize; i += step) {
    sampledLines.push(dataLines[i]);
  }
  
  console.log(`Sampled ${sampledLines.length} rows`);
  
  // Process and convert
  const output = ['category,impact,description,priority'];
  let processed = 0;
  let skipped = 0;
  
  for (const line of sampledLines) {
    try {
      const parts = line.split(',');
      if (parts.length < 8) {
        skipped++;
        continue;
      }
      
      const [complaintId, category, subCategory, date, wardName, status, remarks, staff] = parts;
      
      if (!category || !wardName) {
        skipped++;
        continue;
      }
      
      const mappedCategory = mapCategory(category);
      const priority = calculatePriority(category, subCategory, status, wardName);
      const impact = getImpactLevel(priority);
      const description = generateDescription(category, subCategory, wardName, status);
      
      // Escape commas and quotes in description
      const cleanDesc = description.replace(/,/g, ';').replace(/"/g, '');
      
      output.push(`${mappedCategory},${impact},${cleanDesc},${priority.toFixed(2)}`);
      processed++;
      
    } catch (error) {
      skipped++;
      continue;
    }
  }
  
  // Write output
  fs.writeFileSync(outputFile, output.join('\n'));
  
  console.log(`\n✅ Processing complete!`);
  console.log(`   Processed: ${processed} rows`);
  console.log(`   Skipped: ${skipped} rows`);
  console.log(`   Output: ${outputFile}`);
  
  // Show category distribution
  const categories = {};
  output.slice(1).forEach(line => {
    const cat = line.split(',')[0];
    categories[cat] = (categories[cat] || 0) + 1;
  });
  
  console.log(`\n📊 Category Distribution:`);
  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} (${((count/processed)*100).toFixed(1)}%)`);
    });
}

// Run the script
const inputFile = path.join(__dirname, 'dataset/2025-grievances.csv');
const outputFile = path.join(__dirname, 'dataset/municipal_complaints_training.csv');

processDataset(inputFile, outputFile, 15000);
