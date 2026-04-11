"""
Infant Health Score Prediction System
=====================================
A Machine Learning pipeline for predicting infant health scores and risk levels.

Features:
- sleep_hours (0-12): Hours of sleep per day
- feeding_count (0-10): Number of feedings per day
- weight_change (-1 to +1 kg): Weight change in kg
- temperature (97-103 F): Body temperature in Fahrenheit
- activity_level (1-5): Activity level scale

Targets:
- health_score (0-100): Overall health score
- risk_level (Low, Moderate, High): Risk classification
"""

import numpy as np
import pandas as pd
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.metrics import accuracy_score, mean_squared_error, r2_score, classification_report
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')


class InfantHealthPredictor:
    """
    A complete ML pipeline for infant health prediction.
    
    This class handles:
    - Synthetic data generation
    - Model training (Random Forest)
    - Health prediction with explainability
    - Model persistence
    """
    
    def __init__(self, model_dir=None):
        """Initialize the predictor with model directory."""
        self.model_dir = model_dir or os.path.dirname(os.path.abspath(__file__))
        self.score_model = None
        self.risk_model = None
        self.label_encoder = LabelEncoder()
        self.feature_names = ['sleep_hours', 'feeding_count', 'weight_change', 
                              'temperature', 'activity_level']
        
    def generate_synthetic_data(self, n_samples=1000, seed=42):
        """
        Generate synthetic infant health dataset.
        
        Args:
            n_samples (int): Number of samples to generate
            seed (int): Random seed for reproducibility
            
        Returns:
            pd.DataFrame: Generated dataset
        """
        np.random.seed(seed)
        
        # Generate features with realistic distributions
        data = {
            # Sleep hours: normal distribution around 10 hours for infants
            'sleep_hours': np.clip(np.random.normal(10, 2, n_samples), 0, 12),
            
            # Feeding count: normal distribution around 6-8 feedings
            'feeding_count': np.clip(np.random.normal(7, 2, n_samples), 0, 10),
            
            # Weight change: slight positive trend with variation
            'weight_change': np.clip(np.random.normal(0.2, 0.3, n_samples), -1, 1),
            
            # Temperature: normal around 98.6 F
            'temperature': np.clip(np.random.normal(98.6, 0.5, n_samples), 97, 103),
            
            # Activity level: integer scale 1-5
            'activity_level': np.random.randint(1, 6, n_samples)
        }
        
        df = pd.DataFrame(data)
        
        # Calculate health score based on feature importance
        # This creates a realistic relationship between features and health
        df['health_score'] = self._calculate_health_score(df)
        
        # Determine risk level based on health score
        df['risk_level'] = self._calculate_risk_level(df['health_score'])
        
        return df
    
    def _calculate_health_score(self, df):
        """
        Calculate health score based on weighted feature contributions.
        
        Health score formula:
        - Sleep: 25% weight (optimal: 10-12 hours)
        - Feeding: 20% weight (optimal: 6-8 times)
        - Weight change: 20% weight (optimal: +0.1 to +0.5 kg)
        - Temperature: 20% weight (optimal: 98-99 F)
        - Activity: 15% weight (optimal: 3-5)
        """
        score = 0
        
        # Sleep contribution (optimal: 10-12 hours)
        sleep_score = np.where(
            (df['sleep_hours'] >= 10) & (df['sleep_hours'] <= 12), 25,
            np.where(
                (df['sleep_hours'] >= 8) & (df['sleep_hours'] < 10), 20,
                np.where(
                    (df['sleep_hours'] >= 6) & (df['sleep_hours'] < 8), 12,
                    5
                )
            )
        )
        
        # Feeding contribution (optimal: 6-8 times)
        feeding_score = np.where(
            (df['feeding_count'] >= 6) & (df['feeding_count'] <= 8), 20,
            np.where(
                (df['feeding_count'] >= 5) & (df['feeding_count'] < 6), 15,
                np.where(
                    (df['feeding_count'] >= 4) & (df['feeding_count'] < 5), 10,
                    5
                )
            )
        )
        
        # Weight change contribution (optimal: +0.1 to +0.5 kg)
        weight_score = np.where(
            (df['weight_change'] >= 0.1) & (df['weight_change'] <= 0.5), 20,
            np.where(
                (df['weight_change'] >= 0) & (df['weight_change'] < 0.1), 15,
                np.where(
                    (df['weight_change'] >= 0.5) & (df['weight_change'] <= 0.8), 15,
                    np.where(df['weight_change'] < 0, 5, 10)
                )
            )
        )
        
        # Temperature contribution (optimal: 98-99 F)
        temp_score = np.where(
            (df['temperature'] >= 98) & (df['temperature'] <= 99), 20,
            np.where(
                (df['temperature'] >= 97.5) & (df['temperature'] < 98), 15,
                np.where(
                    (df['temperature'] > 99) & (df['temperature'] <= 100), 12,
                    np.where(df['temperature'] > 100, 5, 10)
                )
            )
        )
        
        # Activity contribution (optimal: 3-5)
        activity_score = np.where(
            df['activity_level'] >= 4, 15,
            np.where(df['activity_level'] == 3, 12,
                np.where(df['activity_level'] == 2, 8, 5)
            )
        )
        
        score = sleep_score + feeding_score + weight_score + temp_score + activity_score
        
        # Add some noise to make it more realistic
        noise = np.random.normal(0, 3, len(df))
        score = np.clip(score + noise, 0, 100)
        
        return np.round(score, 1)
    
    def _calculate_risk_level(self, health_score):
        """
        Determine risk level based on health score.
        
        - Low: score >= 70
        - Moderate: 40 <= score < 70
        - High: score < 40
        """
        return pd.cut(
            health_score,
            bins=[-np.inf, 40, 70, np.inf],
            labels=['High', 'Moderate', 'Low']
        )
    
    def train(self, df=None, test_size=0.2, random_state=42, model_type='random_forest'):
        """
        Train the health prediction models.
        
        Args:
            df (pd.DataFrame): Training dataset. If None, generates synthetic data.
            test_size (float): Proportion of data for testing
            random_state (int): Random seed
            model_type (str): 'random_forest' or 'decision_tree'
            
        Returns:
            dict: Training metrics
        """
        # Generate data if not provided
        if df is None:
            df = self.generate_synthetic_data()
        
        # Prepare features and targets
        X = df[self.feature_names]
        y_score = df['health_score']
        y_risk = df['risk_level']
        
        # Encode risk labels
        y_risk_encoded = self.label_encoder.fit_transform(y_risk)
        
        # Split data
        X_train, X_test, y_score_train, y_score_test, y_risk_train, y_risk_test = \
            train_test_split(X, y_score, y_risk_encoded, 
                           test_size=test_size, random_state=random_state)
        
        # Select model type
        if model_type == 'random_forest':
            self.score_model = RandomForestRegressor(
                n_estimators=100, max_depth=10, random_state=random_state
            )
            self.risk_model = RandomForestClassifier(
                n_estimators=100, max_depth=10, random_state=random_state
            )
        else:
            self.score_model = DecisionTreeRegressor(max_depth=8, random_state=random_state)
            self.risk_model = DecisionTreeClassifier(max_depth=8, random_state=random_state)
        
        # Train models
        print("Training health score model...")
        self.score_model.fit(X_train, y_score_train)
        
        print("Training risk level model...")
        self.risk_model.fit(X_train, y_risk_train)
        
        # Evaluate models
        score_predictions = self.score_model.predict(X_test)
        risk_predictions = self.risk_model.predict(X_test)
        
        # Calculate metrics
        metrics = {
            'score_model': {
                'mse': mean_squared_error(y_score_test, score_predictions),
                'rmse': np.sqrt(mean_squared_error(y_score_test, score_predictions)),
                'r2': r2_score(y_score_test, score_predictions)
            },
            'risk_model': {
                'accuracy': accuracy_score(y_risk_test, risk_predictions),
                'classification_report': classification_report(
                    y_risk_test,
                    risk_predictions,
                    target_names=self.label_encoder.classes_,
                    labels=list(range(len(self.label_encoder.classes_)))
                )
            }
        }
        
        # Print results
        print("\n" + "="*60)
        print("MODEL TRAINING RESULTS")
        print("="*60)
        print(f"\nHealth Score Model ({model_type}):")
        print(f"  - RMSE: {metrics['score_model']['rmse']:.2f}")
        print(f"  - R² Score: {metrics['score_model']['r2']:.4f}")
        
        print(f"\nRisk Level Model ({model_type}):")
        print(f"  - Accuracy: {metrics['risk_model']['accuracy']*100:.2f}%")
        print("\nClassification Report:")
        print(metrics['risk_model']['classification_report'])
        
        # Feature importance
        print("\nFeature Importance:")
        importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': self.risk_model.feature_importances_
        }).sort_values('importance', ascending=False)
        print(importance.to_string(index=False))
        
        return metrics
    
    def predict_health(self, input_data):
        """
        Predict health score and risk level with explainability.
        
        Args:
            input_data (dict or pd.DataFrame): Input features
                Required keys: sleep_hours, feeding_count, weight_change,
                              temperature, activity_level
                
        Returns:
            dict: Prediction results with:
                - health_score (float): Predicted health score (0-100)
                - risk_level (str): Predicted risk level (Low/Moderate/High)
                - reasons (list): List of explanation strings
                - recommendations (list): List of actionable recommendations
        """
        if self.score_model is None or self.risk_model is None:
            raise ValueError("Models not trained. Call train() first or load saved models.")
        
        # Convert input to DataFrame if dict
        if isinstance(input_data, dict):
            df = pd.DataFrame([input_data])
        else:
            df = input_data
        
        # Ensure all features are present
        for feature in self.feature_names:
            if feature not in df.columns:
                raise ValueError(f"Missing feature: {feature}")
        
        # Extract features in correct order
        X = df[self.feature_names]
        
        # Make predictions
        health_score = self.score_model.predict(X)[0]
        risk_encoded = self.risk_model.predict(X)[0]
        risk_level = self.label_encoder.inverse_transform([risk_encoded])[0]
        
        # Generate explanations
        reasons = self._generate_reasons(input_data if isinstance(input_data, dict) else df.iloc[0].to_dict())
        recommendations = self._generate_recommendations(reasons)
        
        return {
            'health_score': round(float(health_score), 1),
            'risk_level': risk_level,
            'reasons': reasons,
            'recommendations': recommendations,
            'confidence': self._calculate_confidence(health_score)
        }
    
    def _generate_reasons(self, data):
        """
        Generate human-readable explanations for the prediction.
        
        Args:
            data (dict): Input features
            
        Returns:
            list: List of reason strings
        """
        reasons = []
        
        # Sleep analysis
        sleep = data['sleep_hours']
        if sleep < 6:
            reasons.append(f"⚠️ Low sleep: {sleep:.1f} hours (recommended: 10-12 hours)")
        elif sleep < 8:
            reasons.append(f"⚡ Below optimal sleep: {sleep:.1f} hours (recommended: 10-12 hours)")
        elif sleep > 12:
            reasons.append(f"💤 Excessive sleep: {sleep:.1f} hours (may indicate lethargy)")
        else:
            reasons.append(f"✅ Healthy sleep pattern: {sleep:.1f} hours")
        
        # Feeding analysis
        feeding = data['feeding_count']
        if feeding < 4:
            reasons.append(f"⚠️ Low feeding frequency: {feeding:.0f} times/day (recommended: 6-8)")
        elif feeding < 6:
            reasons.append(f"⚡ Below optimal feeding: {feeding:.0f} times/day")
        elif feeding > 10:
            reasons.append(f"🥛 Frequent feeding: {feeding:.0f} times/day (monitor for overfeeding)")
        else:
            reasons.append(f"✅ Healthy feeding pattern: {feeding:.0f} times/day")
        
        # Weight change analysis
        weight = data['weight_change']
        if weight < 0:
            reasons.append(f"⚠️ Weight loss detected: {weight:.2f} kg (consult pediatrician)")
        elif weight < 0.1:
            reasons.append(f"⚡ Minimal weight gain: {weight:.2f} kg (monitor closely)")
        elif weight > 0.8:
            reasons.append(f"📊 Rapid weight gain: {weight:.2f} kg (may need assessment)")
        else:
            reasons.append(f"✅ Healthy weight change: {weight:.2f} kg")
        
        # Temperature analysis
        temp = data['temperature']
        if temp > 100.4:
            reasons.append(f"🚨 High fever: {temp:.1f}°F (seek immediate medical attention)")
        elif temp > 99.5:
            reasons.append(f"⚠️ Elevated temperature: {temp:.1f}°F (monitor for fever)")
        elif temp < 97.5:
            reasons.append(f"⚠️ Low temperature: {temp:.1f}°F (check for hypothermia)")
        else:
            reasons.append(f"✅ Normal temperature: {temp:.1f}°F")
        
        # Activity level analysis
        activity = data['activity_level']
        if activity <= 1:
            reasons.append(f"⚠️ Low activity level: {activity}/5 (may indicate illness)")
        elif activity == 2:
            reasons.append(f"⚡ Below average activity: {activity}/5")
        elif activity >= 4:
            reasons.append(f"✅ Good activity level: {activity}/5")
        else:
            reasons.append(f"📊 Moderate activity level: {activity}/5")
        
        return reasons
    
    def _generate_recommendations(self, reasons):
        """
        Generate actionable recommendations based on identified issues.
        
        Args:
            reasons (list): List of reason strings
            
        Returns:
            list: List of recommendation strings
        """
        recommendations = []
        reasons_text = ' '.join(reasons).lower()
        
        if 'low sleep' in reasons_text or 'below optimal sleep' in reasons_text:
            recommendations.append("Establish a consistent sleep routine with dim lighting")
            recommendations.append("Avoid stimulation 1 hour before bedtime")
        
        if 'excessive sleep' in reasons_text:
            recommendations.append("Consult pediatrician about sleep patterns")
        
        if 'low feeding' in reasons_text or 'below optimal feeding' in reasons_text:
            recommendations.append("Ensure proper latch and feeding technique")
            recommendations.append("Track feeding times and amounts")
        
        if 'weight loss' in reasons_text:
            recommendations.append("Schedule pediatrician visit within 24-48 hours")
            recommendations.append("Monitor feeding intake closely")
        
        if 'rapid weight gain' in reasons_text:
            recommendations.append("Review feeding schedule with pediatrician")
        
        if 'high fever' in reasons_text:
            recommendations.append("Seek immediate medical attention")
            recommendations.append("Keep infant hydrated and comfortable")
        
        if 'elevated temperature' in reasons_text:
            recommendations.append("Monitor temperature every 2-3 hours")
            recommendations.append("Use age-appropriate fever management")
        
        if 'low temperature' in reasons_text:
            recommendations.append("Warm the infant with blankets")
            recommendations.append("Check room temperature")
        
        if 'low activity' in reasons_text:
            recommendations.append("Engage in age-appropriate play activities")
            recommendations.append("Monitor for signs of illness")
        
        if not recommendations:
            recommendations.append("Continue current care routine")
            recommendations.append("Maintain regular pediatric checkups")
        
        return recommendations
    
    def _calculate_confidence(self, health_score):
        """
        Calculate prediction confidence based on health score.
        
        Higher confidence for scores near boundaries.
        """
        # Confidence is higher when score is clearly in one category
        if health_score >= 80 or health_score <= 30:
            return 'High'
        elif health_score >= 60 or health_score <= 50:
            return 'Medium'
        else:
            return 'Low'
    
    def save_model(self, filename='health_model.pkl'):
        """
        Save trained models to disk.
        
        Args:
            filename (str): Name of the model file
        """
        if self.score_model is None or self.risk_model is None:
            raise ValueError("No trained models to save. Call train() first.")
        
        model_path = os.path.join(self.model_dir, filename)
        
        model_data = {
            'score_model': self.score_model,
            'risk_model': self.risk_model,
            'label_encoder': self.label_encoder,
            'feature_names': self.feature_names
        }
        
        with open(model_path, 'wb') as f:
            pickle.dump(model_data, f)
        
        print(f"\n✅ Model saved successfully to: {model_path}")
        return model_path
    
    def load_model(self, filename='health_model.pkl'):
        """
        Load trained models from disk.
        
        Args:
            filename (str): Name of the model file
        """
        model_path = os.path.join(self.model_dir, filename)
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
        
        self.score_model = model_data['score_model']
        self.risk_model = model_data['risk_model']
        self.label_encoder = model_data['label_encoder']
        self.feature_names = model_data['feature_names']
        
        # Don't print to stdout - this interferes with JSON output
        # print(f"✅ Model loaded successfully from: {model_path}")
        return True


