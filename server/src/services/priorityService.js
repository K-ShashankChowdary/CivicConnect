import fs from 'fs/promises';
import path from 'path';
import * as tf from '@tensorflow/tfjs';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const MODEL_CONFIG = {
  epochs: 200, // Reduced for faster training while maintaining accuracy
  batchSize: 32, // Larger batch size for faster training
  learningRate: 0.001, // Slightly higher for faster convergence
  validationSplit: 0.15 // Smaller validation split for more training data
};

const PRIORITY_THRESHOLDS = [0.4, 0.7, 0.9];

let model;
let encoders;

const priorityLevelFromScore = (score) => {
  if (score >= PRIORITY_THRESHOLDS[2]) return 'Critical';
  if (score >= PRIORITY_THRESHOLDS[1]) return 'High';
  if (score >= PRIORITY_THRESHOLDS[0]) return 'Medium';
  return 'Low';
};

const impactLevelFromScore = (score) => {
  if (score >= 0.9) return 'critical';
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
};

// Build vocabulary from descriptions for context understanding
const buildVocabulary = (samples) => {
  const wordFreq = {};
  
  samples.forEach(sample => {
    if (!sample.description) return; // Skip samples without description
    
    const words = sample.description.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2); // Include more words (length > 2)
    
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
  });
  
  // Get top 60 most important words - balanced for speed and context
  const sortedWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 60)
    .map(([word]) => word);
  
  const wordToIndex = {};
  sortedWords.forEach((word, idx) => {
    wordToIndex[word] = idx;
  });
  
  return { wordToIndex, vocabSize: sortedWords.length };
};

const buildEncoders = (samples) => {
  const categories = [...new Set(samples.map((s) => s.category))];

  const makeIndexMap = (values) => values.reduce((acc, value, idx) => {
    acc[value] = idx;
    return acc;
  }, {});

  // Build vocabulary from all descriptions
  const vocabulary = buildVocabulary(samples.map(s => s.description || ''));

  return {
    category: { map: makeIndexMap(categories), size: categories.length },
    vocabulary
  };
};

// Extract text features from description for context understanding
const extractTextFeatures = (description, vocabulary) => {
  const words = description.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  // Create a TF-IDF-like vector (term frequency)
  const textVector = new Array(vocabulary.vocabSize).fill(0);
  
  words.forEach(word => {
    const idx = vocabulary.wordToIndex[word];
    if (idx !== undefined) {
      textVector[idx] += 1; // Count frequency instead of binary
    }
  });
  
  // Normalize by document length
  const maxFreq = Math.max(...textVector, 1);
  for (let i = 0; i < textVector.length; i++) {
    textVector[i] = textVector[i] / maxFreq;
  }
  
  // Enhanced urgency keywords with more comprehensive list
  const urgencyKeywords = [
    'burst', 'flooding', 'critical', 'emergency', 'dangerous', 'urgent',
    'toxic', 'hazardous', 'collapse', 'explosion', 'leak', 'contaminated',
    'sparking', 'exposed', 'blocking', 'overflow', 'damage', 'severe',
    'major', 'broken', 'failed', 'failure', 'accident', 'injury', 'injured',
    'fire', 'smoke', 'gas', 'electrical', 'water', 'sewage', 'health',
    'safety', 'risk', 'threat', 'immediate', 'multiple', 'widespread'
  ];
  
  const urgencyCount = words.filter(w => urgencyKeywords.includes(w)).length;
  const urgencyScore = words.length > 0 ? urgencyCount / Math.sqrt(words.length) : 0;
  
  // Calculate description length feature (normalized)
  const lengthScore = Math.min(words.length / 50, 1); // Longer descriptions might be more detailed
  
  return { textVector, urgencyScore, lengthScore };
};

const encodeSample = ({ category, description }, encoder) => {
  // Normalize indices to 0-1 range
  const categoryIdx = (encoder.category.map[category] ?? 0) / Math.max(encoder.category.size - 1, 1);
  
  // Extract context from description
  const { textVector, urgencyScore, lengthScore } = extractTextFeatures(description || '', encoder.vocabulary);
  
  // Combine all features: category, urgency score, length score, + top 35 text features
  const topTextFeatures = textVector.slice(0, 35); // Balanced feature count for speed
  
  return [categoryIdx, urgencyScore, lengthScore, ...topTextFeatures];
};

const buildModel = (inputSize) => {
  const net = tf.sequential();
  
  // Optimized architecture for speed-accuracy balance
  // Input layer
  net.add(tf.layers.dense({ 
    units: 96, // Reduced from 128 for faster training
    activation: 'relu', 
    inputShape: [inputSize],
    kernelRegularizer: tf.regularizers.l2({ l2: 0.0005 }) // Lighter regularization
  }));
  net.add(tf.layers.batchNormalization());
  net.add(tf.layers.dropout({ rate: 0.25 }));
  
  // Second hidden layer
  net.add(tf.layers.dense({ 
    units: 48, // Reduced from 64
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.0005 })
  }));
  net.add(tf.layers.dropout({ rate: 0.2 }));
  
  // Third hidden layer
  net.add(tf.layers.dense({ 
    units: 24, // Reduced from 32
    activation: 'relu'
  }));
  net.add(tf.layers.dropout({ rate: 0.15 }));
  
  // Output layer
  net.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  const optimizer = tf.train.adam(MODEL_CONFIG.learningRate);
  net.compile({ 
    optimizer, 
    loss: 'meanSquaredError', 
    metrics: ['mae'] // Simplified metrics for speed
  });

  return net;
};

