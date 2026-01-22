import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { Button } from './components/Button';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { FileRecord, AuditReport, AnalysisStatus } from './types';
import { auditReports } from './services/geminiService';
import { useLanguage } from './contexts/LanguageContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { APP_NAME } from './constants';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { language, t } = useLanguage();

  const handleFilesAdded = (newFiles: FileRecord[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearFiles = () => {
    setFiles([]);
    setError(null);
  };

  const runAudit = async () => {
    if (files.length === 0) return;
    
    setStatus('parsing');
    setError(null);

    // Prepare content
    const fileContents = files.map(f => ({ name: f.name, content: f.content }));

    try {
      setStatus('auditing');
      const result = await auditReports(fileContents, language);
      setReport(result);
      setStatus('complete');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      
      let errorMessage = err.message || "An unexpected error occurred during the AI audit.";
      // Try to parse if it looks like JSON (Gemini often returns errors as JSON strings)
      try {
        if (errorMessage.trim().startsWith('{')) {
             const errorObj = JSON.parse(errorMessage);
             if (errorObj.error && errorObj.error.message) {
                 errorMessage = `${errorObj.error.status || 'Error'} (${errorObj.error.code || 'Unknown'}): ${errorObj.error.message}`;
             }
        }
      } catch (e) {
        // ignore parse error and use original string
      }
      
      setError(errorMessage);
    }
  };

  if (report) {
    return <Dashboard report={report} onReset={() => {
        setReport(null);
        setStatus('idle');
        setFiles([]);
    }} />;
  }

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col items-center justify-center p-4 relative">
      {/* Top Navigation / Language Switcher */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-10">
        <LanguageSwitcher />
      </div>

      <div className="max-w-3xl w-full space-y-8 animate-in slide-in-from-bottom-5 duration-500">
        
        {/* Header */}
        <div className="text-center space-y-4 pt-10 md:pt-0">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            {t('app_name')}
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            {t('app_desc')}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl shadow-blue-900/10">
          
          {status === 'error' && (
             <div className="mb-6 bg-red-950/30 border border-red-900/50 p-4 rounded-lg flex items-center gap-3 text-red-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p><span className="font-bold">{t('error_prefix')}:</span> {error}</p>
             </div>
          )}

          {status === 'idle' || status === 'error' ? (
            <>
              <FileUpload 
                files={files} 
                onFilesAdded={handleFilesAdded} 
                onRemoveFile={handleRemoveFile} 
                onClear={handleClearFiles}
              />
              
              <div className="mt-8 flex justify-end">
                <Button 
                    size="lg" 
                    onClick={runAudit} 
                    disabled={files.length === 0}
                    className="w-full md:w-auto font-bold"
                >
                   {t('btn_generate')}
                </Button>
              </div>
            </>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-pulse" />
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">{t('status_idle')}...</h3>
                    <p className="text-slate-400">
                        {status === 'parsing' && t('status_parsing')}
                        {status === 'auditing' && t('status_auditing')}
                        {status === 'formatting' && t('status_formatting')}
                    </p>
                </div>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-slate-600">
            {t('powered_by')}
        </div>
      </div>
    </div>
  );
};

export default App;
