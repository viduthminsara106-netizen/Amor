import React from 'react';
import { Language } from '../types';
import { Check } from 'lucide-react';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onSelect: (lang: Language) => void;
}

export default function LanguageSelector({ currentLanguage, onSelect }: LanguageSelectorProps) {
  const languages: { code: Language; name: string; native: string }[] = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'si', name: 'Sinhala', native: 'සිංහල' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  ];

  return (
    <div className="space-y-3 py-4">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onSelect(lang.code)}
          className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${
            currentLanguage === lang.code
              ? 'bg-yellow-50 border-yellow-200 shadow-sm'
              : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
          }`}
        >
          <div className="text-left">
            <p className="text-sm font-black text-gray-900">{lang.name}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase">{lang.native}</p>
          </div>
          {currentLanguage === lang.code && (
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white shadow-sm">
              <Check size={18} strokeWidth={3} />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
