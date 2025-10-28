'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Get available languages with their names
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'te', name: 'తెలుగు (Telugu)' }
  ];
  
  // Set the initial language from localStorage or browser language
  useEffect(() => {
    if (i18n && i18n.isInitialized) {
      const savedLanguage = localStorage.getItem('language') || 'en';
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);
  
  const changeLanguage = (languageCode: string) => {
    if (i18n && i18n.changeLanguage) {
      i18n.changeLanguage(languageCode);
      localStorage.setItem('language', languageCode);
    }
    setIsOpen(false);
  };
  
  // Handle case where i18n is not yet initialized
  if (!i18n) {
    return null;
  }
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.254-.269-.5-.556-.734-.862-.065-.084-.128-.167-.188-.253a1 1 0 01.254-1.409 16.9 16.9 0 001.536-1.263 18.74 18.74 0 01-2.328-3.942H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
        </svg>
        {languages.find(lang => lang.code === i18n.language)?.name || 'English'}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`block px-4 py-2 text-sm text-left w-full ${
                i18n.language === language.code
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {language.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}