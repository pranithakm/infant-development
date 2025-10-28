'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDateLogStore } from '@/store/dateLogStore';
import { Infant } from '@/types';
import { CalendarIcon, ActivityIcon } from 'lucide-react';
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
  const { dateLogs, selectedDateLog, fetchDateLogs, fetchDateActivities, clearSelectedDateLog } = useDateLogStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (infant._id) {
      fetchDateLogs(infant._id);
    }
  }, [infant._id, fetchDateLogs]);

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
    return dateLogs.some(log => log.date === dateStr);
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
      
      // Determine background color based on different conditions
      let bgColorClass = '';
      if (today) {
        bgColorClass = 'bg-blue-500 text-white';
      } else if (selected) {
        bgColorClass = 'bg-blue-100 text-blue-800';
      } else if (isCelebrationDay) {
        bgColorClass = 'bg-yellow-100 text-yellow-800';
      } else if (hasActivity) {
        bgColorClass = 'bg-green-100 text-green-800';
      } else {
        bgColorClass = 'hover:bg-gray-100';
      }
      
      days.push(
        <button
          key={`day-${day}`}
          className={`h-12 w-12 rounded-full flex flex-col items-center justify-center text-sm font-medium transition-colors
            ${bgColorClass}
            focus:outline-none focus:ring-2 focus:ring-blue-500`}
          onClick={() => handleDateClick(date)}
        >
          <span>{day}</span>
          {isCelebrationDay && (
            <span className="text-xs mt-[-2px]">🎉</span>
          )}
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              {t('calendar')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={prevMonth}>{'←'}</Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  {t('today')}
                </Button>
                <Button variant="outline" size="sm" onClick={nextMonth}>{'→'}</Button>
              </div>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-gray-500 w-12">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0">
              {renderCalendarDays()}
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">{t('has_activities')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">{t('today')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-100 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Celebration</span>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
      
      {/* Activities Panel */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ActivityIcon className="h-5 w-5 mr-2" />
              {t('activities')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateLog ? (
              <div>
                <h3 className="font-medium text-lg mb-4">
                  {formatDate(selectedDateLog.date)}
                </h3>
                
                {selectedDateLog.activities.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateLog.activities.map((activity, index) => (
                      <div 
                        key={index} 
                        className={`border rounded-lg p-3 ${
                          activity.type === 'special_occasion' 
                            ? 'border-yellow-200 bg-yellow-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{activity.description}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
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
                          <div className="mt-2 text-sm text-gray-600">
                            {activity.type === 'growth' && (
                              <div>
                                {activity.metadata.height && <div>{t('height')}: {activity.metadata.height} cm</div>}
                                {activity.metadata.weight && <div>{t('weight')}: {activity.metadata.weight} kg</div>}
                                {activity.metadata.headCircumference && <div>{t('head_circumference')}: {activity.metadata.headCircumference} cm</div>}
                              </div>
                            )}
                            {activity.type === 'milestone' && (
                              <div>
                                {t('status')}: {activity.metadata?.status}
                              </div>
                            )}
                            {activity.type === 'special_occasion' && activity.metadata?.occasion === 'celebration' && (
                              // Show detailed celebration info for all celebrations
                              <div className="text-yellow-700 font-medium">
                                🎉 Happy {activity.metadata?.ageInMonths === 0 ? 'Birthday' : activity.metadata?.ageInMonths + getOrdinalSuffix(activity.metadata?.ageInMonths) + ' Month'} Celebration! 🎉
                              </div>
                            )}

                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ActivityIcon className="h-12 w-12 mx-auto text-gray-300" />
                    <p className="mt-2">{t('no_activities')}</p>
                  </div>
                )}
                
                {selectedDateLog.anniversary && (
                  <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800">Anniversary</h4>
                    <p className="text-yellow-700">{selectedDateLog.anniversary.description}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto text-gray-300" />
                <p className="mt-2">{t('select_date')}</p>
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
