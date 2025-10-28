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
  const { t } = useTranslation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      height: null,
      weight: null,
      headCircumference: null,
      notes: '',
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      
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
      toast.error(t('failed_to_add_measurement'));
      console.error('Error adding measurement:', error);
      // Log more detailed error information
      if (error.response) {
        console.error('Error response:', error.response);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">{t('date')} *</Label>
          <Input
            id="date"
            type="date"
            {...register('date', { required: t('date_required') })}
            className={errors.date ? 'border-red-500' : ''}
          />
          {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="height">{t('height')} (cm)</Label>
          <Input
            id="height"
            type="number"
            step="0.1"
            {...register('height', { 
              min: { value: 0, message: t('height_must_be_positive') },
              max: { value: 200, message: t('height_seems_too_high') }
            })}
            placeholder={t('e_g_70_5')}
          />
          {errors.height && <p className="text-red-500 text-sm">{errors.height.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="weight">{t('weight')} (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            {...register('weight', { 
              min: { value: 0, message: t('weight_must_be_positive') },
              max: { value: 50, message: t('weight_seems_too_high') }
            })}
            placeholder={t('e_g_9_2')}
          />
          {errors.weight && <p className="text-red-500 text-sm">{errors.weight.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="headCircumference">{t('head_circumference')} (cm)</Label>
          <Input
            id="headCircumference"
            type="number"
            step="0.1"
            {...register('headCircumference', { 
              min: { value: 0, message: t('head_circumference_must_be_positive') },
              max: { value: 100, message: t('head_circumference_seems_too_high') }
            })}
            placeholder={t('e_g_44_5')}
          />
          {errors.headCircumference && <p className="text-red-500 text-sm">{errors.headCircumference.message}</p>}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">{t('notes')}</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder={t('any_additional_notes')}
        />
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('adding') : t('add_measurement')}
        </Button>
      </div>
    </form>
  );
};

export default AddMeasurementForm;