'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useInfantStore } from '@/store/infantStore';
import { growthAPI } from '@/lib/api';
import { GrowthMeasurement } from '@/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PlusCircle, MinusCircle, Calendar, Ruler, Weight, Activity, ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import AddMeasurementForm from './AddMeasurementForm';
import { getReferenceValues } from '@/data/growthReferenceData';
import { useTranslation } from 'react-i18next';
import HealthPredictionCard from '@/components/dashboard/HealthPredictionCard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const GrowthTrackingPage = () => {
  const { id } = useParams<{ id: string }>();
  const { selectedInfant: infant, fetchInfant } = useInfantStore();
  const [growthMeasurements, setGrowthMeasurements] = useState<GrowthMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Don't try to fetch data if the ID is "new" (which would be an invalid route)
    if (id === 'new') {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchInfant(id);
        const response = await growthAPI.getGrowthMeasurements(id);
        setGrowthMeasurements(response.data.data || []);
      } catch (error) {
        console.error('Error fetching growth data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, fetchInfant]);

  const fetchData = async () => {
    // Don't try to fetch data if the ID is "new" (which would be an invalid route)
    if (id === 'new') {
      return;
    }

    try {
      setLoading(true);
      await fetchInfant(id);
      const response = await growthAPI.getGrowthMeasurements(id);
      setGrowthMeasurements(response.data.data || []);
    } catch (error) {
      console.error('Error fetching growth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMeasurementAdded = () => {
    // Refresh the measurements
    fetchData();
    setShowForm(false);
  };

  // Function to format dates for chart labels
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Function to get age in months from birth
  const getAgeInMonths = (dateString: string, birthDate: string) => {
    const measurementDate = new Date(dateString);
    const dob = new Date(birthDate);
    const diffMonths = (measurementDate.getFullYear() - dob.getFullYear()) * 12 + 
                      (measurementDate.getMonth() - dob.getMonth());
    return diffMonths;
  };

  // Prepare data for charts including birth values
  const prepareChartData = () => {
    // Start with birth data point if available
    const chartDataPoints = [];
    
    if (infant && (infant.birthLength || infant.birthWeight || infant.birthHeadCircumference)) {
      // Add birth data point
      chartDataPoints.push({
        date: infant.dateOfBirth,
        ageInMonths: 0,
        height: infant.birthLength || null,
        weight: infant.birthWeight || null,
        headCircumference: infant.birthHeadCircumference || null,
        isBirthData: true
      });
    }
    
    // Add all measurement data points
    growthMeasurements.forEach(measurement => {
      chartDataPoints.push({
        date: measurement.date,
        ageInMonths: infant ? getAgeInMonths(measurement.date, infant.dateOfBirth) : 0,
        height: measurement.height,
        weight: measurement.weight,
        headCircumference: measurement.headCircumference,
        isBirthData: false
      });
    });
    
    // Sort by date
    chartDataPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return chartDataPoints;
  };

  const chartDataPoints = prepareChartData();

  // Get latest measurements
  const getLatestMeasurements = () => {
    if (chartDataPoints.length === 0) return null;
    
    // Get the most recent non-birth measurement, or birth if no other measurements
    const latest = chartDataPoints[chartDataPoints.length - 1];
    return latest;
  };

  const latestMeasurements = getLatestMeasurements();

  // Calculate growth trends
  const calculateGrowthTrend = (measurements: any[], property: string) => {
    if (measurements.length < 2) return 'stable';
    
    const recent = measurements[measurements.length - 1][property];
    const previous = measurements[measurements.length - 2][property];
    
    if (recent > previous) return 'up';
    if (recent < previous) return 'down';
    return 'stable';
  };

  // Height chart data
  const heightChartData = {
    labels: chartDataPoints.map(point => point.isBirthData ? `${t('birth')} (${formatDate(point.date)})` : formatDate(point.date)),
    datasets: [
      {
        label: t('baby_height_cm'),
        data: chartDataPoints.map(point => point.height),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.3,
        pointRadius: chartDataPoints.map(point => point.isBirthData ? 6 : 4),
        pointBackgroundColor: chartDataPoints.map(point => point.isBirthData ? 'rgb(255, 99, 132)' : 'rgb(54, 162, 235)'),
        fill: true,
      },
      {
        label: t('min_target_height_cm'),
        data: chartDataPoints.map(point => {
          if (infant) {
            const reference = getReferenceValues(point.ageInMonths);
            return reference.heightMin;
          }
          return null;
        }),
        borderColor: 'rgb(255, 99, 132)',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
      {
        label: t('max_target_height_cm'),
        data: chartDataPoints.map(point => {
          if (infant) {
            const reference = getReferenceValues(point.ageInMonths);
            return reference.heightMax;
          }
          return null;
        }),
        borderColor: 'rgb(255, 99, 132)',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  // Weight chart data
  const weightChartData = {
    labels: chartDataPoints.map(point => point.isBirthData ? `${t('birth')} (${formatDate(point.date)})` : formatDate(point.date)),
    datasets: [
      {
        label: t('baby_weight_kg'),
        data: chartDataPoints.map(point => point.weight),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.3,
        pointRadius: chartDataPoints.map(point => point.isBirthData ? 6 : 4),
        pointBackgroundColor: chartDataPoints.map(point => point.isBirthData ? 'rgb(255, 99, 132)' : 'rgb(75, 192, 192)'),
        fill: true,
      },
      {
        label: t('min_target_weight_kg'),
        data: chartDataPoints.map(point => {
          if (infant) {
            const reference = getReferenceValues(point.ageInMonths);
            return reference.weightMin;
          }
          return null;
        }),
        borderColor: 'rgb(255, 99, 132)',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
      {
        label: t('max_target_weight_kg'),
        data: chartDataPoints.map(point => {
          if (infant) {
            const reference = getReferenceValues(point.ageInMonths);
            return reference.weightMax;
          }
          return null;
        }),
        borderColor: 'rgb(255, 99, 132)',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  // Head circumference chart data
  const headCircumferenceChartData = {
    labels: chartDataPoints.map(point => point.isBirthData ? `${t('birth')} (${formatDate(point.date)})` : formatDate(point.date)),
    datasets: [
      {
        label: t('baby_head_circumference_cm'),
        data: chartDataPoints.map(point => point.headCircumference),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.1)',
        tension: 0.3,
        pointRadius: chartDataPoints.map(point => point.isBirthData ? 6 : 4),
        pointBackgroundColor: chartDataPoints.map(point => point.isBirthData ? 'rgb(255, 99, 132)' : 'rgb(153, 102, 255)'),
        fill: true,
      },
      {
        label: t('min_target_head_circumference_cm'),
        data: chartDataPoints.map(point => {
          if (infant) {
            const reference = getReferenceValues(point.ageInMonths);
            return reference.headCircumferenceMin;
          }
          return null;
        }),
        borderColor: 'rgb(255, 99, 132)',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
      {
        label: t('max_target_head_circumference_cm'),
        data: chartDataPoints.map(point => {
          if (infant) {
            const reference = getReferenceValues(point.ageInMonths);
            return reference.headCircumferenceMax;
          }
          return null;
        }),
        borderColor: 'rgb(255, 99, 132)',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        font: {
          size: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        cornerRadius: 4,
        displayColors: true,
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-lg text-gray-600">{t('loading_growth_data')}</span>
      </div>
    );
  }

  // If we're on an invalid route (like "new"), show an error message
  if (id === 'new') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">{t('invalid_route')}</h2>
          <p className="text-red-700">
            {t('invalid_route_growth_desc')}
          </p>
        </div>
      </div>
    );
  }

  // Calculate trends
  const heightTrend = calculateGrowthTrend(chartDataPoints.filter(p => p.height), 'height');
  const weightTrend = calculateGrowthTrend(chartDataPoints.filter(p => p.weight), 'weight');
  const headCircumferenceTrend = calculateGrowthTrend(chartDataPoints.filter(p => p.headCircumference), 'headCircumference');

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link href={`/dashboard/infants/${id}`} className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('back_to_infant_details')}
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('growth_tracking')}</h1>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center">
          {showForm ? (
            <>
              <MinusCircle className="mr-2 h-4 w-4" />
              {t('cancel')}
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('add_measurement')}
            </>
          )}
        </Button>
      </div>

      {infant && (
        <div className="mb-2">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">{infant.name}'s {t('growth_progress')}</h2>
        </div>
      )}

      {/* Stats Overview */}
      {latestMeasurements && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 p-3 mr-4">
                  <Ruler className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('height')}</p>
                  <p className="text-xl font-bold text-gray-900">{latestMeasurements.height || 'N/A'} <span className="text-sm font-normal">cm</span></p>
                </div>
                <div className="ml-auto">
                  {heightTrend === 'up' ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : heightTrend === 'down' ? (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="rounded-full bg-green-100 p-3 mr-4">
                  <Weight className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('weight')}</p>
                  <p className="text-xl font-bold text-gray-900">{latestMeasurements.weight || 'N/A'} <span className="text-sm font-normal">kg</span></p>
                </div>
                <div className="ml-auto">
                  {weightTrend === 'up' ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : weightTrend === 'down' ? (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="rounded-full bg-purple-100 p-3 mr-4">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('head_circumference')}</p>
                  <p className="text-xl font-bold text-gray-900">{latestMeasurements.headCircumference || 'N/A'} <span className="text-sm font-normal">cm</span></p>
                </div>
                <div className="ml-auto">
                  {headCircumferenceTrend === 'up' ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : headCircumferenceTrend === 'down' ? (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Update Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PlusCircle className="mr-2 h-5 w-5" />
              {t('add_new_measurement')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddMeasurementForm infantId={id} onMeasurementAdded={handleMeasurementAdded} />
          </CardContent>
        </Card>
      )}

      {/* Timeline Toggle */}
      <div className="flex justify-center mb-6">
        <Button 
          variant="outline" 
          onClick={() => setShowTimeline(!showTimeline)}
          className="flex items-center"
        >
          <Calendar className="mr-2 h-4 w-4" />
          {showTimeline ? t('hide_timeline') : t('show_timeline')}
        </Button>
      </div>

      {/* Timeline */}
      {showTimeline && chartDataPoints.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              {t('growth_timeline')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('date')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('age')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('height')} ({t('cm')})
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('weight')} ({t('kg')})
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('head_circumference')} ({t('cm')})
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chartDataPoints.map((point, index) => (
                    <tr key={index} className={point.isBirthData ? 'bg-red-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {point.isBirthData ? `${t('birth')} (${formatDate(point.date)})` : formatDate(point.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {point.ageInMonths !== undefined ? `${point.ageInMonths} ${t('months')}` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {point.height || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {point.weight || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {point.headCircumference || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Ruler className="mr-2 h-5 w-5" />
              {t('height_vs_time')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-80">
              <Line data={heightChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Weight className="mr-2 h-5 w-5" />
              {t('weight_vs_time')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-80">
              <Line data={weightChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              {t('head_circumference_vs_time')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-80">
              <Line data={headCircumferenceChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Score Prediction Section */}
      {infant && (
        <HealthPredictionCard 
          infantId={id}
          latestWeight={latestMeasurements?.weight}
          previousWeight={chartDataPoints.length > 1 ? chartDataPoints[chartDataPoints.length - 2]?.weight : undefined}
        />
      )}

      {chartDataPoints.length === 0 && !showForm && (
        <Card>
          <CardContent className="text-center py-12">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">{t('no_growth_measurements_recorded')}</h3>
            <p className="mt-1 text-gray-500">
              {t('get_started_by_adding_first_measurement')}
            </p>
            <div className="mt-6">
              <Button onClick={() => setShowForm(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('add_first_measurement')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GrowthTrackingPage;