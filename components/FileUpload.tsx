import React, { useCallback } from 'react';
import { Upload, FileCode, X } from 'lucide-react';
import { FileRecord } from '../types';
import { Button } from './Button';
import { useLanguage } from '../contexts/LanguageContext';

interface FileUploadProps {
  files: FileRecord[];
  onFilesAdded: (newFiles: FileRecord[]) => void;
  onRemoveFile: (id: string) => void;
  onClear: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ files, onFilesAdded, onRemoveFile, onClear }) => {
  const { t } = useLanguage();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = Array.from(e.dataTransfer.files) as File[];
    processFiles(droppedFiles);
  }, [onFilesAdded]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files) as File[];
      processFiles(selectedFiles);
    }
  };

  const processFiles = async (rawFiles: File[]) => {
    const newRecords: FileRecord[] = [];
    
    for (const file of rawFiles) {
      if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
        continue; // Skip non-html
      }
      
      const text = await file.text();
      newRecords.push({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: file.size,
        content: text,
        status: 'pending' // Simple check could go here
      });
    }
    
    onFilesAdded(newRecords);
  };

  return (
    <div className="w-full space-y-4">
      {/* Drop Zone */}
      <div 
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={handleDrop}
        className="border-2 border-dashed border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center bg-slate-900/50 hover:bg-slate-800/50 transition-colors cursor-pointer group"
      >
        <div className="bg-slate-800 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
          <Upload className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-200 mb-2">{t('upload_title')}</h3>
        <p className="text-slate-400 text-center mb-6 max-w-sm">
          {t('upload_desc')}
          <br/><span className="text-xs text-slate-500">{t('upload_supported')}</span>
        </p>
        <label>
          <input type="file" multiple accept=".html,.htm" className="hidden" onChange={handleFileInput} />
          <span className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 cursor-pointer font-medium transition-colors">
            {t('btn_select_files')}
          </span>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-400">{files.length} {t('files_selected')}</span>
            <Button variant="ghost" size="sm" onClick={onClear} className="text-red-400 hover:text-red-300">
              {t('btn_clear_all')}
            </Button>
          </div>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            {files.map(file => (
              <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-900">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <FileCode className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button onClick={() => onRemoveFile(file.id)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};