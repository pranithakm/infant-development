'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useInfantStore } from '@/store/infantStore';
import { growthAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Calendar, Ruler, Weight, Activity, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FormData {
  date: string;
  height: number | null;
  weight: number | null;
  headCircumference: number | null;
  notes: string;
}

const AddMeasurementForm = ({ infantId, onMeasurementAdded }: { infantId: string; onMeasurementAdded: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { selectedInfant: infant } = useInfantStore();
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      height: null,
      weight: null,
      headCircumference: null,
      notes: '',
    }
  });

  // Watch form values to show validation hints
  const formData = watch();

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      setServerError(null);
      
      // Prepare data for API - use infantId as expected by backend
      const apiData: any = {
        infantId: infantId,
        date: data.date,
      };
      
      if (data.height !== null) apiData.height = data.height;
      if (data.weight !== null) apiData.weight = data.weight;
      if (data.headCircumference !== null) apiData.headCircumference = data.headCircumference;
      if (data.notes) apiData.notes = data.notes;
      
      await growthAPI.addGrowthMeasurement(apiData);
      toast.success(t('measurement_added'));
      reset();
      onMeasurementAdded();
    } catch (error: any) {
      console.error('Error adding measurement:', error);
      
      // Handle server validation errors
      if (error.response?.data?.message) {
        setServerError(error.response.data.message);
        toast.error(error.response.data.message);
      } else {
        setServerError(t('failed_to_add_measurement'));
        toast.error(t('failed_to_add_measurement'));
      }
      
      // Log more detailed error information
      if (error.response) {
        console.error('Error response:', error.response);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get the latest measurements for validation hints
  const getLatestMeasurements = () => {
    if (!infant || !infant.growthData || infant.growthData.length === 0) {
      return null;
    }
    
    // Sort by date descending to get the most recent
    const sorted = [...infant.growthData].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return sorted[0];
  };

  const latestMeasurement = getLatestMeasurements();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Server error message */}
      {serverError && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{t('error')}</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{serverError}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="date" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            {t('date')} *
          </Label>
          <Input
            id="date"
            type="date"
            {...register('date', { required: t('date_required') })}
            className={errors.date ? 'border-red-500' : ''}
          />
          {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="height" className="flex items-center">
            <Ruler className="mr-2 h-4 w-4" />
            {t('height')} (cm)
          </Label>
          <Input
            id="height"
            type="number"
            step="0.1"
            {...register('height', { 
              min: { value: 0, message: t('height_must_be_positive') },
              max: { value: 200, message: t('height_seems_too_high') },
              validate: (value) => {
                if (value !== null && value !== undefined && latestMeasurement?.height) {
                  if (value < latestMeasurement.height) {
                    return t('height_must_be_greater_than_last', { value: latestMeasurement.height });
                  }
                }
                return true;
              }
            })}
            placeholder={t('e_g_70_5')}
            className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          />
          {errors.height && <p className="text-red-500 text-sm">{errors.height.message}</p>}
          {latestMeasurement?.height && formData.height !== null && (
            <p className="text-xs text-gray-500 mt-1">
              {t('last_recorded_value')}: {latestMeasurement.height} cm
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="weight" className="flex items-center">
            <Weight className="mr-2 h-4 w-4" />
            {t('weight')} (kg)
          </Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            {...register('weight', { 
              min: { value: 0, message: t('weight_must_be_positive') },
              max: { value: 50, message: t('weight_seems_too_high') }
            })}
            placeholder={t('e_g_9_2')}
            className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          />
          {errors.weight && <p className="text-red-500 text-sm">{errors.weight.message}</p>}
          {latestMeasurement?.weight && formData.weight !== null && (
            <p className="text-xs text-gray-500 mt-1">
              {t('last_recorded_value')}: {latestMeasurement.weight} kg
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="headCircumference" className="flex items-center">
            <Activity className="mr-2 h-4 w-4" />
            {t('head_circumference')} (cm)
          </Label>
          <Input
            id="headCircumference"
            type="number"
            step="0.1"
            {...register('headCircumference', { 
              min: { value: 0, message: t('head_circumference_must_be_positive') },
              max: { value: 100, message: t('head_circumference_seems_too_high') },
              validate: (value) => {
                if (value !== null && value !== undefined && latestMeasurement?.headCircumference) {
                  if (value < latestMeasurement.headCircumference) {
                    return t('head_circumference_must_be_greater_than_last', { value: latestMeasurement.headCircumference });
                  }
                }
                return true;
              }
            })}
            placeholder={t('e_g_44_5')}
            className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          />
          {errors.headCircumference && <p className="text-red-500 text-sm">{errors.headCircumference.message}</p>}
          {latestMeasurement?.headCircumference && formData.headCircumference !== null && (
            <p className="text-xs text-gray-500 mt-1">
              {t('last_recorded_value')}: {latestMeasurement.headCircumference} cm
            </p>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">{t('notes')}</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder={t('any_additional_notes')}
          className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      
      {/* Validation info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">{t('validation_info')}</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>{t('height_and_head_circumference_validation')}</li>
                <li>{t('weight_can_decrease')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading} className="px-6 py-2">
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('adding')}
            </div>
          ) : (
            t('add_measurement')
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddMeasurementForm;