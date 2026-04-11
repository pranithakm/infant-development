'use strict';

const { spawn } = require('child_process');
const path = require('path');

// Path to the Python API script
const PYTHON_API_PATH = path.join(__dirname, '..', 'ml_models', 'predict_api.py');

/**
 * Execute Python script and return result
 * @param {string[]} args - Command line arguments for Python script
 * @returns {Promise<object>} - Parsed JSON result
 */
const executePython = (args) => {
  return new Promise((resolve, reject) => {
    // Use 'python' which points to anaconda on this system
    const python = spawn('python', [PYTHON_API_PATH, ...args]);
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse Python output: ${error.message}\nOutput: ${stdout}`));
      }
    });
    
    python.on('error', (error) => {
      reject(new Error(`Failed to spawn Python process: ${error.message}`));
    });
  });
};

/**
 * Predict health score and risk level
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const predictHealth = async (req, res) => {
  try {
    const { sleep_hours, feeding_count, weight_change, temperature, activity_level } = req.body;
    
    // Validate input
    if (sleep_hours === undefined || feeding_count === undefined || 
        weight_change === undefined || temperature === undefined || 
        activity_level === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields. Required: sleep_hours, feeding_count, weight_change, temperature, activity_level'
      });
    }
    
    // Validate ranges
    const validations = [
      { field: 'sleep_hours', min: 0, max: 20, value: sleep_hours },
      { field: 'feeding_count', min: 0, max: 10, value: feeding_count },
      { field: 'weight_change', min: -10, max: 10, value: weight_change },
      { field: 'temperature', min: 80, max: 120, value: temperature },
      { field: 'activity_level', min: 1, max: 5, value: activity_level }
    ];
    
    for (const v of validations) {
      if (typeof v.value !== 'number' || v.value < v.min || v.value > v.max) {
        return res.status(400).json({
          success: false,
          message: `${v.field} must be a number between ${v.min} and ${v.max}`
        });
      }
    }
    
    // Prepare input data
    const inputData = {
      sleep_hours: parseFloat(sleep_hours),
      feeding_count: parseInt(feeding_count),
      weight_change: parseFloat(weight_change),
      temperature: parseFloat(temperature),
      activity_level: parseInt(activity_level)
    };
    
    console.log('Health prediction request:', inputData);
    
    // Call Python ML model
    const inputJson = JSON.stringify(inputData);
    const result = await executePython(['--predict', inputJson]);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Prediction failed',
        error: result.error
      });
    }
    
    console.log('Prediction result:', result.data);
    
    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error in predictHealth:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to make prediction',
      error: error.message
    });
  }
};

/**
 * Get ML model status
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getModelStatus = async (req, res) => {
  try {
    const result = await executePython(['--status']);
    
    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error getting model status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get model status',
      error: error.message
    });
  }
};

/**
 * Train a new model
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const trainModel = async (req, res) => {
  try {
    console.log('Training new health model...');
    
    const result = await executePython(['--train']);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Training failed',
        error: result.error
      });
    }
    
    console.log('Model training complete:', result.metrics);
    
    res.status(200).json({
      success: true,
      message: result.message,
      metrics: result.metrics
    });
  } catch (error) {
    console.error('Error training model:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to train model',
      error: error.message
    });
  }
};

/**
 * Batch predict for multiple infants
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const batchPredict = async (req, res) => {
  try {
    const { infants } = req.body;
    
    if (!Array.isArray(infants) || infants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body must contain an array of infants'
      });
    }
    
    const results = [];
    
    for (const infant of infants) {
      const inputJson = JSON.stringify(infant.data);
      
      try {
        const result = await executePython(['--predict', inputJson]);
        results.push({
          id: infant.id,
          success: result.success,
          data: result.data,
          error: result.error
        });
      } catch (error) {
        results.push({
          id: infant.id,
          success: false,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error in batch prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform batch prediction',
      error: error.message
    });
  }
};

module.exports = {
  predictHealth,
  getModelStatus,
  trainModel,
  batchPredict
};
