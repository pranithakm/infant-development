'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInfantStore } from '@/store/infantStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Baby, Syringe, CheckCircle, Clock, Info, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function VaccinationsPage({ params }: { params: { id: string } }) {
  const { selectedInfant, loading, error, fetchInfant, updateVaccinationStatus } = useInfantStore();
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    fetchInfant(params.id);
  }, [params.id, fetchInfant]);

  if (loading && !selectedInfant) {
    return (
      <div className="flex-1 p-4 md:p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !selectedInfant) {
    return (
      <div className="flex-1 p-4 md:p-8 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-4">Error loading data</h2>
        <p className="text-gray-600 mb-6">{error || 'Infant not found'}</p>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  // Group vaccinations by category
  const groupedVaccinations = selectedInfant.vaccinations?.reduce((acc: any, v: any) => {
    const category = v.vaccinationId.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(v);
    return acc;
  }, {}) || {};

  const handleMarkDone = async (vaccinationId: string) => {
    await updateVaccinationStatus(params.id, vaccinationId, 'Done');
  };

  const calculateProgress = () => {
    if (!selectedInfant.vaccinations?.length) return 0;
    const doneCount = selectedInfant.vaccinations.filter(v => v.status === 'Done').length;
    return Math.round((doneCount / selectedInfant.vaccinations.length) * 100);
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto bg-gray-50/30 min-h-screen">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <Link href={`/dashboard/infants/${params.id}`}>
              <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-gray-500 hover:text-indigo-600 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('back_to')} {selectedInfant.name}'s Profile
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
                <Syringe className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Vaccination Journey</h1>
                <p className="text-gray-500 font-medium">Comprehensive immunization tracking for {selectedInfant.name}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6 min-w-[300px]">
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm font-bold text-gray-700">
                <span>Overall Progress</span>
                <span className="text-indigo-600">{calculateProgress()}%</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out rounded-full"
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
              <div className="flex gap-4 text-[11px] font-semibold uppercase tracking-wider">
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> {selectedInfant.vaccinations?.filter(v => v.status === 'Done').length || 0} Administered
                </span>
                <span className="text-blue-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {selectedInfant.vaccinations?.filter(v => v.status === 'Pending').length || 0} Remaining
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {Object.entries(groupedVaccinations).map(([category, vaccines]: [string, any], categoryIdx) => (
          <div key={category} className="space-y-6">
            <div className="sticky top-4 z-10 flex items-center gap-4 py-2 px-4 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm">
              <div className="bg-indigo-100 text-indigo-700 text-xs font-black px-4 py-1.5 rounded-xl uppercase tracking-widest">
                {category}
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
              <Badge variant="secondary" className="bg-gray-50 text-gray-500 text-[10px] font-bold border-none">
                {vaccines[0].vaccinationId.daysFromBirth} DAYS POST-BIRTH
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {vaccines.map((v: any) => (
                <Card 
                  key={v._id} 
                  className={`group relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${
                    v.status === 'Done' 
                      ? 'border-green-100 bg-gradient-to-br from-white to-green-50/30' 
                      : 'border-white bg-white'
                  }`}
                >
                  {v.status === 'Done' && (
                    <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-green-500/10 rounded-full blur-2xl"></div>
                  )}
                  
                  <CardHeader className="p-6 pb-2">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {v.vaccinationId.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-bold border-gray-200 text-gray-500 bg-gray-50 px-2 py-0">
                            {v.vaccinationId.dosage}
                          </Badge>
                          {v.status === 'Done' ? (
                            <span className="flex items-center gap-1 text-[10px] font-black text-green-600 uppercase tracking-tighter">
                              <CheckCircle className="h-3 w-3" /> Administered
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-black text-blue-500 uppercase tracking-tighter">
                              <Clock className="h-3 w-3" /> Scheduled
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`p-2.5 rounded-xl transition-colors ${v.status === 'Done' ? 'bg-green-100' : 'bg-indigo-50'}`}>
                        <Syringe className={`h-5 w-5 ${v.status === 'Done' ? 'text-green-600' : 'text-indigo-600'}`} />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-4 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                        <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Target Protection</p>
                          <p className="text-xs text-blue-900 font-medium leading-relaxed">{v.vaccinationId.protection}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-orange-50/50 border border-orange-100/50">
                        <AlertCircle className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Administration</p>
                          <p className="text-xs text-orange-900 font-medium">{v.vaccinationId.administration}</p>
                        </div>
                      </div>
                    </div>

                    {v.status === 'Pending' ? (
                      <div className="space-y-4">
                        {v.vaccinationId.sideEffects?.length > 0 && (
                          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              Potential Side Effects
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {v.vaccinationId.sideEffects.map((effect: string, i: number) => (
                                <span key={i} className="text-[10px] bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-lg font-medium">
                                  {effect}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <Button 
                          onClick={() => handleMarkDone(v.vaccinationId._id)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 h-11 rounded-xl font-bold transition-all active:scale-[0.98]"
                        >
                          Mark as Administered
                        </Button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-green-50/50 border border-green-100 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Administration Date</p>
                          <p className="text-sm text-green-900 font-bold">
                            {new Date(v.dateAdministered || '').toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="bg-green-100 p-2 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 p-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] shadow-2xl shadow-indigo-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
            <Info className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-black text-white tracking-tight uppercase">Medical Disclaimer</h3>
            <p className="text-indigo-50 text-sm leading-relaxed max-w-2xl font-medium">
              This schedule follows UNICEF India guidelines. Actual vaccination dates should always be confirmed with your 
              pediatrician. Every child's health requirements are unique, and professional medical advice should always take precedence 
              over this digital tracking tool.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
