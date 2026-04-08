'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInfantStore } from '@/store/infantStore';
import { useDateLogStore } from '@/store/dateLogStore';
import CalendarComponent from '@/components/Calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Baby } from 'lucide-react';
import Link from 'next/link';

export default function InfantCalendarPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { selectedInfant, loading, error, fetchInfant } = useInfantStore();
  const { clearSelectedDateLog } = useDateLogStore();

  useEffect(() => {
    fetchInfant(params.id);
    clearSelectedDateLog();
  }, [params.id, fetchInfant, clearSelectedDateLog]);

  if (loading && !selectedInfant) {
    return (
      <div className="flex-1 p-4 md:p-8">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-lg font-medium">Loading infant details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 md:p-8">
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full text-center">
            <div className="rounded-xl bg-red-50 p-6 border border-red-200 shadow-sm">
              <div className="flex justify-center">
                <div className="flex-shrink-0">
                  <svg className="h-12 w-12 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-red-800">Error</h3>
                <div className="mt-2 text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-6">
                  <Link href="/dashboard">
                    <Button variant="outline">Back to Dashboard</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedInfant) {
    return (
      <div className="flex-1 p-4 md:p-8">
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full text-center">
            <div className="rounded-xl bg-red-50 p-6 border border-red-200 shadow-sm">
              <div className="flex justify-center">
                <div className="flex-shrink-0">
                  <svg className="h-12 w-12 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-red-800">Infant not found</h3>
                <div className="mt-2 text-red-700">
                  <p>The infant you're looking for doesn't exist or has been removed.</p>
                </div>
                <div className="mt-6">
                  <Link href="/dashboard">
                    <Button variant="outline">Back to Dashboard</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href={`/dashboard/infants/${params.id}`}>
            <Button variant="outline" className="mb-4 flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Infant Details
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-full">
              <Baby className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Calendar for {selectedInfant.name}</h1>
              <p className="text-gray-600">Track activities and milestones</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-lg border border-indigo-100">
          <CalendarComponent infant={selectedInfant} />
        </div>
      </div>
    </div>
  );
}