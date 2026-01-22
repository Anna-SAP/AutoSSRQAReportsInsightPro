import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center bg-slate-800/50 rounded-full p-1 border border-slate-700">
      <div className="flex items-center px-2 text-slate-400">
        <Globe className="w-4 h-4" />
      </div>
      <div className="flex space-x-1">
        <button
          onClick={() => setLanguage('en-US')}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
            language === 'en-US'
              ? 'bg-slate-200 text-slate-900 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('zh-CN')}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
            language === 'zh-CN'
              ? 'bg-slate-200 text-slate-900 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          中文
        </button>
      </div>
    </div>
  );
};