const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1)
    .filter(line => line.trim().length > 0) // Filter out empty lines
    .map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index]?.trim();
      });
      // Convert priority to number
      obj.priority = parseFloat(obj.priority);
      return obj;
    })
    .filter(obj => obj.category && obj.description); // Filter out invalid samples
};

export const initPriorityModel = async () => {
  if (model) return;

  // Switch between test data and real data
  // Use 'test_data.csv' for synthetic Bengaluru data (faster, for testing)
  // Use 'municipal_complaints_training.csv' for real BBMP data (14,703 samples)
  const datasetFile = process.env.USE_TEST_DATA === 'true' 
    ? 'test_data.csv' 
    : 'municipal_complaints_training.csv';
  
  const datasetPath = path.resolve(__dirname, '../ai/dataset', datasetFile);
  const raw = await fs.readFile(datasetPath, 'utf-8');
  const samples = parseCSV(raw);
  
  console.log(`Training AI model on ${samples.length} complaint samples...`);

  encoders = buildEncoders(samples);

  const encodedSamples = samples.map((sample) => encodeSample(sample, encoders));
  const inputSize = encodedSamples[0].length;
  
  console.log(`Feature vector size: ${inputSize} (includes text context features)`);
  
  const featureTensor = tf.tensor2d(encodedSamples);
  const labelTensor = tf.tensor2d(samples.map((sample) => [sample.priority]));

  model = buildModel(inputSize);
  
  console.log('Training with config:', MODEL_CONFIG);
  console.log('Sample priority distribution:', {
    low: samples.filter(s => s.priority < 0.4).length,
    medium: samples.filter(s => s.priority >= 0.4 && s.priority < 0.7).length,
    high: samples.filter(s => s.priority >= 0.7 && s.priority < 0.9).length,
    critical: samples.filter(s => s.priority >= 0.9).length
  });
  
  // Early stopping callback - optimized for speed
  let bestValLoss = Infinity;
  let patience = 30; // Reduced patience for faster training
  let patienceCounter = 0;
  
  await model.fit(featureTensor, labelTensor, {
    epochs: MODEL_CONFIG.epochs,
    batchSize: MODEL_CONFIG.batchSize,
    shuffle: true,
    verbose: 0,
    validationSplit: MODEL_CONFIG.validationSplit,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        // Early stopping logic
        if (logs.val_loss < bestValLoss) {
          bestValLoss = logs.val_loss;
          patienceCounter = 0;
        } else {
          patienceCounter++;
        }
        
        // Log progress every 25 epochs
        if (epoch % 25 === 0 || epoch === MODEL_CONFIG.epochs - 1) {
          console.log(`Epoch ${epoch}: loss=${logs.loss.toFixed(4)}, val_loss=${logs.val_loss.toFixed(4)}, mae=${logs.mae.toFixed(4)}`);
        }
        
        // Stop if no improvement for 'patience' epochs
        if (patienceCounter >= patience) {
          console.log(`Early stopping at epoch ${epoch}. Best val_loss: ${bestValLoss.toFixed(4)}`);
          model.stopTraining = true;
        }
      }
    }
  });

  console.log('AI model training completed successfully!');

  featureTensor.dispose();
  labelTensor.dispose();
};

export const predictPriority = async (payload) => {
  try {
    if (!model) {
      console.log('Initializing AI model...');
      await initPriorityModel();
    }

    // Validate payload
    if (!payload.category || !payload.description) {
      console.error('Missing required fields:', payload);
      throw new Error('Missing required fields: category or description');
    }

    const encodedSample = encodeSample(payload, encoders);
    
    // Check for NaN in encoded features
    if (encodedSample.some(val => isNaN(val))) {
      console.error('NaN detected in encoded features:', encodedSample);
      throw new Error('Invalid feature encoding');
    }

    const input = tf.tensor2d([encodedSample]);
    const output = model.predict(input);
    const score = (await output.data())[0];

    input.dispose();
    output.dispose();

    // Validate score
    if (isNaN(score) || score === null || score === undefined) {
      console.error('Invalid score generated:', score);
      throw new Error('Failed to generate valid priority score');
    }

    const priorityLevel = priorityLevelFromScore(score);
    const impactLevel = impactLevelFromScore(score);

    console.log(`AI Prediction for "${payload.description?.substring(0, 50)}...":`, {
      category: payload.category,
      predictedImpact: impactLevel,
      score: score.toFixed(3),
      priorityLevel: priorityLevel
    });

    return {
      score,
      priorityLevel,
      impactLevel,
      tags: [
        { label: 'Priority', value: priorityLevel },
        { label: 'Impact', value: impactLevel.charAt(0).toUpperCase() + impactLevel.slice(1) },
        { label: 'Urgency Score', value: score.toFixed(2) },
        { label: 'Location', value: payload.location ?? 'Unknown' }
      ]
    };
  } catch (error) {
    console.error('Error in predictPriority:', error);
    // Return a default fallback
    return {
      score: 0.5,
      priorityLevel: 'Medium',
      tags: [
        { label: 'Priority', value: 'Medium' },
        { label: 'Urgency Score', value: '0.50' },
        { label: 'Location', value: payload.location ?? 'Unknown' }
      ]
    };
  }
};
