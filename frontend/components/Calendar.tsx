'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useDateLogStore } from '@/store/dateLogStore';
import { useInfantStore } from '@/store/infantStore';
import { Infant, DateLogActivity } from '@/types';
import { CalendarIcon, ActivityIcon, ChevronLeft, ChevronRight, Star, Syringe, Info, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CalendarProps {
  infant: Infant;
}

// Helper function to format dates as YYYY-MM-DD without timezone conversion
const formatDateToLocalString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to create a date object from YYYY-MM-DD string
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function Calendar({ infant }: CalendarProps) {
  const { selectedInfant, fetchVaccinations, updateVaccinationStatus } = useInfantStore();
  const { dateLogs, selectedDateLog, fetchDateLogs, fetchDateActivities, clearSelectedDateLog } = useDateLogStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'activities' | 'schedule'>('activities');
  const { t } = useTranslation();

  useEffect(() => {
    if (infant._id) {
      fetchDateLogs(infant._id);
      fetchVaccinations(infant._id);
    }
  }, [infant._id, fetchDateLogs, fetchVaccinations]);

  // Get the days in the current month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get the first day of the month
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Check if a date has activities
  const hasActivities = (date: Date) => {
    const dateStr = formatDateToLocalString(date);
    const hasDbActivity = dateLogs.some(log => log.date === dateStr);
    const hasVaccination = getVaccinationsForDate(date).length > 0;
    return hasDbActivity || hasVaccination;
  };

  // Get vaccinations for a specific date (both due and administered)
  const getVaccinationsForDate = (date: Date) => {
    if (!selectedInfant?.vaccinations) return [];
    
    const birthDate = new Date(selectedInfant.dateOfBirth);
    birthDate.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const checkDateStr = checkDate.toDateString();
    
    // Calculate days from birth
    const diffTime = checkDate.getTime() - birthDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    return selectedInfant.vaccinations.filter((v: any) => {
      // Show if it's the due date
      const isDueDate = v.vaccinationId.daysFromBirth === diffDays;
      
      // Show if it was actually administered on this date
      const isAdminDate = v.status === 'Done' && v.dateAdministered && 
                         new Date(v.dateAdministered).toDateString() === checkDateStr;
      
      return isDueDate || isAdminDate;
    });
  };

  // Check if a date is a celebration
  const isCelebration = (date: Date) => {
    const birthDate = new Date(infant.dateOfBirth);
    const today = new Date(date);
    
    // Check if this is the birth date
    if (date.getDate() === birthDate.getDate() &&
        date.getMonth() === birthDate.getMonth() &&
        date.getFullYear() === birthDate.getFullYear()) {
      return true;
    }
    
    // Calculate months difference
    let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
    months -= birthDate.getMonth();
    months += today.getMonth();
    
    // Adjust for day in month
    if (today.getDate() < birthDate.getDate()) {
      months--;
    }
    
    // Check if this is a celebration date (1-12 months, then every 6 months)
    if (months > 0 && months <= 12) {
      // Monthly celebrations for first year
      const celebrationDate = new Date(birthDate);
      celebrationDate.setMonth(birthDate.getMonth() + months);
      return (
        date.getDate() === celebrationDate.getDate() &&
        date.getMonth() === celebrationDate.getMonth() &&
        date.getFullYear() === celebrationDate.getFullYear()
      );
    } else if (months > 12 && months <= 36) {
      // Every 6 months after first year
      if (months % 6 === 0) {
        const celebrationDate = new Date(birthDate);
        celebrationDate.setMonth(birthDate.getMonth() + months);
        return (
          date.getDate() === celebrationDate.getDate() &&
          date.getMonth() === celebrationDate.getMonth() &&
          date.getFullYear() === celebrationDate.getFullYear()
        );
      }
    }
    
    return false;
  };

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if a date is selected
  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
    // Format date correctly to avoid timezone issues
    const formattedDate = formatDateToLocalString(date);
    fetchDateActivities(infant._id, formattedDate);
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Navigate to today
  const goToToday = () => {
    const today = new Date();
    const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    setCurrentDate(todayWithoutTime);
    setSelectedDate(todayWithoutTime);
    const formattedDate = formatDateToLocalString(todayWithoutTime);
    fetchDateActivities(infant._id, formattedDate);
  };

  // Render calendar days
  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 w-12"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const hasActivity = hasActivities(date);
      const isCelebrationDay = isCelebration(date);
      const today = isToday(date);
      const selected = isSelected(date);
      const vaccinations = getVaccinationsForDate(date);
      const hasVaccination = vaccinations.length > 0;
      const allDone = hasVaccination && vaccinations.every((v: any) => v.status === 'Done');
      
      // Determine background color based on different conditions
      let bgColorClass = '';
      let textColorClass = '';
      let borderClass = '';
      let hoverClass = '';
      
      if (today) {
        bgColorClass = 'bg-indigo-600';
        textColorClass = 'text-white';
        borderClass = 'border-2 border-indigo-700';
      } else if (selected) {
        bgColorClass = 'bg-indigo-100';
        textColorClass = 'text-indigo-800';
        borderClass = 'border-2 border-indigo-500';
      } else if (hasVaccination) {
        bgColorClass = allDone ? 'bg-green-100' : 'bg-blue-100';
        textColorClass = allDone ? 'text-green-800' : 'text-blue-800';
        borderClass = allDone ? 'border border-green-300' : 'border border-blue-300';
      } else if (isCelebrationDay) {
        bgColorClass = 'bg-yellow-100';
        textColorClass = 'text-yellow-800';
        borderClass = 'border border-yellow-300';
      } else if (hasActivity) {
        bgColorClass = 'bg-green-100';
        textColorClass = 'text-green-800';
        borderClass = 'border border-green-300';
      } else {
        bgColorClass = 'bg-white';
        textColorClass = 'text-gray-700';
        borderClass = 'border border-gray-200';
        hoverClass = 'hover:bg-gray-50';
      }
      
      days.push(
        <button
          key={`day-${day}`}
          className={`h-12 w-12 rounded-full flex flex-col items-center justify-center text-sm font-medium transition-all duration-200
            ${bgColorClass} ${textColorClass} ${borderClass} ${hoverClass}
            focus:outline-none focus:ring-2 focus:ring-indigo-500 transform hover:scale-105 active:scale-95 shadow-sm relative`}
          onClick={() => handleDateClick(date)}
        >
          <span>{day}</span>
          <div className="flex gap-0.5 absolute bottom-1">
            {isCelebrationDay && (
              <Star className="h-2 w-2 text-yellow-600 fill-current" />
            )}
            {hasVaccination && (
               <Syringe className={`h-2 w-2 ${allDone ? 'text-green-600' : 'text-blue-600'}`} />
             )}
          </div>
        </button>
      );
    }
    
    return days;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      // Parse the date string as a local date to avoid timezone conversion
      const date = parseLocalDate(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-xl">
            <CardTitle className="flex items-center text-xl">
              <CalendarIcon className="h-5 w-5 mr-2 text-indigo-600" />
              {t('calendar')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Calendar Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
              <h2 className="text-xl font-bold text-gray-800">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={prevMonth}
                  className="p-2 rounded-full"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToToday}
                  className="px-4 py-2 rounded-lg"
                >
                  {t('today')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={nextMonth}
                  className="p-2 rounded-full"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="h-10 flex items-center justify-center text-sm font-semibold text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays()}
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-indigo-600 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">{t('today')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-indigo-100 rounded-full border-2 border-indigo-500 mr-2"></div>
                <span className="text-sm text-gray-600">{t('selected')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 rounded-full border border-green-300 mr-2"></div>
                <span className="text-sm text-gray-600">{t('has_activities')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-100 rounded-full border border-yellow-300 mr-2"></div>
                <span className="text-sm text-gray-600">Celebration</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-100 rounded-full border border-blue-300 mr-2"></div>
                <span className="text-sm text-gray-600">Vaccination</span>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
      
      {/* Activities Panel */}
      <div>
        <Card className="shadow-lg h-full">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-xl">
            <CardTitle className="flex items-center text-xl justify-between">
              <div className="flex items-center">
                <ActivityIcon className="h-5 w-5 mr-2 text-indigo-600" />
                {t('activities')}
              </div>
              <div className="flex bg-indigo-100 p-1 rounded-lg">
                <button 
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'activities' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-600 hover:text-indigo-800'}`}
                  onClick={() => setActiveTab('activities')}
                >
                  Daily
                </button>
                <button 
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'schedule' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-600 hover:text-indigo-800'}`}
                  onClick={() => setActiveTab('schedule')}
                >
                  Schedule
                </button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {activeTab === 'schedule' ? (
              <div className="flex flex-col h-full">
                <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-blue-600" />
                  Full Vaccination Schedule
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin" style={{ maxHeight: '450px' }}>
                  {selectedInfant?.vaccinations && selectedInfant.vaccinations.length > 0 ? (
                    Object.entries(
                      selectedInfant.vaccinations.reduce((acc: any, v: any) => {
                        const cat = v.vaccinationId.category;
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(v);
                        return acc;
                      }, {})
                    ).map(([category, vaccines]: [string, any]) => (
                      <div key={category} className="space-y-3">
                        <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 p-2 rounded flex justify-between items-center">
                          <span>{category}</span>
                          <span className="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                            {vaccines[0].vaccinationId.daysFromBirth} days
                          </span>
                        </h4>
                        <div className="grid gap-3">
                          {vaccines.map((v: any, idx: number) => (
                            <div key={idx} className={`p-3 rounded-lg border text-sm transition-all ${v.status === 'Done' ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}>
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-gray-800">{v.vaccinationId.name}</span>
                                {v.status === 'Done' ? (
                                  <span className="text-green-600 flex items-center gap-1 text-[10px] font-bold">
                                    <Star className="h-3 w-3 fill-current" /> DONE
                                  </span>
                                ) : (
                                  <span className="text-blue-600 text-[10px] font-bold">PENDING</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-1">{v.vaccinationId.protection}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>No vaccination data available</p>
                    </div>
                  )}
                </div>
              </div>
            ) : selectedDate ? (
              <div className="flex flex-col h-full">
                <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">
                  {formatDate(formatDateToLocalString(selectedDate))}
                </h3>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin" style={{ maxHeight: '450px' }}>
                  {/* Vaccinations */}
                  {selectedInfant && getVaccinationsForDate(selectedDate).length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-blue-600 flex items-center gap-2 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/30">
                        <Syringe className="h-4 w-4" />
                        Vaccinations
                      </h4>
                      {getVaccinationsForDate(selectedDate).map((v: any, index: number) => {
                        const isDueDate = v.vaccinationId.daysFromBirth === Math.round((selectedDate.getTime() - new Date(selectedInfant!.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24));
                        const isAdminDate = v.status === 'Done' && v.dateAdministered && new Date(v.dateAdministered).toDateString() === selectedDate.toDateString();
                        
                        return (
                          <div key={`vaccine-${index}`} className={`relative border rounded-[1.5rem] p-5 shadow-sm transition-all duration-300 hover:shadow-md ${
                            v.status === 'Done' ? 'border-green-100 bg-green-50/20' : 'border-blue-100 bg-blue-50/20'
                          }`}>
                            <div className="flex justify-between items-start mb-3">
                              <div className="space-y-1">
                                <span className={`text-sm font-black leading-tight ${v.status === 'Done' ? 'text-green-900' : 'text-blue-900'}`}>
                                  {v.vaccinationId.name}
                                </span>
                                <div className="flex gap-2">
                                  {isDueDate && (
                                    <Badge variant="outline" className="text-[9px] font-black border-blue-200 text-blue-600 bg-white px-2 py-0">
                                      SCHEDULED DATE
                                    </Badge>
                                  )}
                                  {isAdminDate && (
                                    <Badge variant="outline" className="text-[9px] font-black border-green-200 text-green-600 bg-white px-2 py-0">
                                      ADMINISTERED ON THIS DAY
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                                v.status === 'Done' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {v.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3 mb-4">
                              <div className="flex items-start gap-2">
                                <Info className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                                  <span className="font-bold text-gray-800">Protection:</span> {v.vaccinationId.protection}
                                </p>
                              </div>
                              {v.status === 'Done' && v.dateAdministered && (
                                <div className="flex items-center gap-2 p-2.5 bg-white/60 rounded-xl border border-green-100/50">
                                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                  <p className="text-xs text-green-800 font-bold">
                                    Administered: {new Date(v.dateAdministered).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {v.status === 'Pending' && (
                              <Button 
                                size="sm" 
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 h-10 rounded-xl font-bold transition-all active:scale-[0.98]"
                                onClick={() => updateVaccinationStatus(infant._id, v.vaccinationId._id, 'Done')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Done
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Other Activities */}
                  {selectedDateLog && selectedDateLog.activities.length > 0 ? (
                    <div className="space-y-4">
                      {getVaccinationsForDate(selectedDate).length > 0 && (
                        <h4 className="text-sm font-semibold text-gray-600 pt-2">Other Activities</h4>
                      )}
                      {selectedDateLog.activities.map((activity: DateLogActivity, index: number) => (
                         <div 
                           key={index} 
                          className={`border rounded-xl p-4 transition-all duration-200 hover:shadow-md ${
                            activity.type === 'special_occasion' 
                              ? 'border-yellow-300 bg-yellow-50 shadow-sm' 
                              : 'border-gray-200 bg-white shadow-sm'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-gray-800">{activity.description}</span>
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                              activity.type === 'milestone' 
                                ? 'bg-blue-100 text-blue-800'
                                : activity.type === 'growth'
                                ? 'bg-green-100 text-green-800'
                                : activity.type === 'special_occasion'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.type === 'special_occasion' 
                                ? 'Celebration' 
                                : activity.type}
                            </span>
                          </div>

                          {activity.metadata && (
                            <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                              {activity.type === 'growth' && (
                                <div className="space-y-1">
                                  {activity.metadata.height && <div className="flex justify-between"><span className="font-medium">Height:</span> <span>{activity.metadata.height} cm</span></div>}
                                  {activity.metadata.weight && <div className="flex justify-between"><span className="font-medium">Weight:</span> <span>{activity.metadata.weight} kg</span></div>}
                                  {activity.metadata.headCircumference && <div className="flex justify-between"><span className="font-medium">Head Circumference:</span> <span>{activity.metadata.headCircumference} cm</span></div>}
                                </div>
                              )}
                              {activity.type === 'milestone' && (
                                <div className="flex justify-between">
                                  <span className="font-medium">Status:</span> 
                                  <span className={`font-medium ${
                                    activity.metadata?.status === 'completed' 
                                      ? 'text-green-600' 
                                      : activity.metadata?.status === 'delayed' 
                                        ? 'text-red-600' 
                                        : 'text-yellow-600'
                                  }`}>
                                    {activity.metadata?.status}
                                  </span>
                                </div>
                              )}
                              {activity.type === 'special_occasion' && activity.metadata?.occasion === 'celebration' && (
                                <div className="text-center text-yellow-700 font-bold py-2">
                                  🎉 Happy {activity.metadata?.ageInMonths === 0 ? 'Birthday' : activity.metadata?.ageInMonths + getOrdinalSuffix(activity.metadata?.ageInMonths) + ' Month'} Celebration! 🎉
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    !getVaccinationsForDate(selectedDate).length && (
                      <div className="text-center py-12 text-gray-500">
                        <ActivityIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-lg font-medium">{t('no_activities')}</p>
                        <p className="text-sm mt-1">No activities recorded for this date</p>
                      </div>
                    )
                  )}
                  
                  {selectedDateLog?.anniversary && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
                      <h4 className="font-bold text-yellow-800 flex items-center">
                        <Star className="h-5 w-5 mr-2 text-yellow-600 fill-current" />
                        Anniversary
                      </h4>
                      <p className="text-yellow-700 mt-2">{selectedDateLog.anniversary.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CalendarIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-lg font-medium">{t('select_date')}</p>
                <p className="text-sm mt-1">Click on a date to view activities</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(number: number) {
  if (number > 3 && number < 21) return 'th';
  switch (number % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}