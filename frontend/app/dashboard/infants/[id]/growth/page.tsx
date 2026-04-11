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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PlusCircle, MinusCircle, Calendar, Ruler, Weight, Activity, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AddMeasurementForm from './AddMeasurementForm';
import { getReferenceValues } from '@/data/growthReferenceData';
import { useTranslation } from 'react-i18next';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
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

  // Height chart data
  const heightChartData = {
    labels: chartDataPoints.map(point => point.isBirthData ? `${t('birth')} (${formatDate(point.date)})` : formatDate(point.date)),
    datasets: [
      {
        label: t('baby_height_cm'),
        data: chartDataPoints.map(point => point.height),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        tension: 0.1,
        pointRadius: chartDataPoints.map(point => point.isBirthData ? 6 : 4),
        pointBackgroundColor: chartDataPoints.map(point => point.isBirthData ? 'rgb(255, 99, 132)' : 'rgb(54, 162, 235)'),
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
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        tension: 0.1,
        pointRadius: chartDataPoints.map(point => point.isBirthData ? 6 : 4),
        pointBackgroundColor: chartDataPoints.map(point => point.isBirthData ? 'rgb(255, 99, 132)' : 'rgb(54, 162, 235)'),
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
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        tension: 0.1,
        pointRadius: chartDataPoints.map(point => point.isBirthData ? 6 : 4),
        pointBackgroundColor: chartDataPoints.map(point => point.isBirthData ? 'rgb(255, 99, 132)' : 'rgb(54, 162, 235)'),
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
      },
      title: {
        display: true,
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">{t('loading_growth_data')}</div>;
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href={`/dashboard/infants/${id}`} className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('back_to_infant_details')}
          </Link>
          <h1 className="text-3xl font-bold">{t('growth_tracking')}</h1>
        </div>
      </div>

      {infant && (
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">{infant.name}'s {t('growth_progress')}</h2>
        </div>
      )}

      {/* Current Values Container */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t('current_measurements')}</CardTitle>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? (
                <>
                  <MinusCircle className="mr-2 h-4 w-4" />
                  {t('cancel')}
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('update')}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {latestMeasurements ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                <Ruler className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">{t('height')}</p>
                  <p className="text-xl font-bold">{latestMeasurements.height || 'N/A'} {t('cm')}</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-green-50 rounded-lg">
                <Weight className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">{t('weight')}</p>
                  <p className="text-xl font-bold">{latestMeasurements.weight || 'N/A'} {t('kg')}</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                <Activity className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">{t('head_circumference')}</p>
                  <p className="text-xl font-bold">{latestMeasurements.headCircumference || 'N/A'} {t('cm')}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">{t('no_measurements_recorded')}</p>
          )}
          
          {/* Timeline Button */}
          <div className="mt-6 flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => setShowTimeline(!showTimeline)}
              className="flex items-center"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {showTimeline ? t('hide_timeline') : t('show_timeline')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Update Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{t('add_new_measurement')}</CardTitle>
          </CardHeader>
          <CardContent>
            <AddMeasurementForm infantId={id} onMeasurementAdded={handleMeasurementAdded} />
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {showTimeline && chartDataPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('growth_timeline')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('age')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('height')} ({t('cm')})
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('weight')} ({t('kg')})
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('head_circumference')} ({t('cm')})
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chartDataPoints.map((point, index) => (
                    <tr key={index} className={point.isBirthData ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {point.isBirthData ? `${t('birth')} (${formatDate(point.date)})` : formatDate(point.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {point.ageInMonths !== undefined ? `${point.ageInMonths} ${t('months')}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {point.height || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {point.weight || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
            <CardTitle>{t('height_vs_time')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Line data={heightChartData} options={chartOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('weight_vs_time')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Line data={weightChartData} options={chartOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('head_circumference_vs_time')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Line data={headCircumferenceChartData} options={chartOptions} />
          </CardContent>
        </Card>
      </div>

      {chartDataPoints.length === 0 && !showForm && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-4">
            {t('no_growth_measurements_recorded')}
          </p>
          <Button onClick={() => setShowForm(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('add_first_measurement')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default GrowthTrackingPage;