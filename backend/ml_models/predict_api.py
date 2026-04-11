#!/usr/bin/env python3
"""
Health Prediction API Wrapper
=============================
This script provides a command-line interface for making health predictions.
It can be called from Node.js to integrate Python ML with the backend.

Usage:
    python predict_api.py --predict '{"sleep_hours": 10, "feeding_count": 7, ...}'
    python predict_api.py --train
    python predict_api.py --status
"""

import sys
import json
import argparse
import os

# Add the ml_models directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from health_predictor import InfantHealthPredictor


def get_predictor():
    """Get or create the predictor instance."""
    predictor = InfantHealthPredictor()
    model_path = os.path.join(os.path.dirname(__file__), 'health_model.pkl')
    
    if os.path.exists(model_path):
        predictor.load_model('health_model.pkl')
    else:
        # Train if model doesn't exist
        print("Model not found. Training new model...", file=sys.stderr)
        predictor.train()
        predictor.save_model('health_model.pkl')
    
    return predictor


def predict(input_data):
    """
    Make a health prediction.
    
    Args:
        input_data (dict): Input features
        
    Returns:
        dict: Prediction results
    """
    try:
        predictor = get_predictor()
        result = predictor.predict_health(input_data)
        return {
            'success': True,
            'data': result
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def train_model():
    """Train a new model and save it."""
    try:
        predictor = InfantHealthPredictor()
        metrics = predictor.train()
        predictor.save_model('health_model.pkl')
        return {
            'success': True,
            'message': 'Model trained successfully',
            'metrics': {
                'score_r2': metrics['score_model']['r2'],
                'risk_accuracy': metrics['risk_model']['accuracy']
            }
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def get_status():
    """Get the status of the ML system."""
    model_path = os.path.join(os.path.dirname(__file__), 'health_model.pkl')
    
    return {
        'success': True,
        'data': {
            'model_exists': os.path.exists(model_path),
            'model_path': model_path if os.path.exists(model_path) else None,
            'features': ['sleep_hours', 'feeding_count', 'weight_change', 'temperature', 'activity_level'],
            'targets': ['health_score', 'risk_level']
        }
    }


def main():
    parser = argparse.ArgumentParser(description='Infant Health Prediction API')
    
    parser.add_argument('--predict', type=str, help='JSON string of input data for prediction')
    parser.add_argument('--train', action='store_true', help='Train a new model')
    parser.add_argument('--status', action='store_true', help='Get system status')
    
    args = parser.parse_args()
    
    if args.predict:
        try:
            input_data = json.loads(args.predict)
            result = predict(input_data)
        except json.JSONDecodeError as e:
            result = {
                'success': False,
                'error': f'Invalid JSON input: {str(e)}'
            }
    elif args.train:
        result = train_model()
    elif args.status:
        result = get_status()
    else:
        result = {
            'success': False,
            'error': 'No action specified. Use --predict, --train, or --status'
        }
    
    # Output as JSON
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