def main():
    """
    Main function to demonstrate the ML pipeline.
    """
    print("="*60)
    print("INFANT HEALTH SCORE PREDICTION SYSTEM")
    print("="*60)
    
    # Initialize predictor
    predictor = InfantHealthPredictor()
    
    # Generate synthetic data
    print("\n📊 Generating synthetic dataset...")
    df = predictor.generate_synthetic_data(n_samples=2000)
    print(f"   Generated {len(df)} samples")
    print(f"\n   Sample statistics:")
    print(df.describe().round(2).to_string())
    
    # Train models
    print("\n" + "="*60)
    print("🏋️ TRAINING MODELS")
    print("="*60)
    metrics = predictor.train(df, model_type='random_forest')
    
    # Save model
    predictor.save_model('health_model.pkl')
    
    # Test predictions
    print("\n" + "="*60)
    print("🎯 TESTING PREDICTIONS")
    print("="*60)
    
    # Test cases
    test_cases = [
        {
            'name': 'Healthy Infant',
            'data': {
                'sleep_hours': 11,
                'feeding_count': 7,
                'weight_change': 0.3,
                'temperature': 98.6,
                'activity_level': 4
            }
        },
        {
            'name': 'At-Risk Infant',
            'data': {
                'sleep_hours': 5,
                'feeding_count': 3,
                'weight_change': -0.2,
                'temperature': 101.5,
                'activity_level': 1
            }
        },
        {
            'name': 'Moderate Case',
            'data': {
                'sleep_hours': 8,
                'feeding_count': 5,
                'weight_change': 0.1,
                'temperature': 99.2,
                'activity_level': 3
            }
        }
    ]
    
    for case in test_cases:
        print(f"\n📋 Test Case: {case['name']}")
        print("-" * 40)
        
        result = predictor.predict_health(case['data'])
        
        print(f"\n   Input Features:")
        for key, value in case['data'].items():
            print(f"      {key}: {value}")
        
        print(f"\n   Prediction Results:")
        print(f"      Health Score: {result['health_score']}/100")
        print(f"      Risk Level: {result['risk_level']}")
        print(f"      Confidence: {result['confidence']}")
        
        print(f"\n   Reasons:")
        for reason in result['reasons']:
            print(f"      {reason}")
        
        print(f"\n   Recommendations:")
        for rec in result['recommendations']:
            print(f"      • {rec}")
    
    print("\n" + "="*60)
    print("✅ ML PIPELINE COMPLETE")
    print("="*60)


if __name__ == "__main__":
    main()
