'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { healthPredictionAPI, growthAPI } from '@/lib/api';
import { 
  Heart, 
  Activity, 
  Moon, 
  Utensils, 
  Scale, 
  Thermometer, 
  Sparkles,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Loader2,
  Database,
  Edit2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HealthPredictionInput {
  sleep_hours: number;
  feeding_count: number;
  weight_change: number;
  temperature: number;
  activity_level: number;
}

interface HealthPredictionResult {
  health_score: number;
  risk_level: 'Low' | 'Moderate' | 'High';
  reasons: string[];
  recommendations: string[];
  confidence: 'High' | 'Medium' | 'Low';
}

interface HealthPredictionCardProps {
  infantId: string;
  latestWeight?: number | null;
  previousWeight?: number | null;
}

const HealthPredictionCard: React.FC<HealthPredictionCardProps> = ({
  infantId,
  latestWeight,
  previousWeight
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<HealthPredictionResult | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Calculate weight change from DB data
  const calculatedWeightChange = latestWeight && previousWeight 
    ? +(latestWeight - previousWeight).toFixed(2) 
    : 0;
  
  // Form inputs - only user-provided values, weight_change comes from DB
  const [formData, setFormData] = useState<HealthPredictionInput>({
    sleep_hours: 10,
    feeding_count: 7,
    weight_change: calculatedWeightChange, // Auto-filled from DB
    temperature: 98.6,
    activity_level: 3
  });

  // Update weight_change when props change
  useEffect(() => {
    if (latestWeight !== null && latestWeight !== undefined && 
        previousWeight !== null && previousWeight !== undefined) {
      setFormData(prev => ({
        ...prev,
        weight_change: +(latestWeight - previousWeight).toFixed(2)
      }));
    }
  }, [latestWeight, previousWeight]);

  const handleInputChange = (field: keyof HealthPredictionInput, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePredict = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await healthPredictionAPI.predict(formData);
      
      if (response.data.success) {
        setPrediction(response.data.data);
        setShowForm(false);
      } else {
        setError(response.data.message || 'Prediction failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get prediction');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Moderate': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'Low': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Moderate': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'High': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'High': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if weight data is from DB
  const hasWeightFromDB = latestWeight !== null && latestWeight !== undefined && 
                          previousWeight !== null && previousWeight !== undefined;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Heart className="mr-2 h-5 w-5 text-pink-500" />
            {t('health_score_prediction') || 'Health Score Prediction'}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {prediction ? (t('new_prediction') || 'New Prediction') : (t('predict') || 'Predict')}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Input Form */}
        {showForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              {t('enter_health_indicators') || 'Enter Health Indicators'}
            </h4>
            <p className="text-sm text-gray-500 mb-4">
              {t('health_form_desc') || 'Enter current health indicators. Weight change is automatically calculated from growth records.'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Weight Change - From DB (read-only) */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Database className="h-4 w-4 mr-1 text-blue-500" />
                  {t('weight_change') || 'Weight Change'}
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={formData.weight_change}
                    readOnly
                    title="Weight change is automatically calculated from growth records"
                    className="w-full px-3 py-2 border border-blue-200 rounded-md bg-blue-50 text-gray-700"
                  />
                  <span className="ml-2 text-sm text-gray-500">kg</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {hasWeightFromDB 
                    ? `✓ ${t('auto_from_db') || 'Auto-filled from growth records'}`
                    : `ℹ ${t('no_weight_data') || 'No previous weight data available'}`
                  }
                </p>
              </div>
              
              {/* Sleep Hours - User Input */}
              <div>
                <label htmlFor="sleep_hours" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Moon className="h-4 w-4 mr-1 text-indigo-500" />
                  {t('sleep_hours') || 'Sleep Hours'}
                </label>
                <input
                  id="sleep_hours"
                  name="sleep_hours"
                  type="number"
                  min="0"
                  max="12"
                  step="0.5"
                  value={formData.sleep_hours}
                  onChange={(e) => handleInputChange('sleep_hours', parseFloat(e.target.value))}
                  placeholder="Hours of sleep today"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">0-12 hours (recommended: 10-12)</p>
              </div>
              
              {/* Feeding Count - User Input */}
              <div>
                <label htmlFor="feeding_count" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Utensils className="h-4 w-4 mr-1 text-orange-500" />
                  {t('feeding_count') || 'Feeding Count'}
                </label>
                <input
                  id="feeding_count"
                  name="feeding_count"
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  value={formData.feeding_count}
                  onChange={(e) => handleInputChange('feeding_count', parseInt(e.target.value))}
                  placeholder="Times fed today"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Times per day (recommended: 6-8)</p>
              </div>
              
              {/* Temperature - User Input */}
              <div>
                <label htmlFor="temperature" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Thermometer className="h-4 w-4 mr-1 text-red-500" />
                  {t('temperature') || 'Temperature'}
                </label>
                <input
                  id="temperature"
                  name="temperature"
                  type="number"
                  min="97"
                  max="103"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                  placeholder="Current temperature"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Fahrenheit (normal: 97-99°F)</p>
              </div>
              
              {/* Activity Level - User Input */}
              <div>
                <label htmlFor="activity_level" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Activity className="h-4 w-4 mr-1 text-blue-500" />
                  {t('activity_level') || 'Activity Level'}
                </label>
                <select
                  id="activity_level"
                  name="activity_level"
                  value={formData.activity_level}
                  onChange={(e) => handleInputChange('activity_level', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>1 - Very Low (lethargic)</option>
                  <option value={2}>2 - Low (drowsy)</option>
                  <option value={3}>3 - Average</option>
                  <option value={4}>4 - Good (alert)</option>
                  <option value={5}>5 - Very Active (energetic)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Current activity level</p>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                {t('cancel') || 'Cancel'}
              </Button>
              <Button onClick={handlePredict} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('analyzing') || 'Analyzing...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t('get_prediction') || 'Get Prediction'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Prediction Results */}
        {prediction && (
          <div className="space-y-4">
            {/* Score and Risk Level */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Health Score */}
              <div className="flex-1 p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">
                  {t('health_score') || 'Health Score'}
                </p>
                <p className={`text-5xl font-bold ${getScoreColor(prediction.health_score)}`}>
                  {prediction.health_score}
                </p>
                <p className="text-sm text-gray-500 mt-1">/ 100</p>
              </div>
              
              {/* Risk Level */}
              <div className="flex-1 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">
                  {t('risk_level') || 'Risk Level'}
                </p>
                <div className="flex items-center justify-center mt-2">
                  {getRiskLevelIcon(prediction.risk_level)}
                  <span className={`ml-2 text-2xl font-bold px-3 py-1 rounded-full ${getRiskLevelColor(prediction.risk_level)}`}>
                    {prediction.risk_level}
                  </span>
                </div>
                <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${getConfidenceBadge(prediction.confidence)}`}>
                  {prediction.confidence} {t('confidence') || 'confidence'}
                </span>
              </div>
            </div>

            {/* Reasons */}
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
                {t('analysis') || 'Analysis'}
              </h4>
              <ul className="space-y-2">
                {prediction.reasons.map((reason, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                {t('recommendations') || 'Recommendations'}
              </h4>
              <ul className="space-y-2">
                {prediction.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <CheckCircle className="h-3 w-3 mr-2 mt-1 text-green-500 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-gray-500 italic text-center p-2 bg-gray-50 rounded">
              {t('ml_disclaimer') || 'This prediction is generated by a Machine Learning model and should not replace professional medical advice. Always consult a pediatrician for health concerns.'}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!prediction && !showForm && (
          <div className="text-center py-8">
            <Heart className="mx-auto h-12 w-12 text-pink-300" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              {t('no_prediction_yet') || 'No Prediction Yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('click_predict_to_start') || 'Click the Predict button to get a health score prediction'}
            </p>
            {hasWeightFromDB && (
              <p className="mt-2 text-xs text-blue-600">
                <Database className="h-3 w-3 inline mr-1" />
                {t('weight_auto_available') || 'Weight data from growth records will be used automatically'}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthPredictionCard;
