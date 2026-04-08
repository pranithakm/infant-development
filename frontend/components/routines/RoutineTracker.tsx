'use client';

import { useState, useEffect, useRef } from 'react';
import { useInfantStore } from '@/store/infantStore';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RoutineTrackerProps {
  infantId: string;
}

export default function RoutineTracker({ infantId }: RoutineTrackerProps) {
  const { selectedInfant, loading, error, fetchInfant } = useInfantStore();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (infantId) {
      fetchInfant(infantId);
    }
  }, [infantId, fetchInfant]);

  // Generate dates: 3 before today, today, and 3 after today
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    // Generate 7 dates: 3 before, today, 3 after
    for (let i = -3; i <= 3; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const dates = generateDates();

  // Format date as YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is in the past
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    // Only allow selection of today and past dates
    if (isToday(date) || isPastDate(date)) {
      setSelectedDate(date);
    }
  };

  // Scroll to selected date
  useEffect(() => {
    if (scrollContainerRef.current) {
      const selectedIndex = dates.findIndex(date => 
        date.toDateString() === selectedDate.toDateString()
      );
      
      if (selectedIndex !== -1) {
        const scrollContainer = scrollContainerRef.current;
        const selectedElement = scrollContainer.children[selectedIndex] as HTMLElement;
        
        if (selectedElement) {
          const containerWidth = scrollContainer.offsetWidth;
          const elementWidth = selectedElement.offsetWidth;
          const scrollLeft = selectedElement.offsetLeft - (containerWidth / 2) + (elementWidth / 2);
          
          scrollContainer.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [selectedDate, dates]);

  // Scroll the container left or right
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current: container } = scrollContainerRef;
      const scrollAmount = container.offsetWidth * 0.8;
      
      container.scrollTo({
        left: container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount),
        behavior: 'smooth'
      });
    }
  };

  if (loading && !selectedInfant) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!selectedInfant) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">{t('no_infant_selected')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Summary Card */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{t('daily_routines')}</h2>
            <p className="text-blue-100 mt-1">{t('track_your_daily_routine_progress')}</p>
          </div>
        </div>
      </div>

      {/* Horizontal Date Selector */}
      <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
        <div className="relative">
          {/* Left Scroll Button */}
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-2 hover:bg-gray-50 transition-all duration-300 border border-gray-200"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>

          {/* Date Container */}
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto hide-scrollbar py-4 px-8 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {dates.map((date, index) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const isCurrentDay = isToday(date);
              const isEditable = isCurrentDay || isPastDate(date);
              const distance = Math.abs(index - 3); // Distance from center (today)
              
              // Calculate scale and opacity based on distance from center
              const scale = isSelected ? 1.2 : Math.max(0.8, 1 - distance * 0.1);
              const opacity = Math.max(0.5, 1 - distance * 0.15);
              
              return (
                <div 
                  key={date.toString()}
                  onClick={() => handleDateSelect(date)}
                  className={`
                    flex flex-col items-center justify-center mx-2 transition-all duration-500 ease-out cursor-pointer flex-shrink-0
                    ${isSelected 
                      ? 'bg-pink-100 ring-2 ring-pink-300 shadow-lg z-10' 
                      : isEditable 
                        ? 'hover:bg-gray-50' 
                        : 'opacity-50 cursor-not-allowed'
                    }
                    ${isCurrentDay && !isSelected ? 'bg-blue-50 border border-blue-200' : ''}
                  `}
                  style={{
                    transform: `scale(${scale})`,
                    opacity: isEditable ? opacity : 0.4,
                    width: '70px',
                    height: '90px',
                    borderRadius: '16px'
                  }}
                >
                  <div className="text-center">
                    <div className={`text-xs font-medium ${
                      isSelected 
                        ? 'text-pink-700' 
                        : isCurrentDay 
                          ? 'text-blue-600' 
                          : 'text-gray-500'
                    }`}>
                      {date.toLocaleDateString(undefined, { weekday: 'short' })}
                    </div>
                    <div className={`
                      text-2xl font-bold mt-1
                      ${isSelected 
                        ? 'text-pink-800' 
                        : isCurrentDay 
                          ? 'text-blue-700' 
                          : 'text-gray-800'
                      }
                    `}>
                      {date.getDate()}
                    </div>
                    <div className={`text-xs mt-1 ${
                      isSelected 
                        ? 'text-pink-600' 
                        : isCurrentDay 
                          ? 'text-blue-500' 
                          : 'text-gray-400'
                    }`}>
                      {date.toLocaleDateString(undefined, { month: 'short' })}
                    </div>
                  </div>
                  
                  {/* Today indicator */}
                  {isCurrentDay && !isSelected && (
                    <div className="absolute -bottom-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                  
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute -bottom-1 w-3 h-3 bg-pink-500 rounded-full"></div>
                  )}
                  
                  {/* Lock icon for future dates */}
                  {!isEditable && !isCurrentDay && (
                    <div className="absolute top-2 right-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Scroll Button */}
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-2 hover:bg-gray-50 transition-all duration-300 border border-gray-200"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        
        {/* Selected Date Info */}
        <div className="text-center mt-6">
          <h3 className="text-lg font-semibold text-gray-800">
            {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            {isToday(selectedDate) ? t('today') : isPastDate(selectedDate) ? t('past_date') : t('future_date')}
          </p>
        </div>
      </div>
      
      {/* Hide scrollbar styles */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}