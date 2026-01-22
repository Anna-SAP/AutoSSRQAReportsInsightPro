import React, { createContext, useContext, useState, useEffect } from 'react';

type Locale = 'en-US' | 'zh-CN';

interface LanguageContextType {
  language: Locale;
  setLanguage: (lang: Locale) => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Record<string, string>> = {
  'en-US': {
    // App
    'app_name': 'Auto SSR QA Report Insight Pro',
    'app_desc': 'Upload AI-generated LQA reports. We use advanced LLMs to filter noise, identify P0/P1 issues, and generate a professional fix list.',
    'powered_by': 'Powered by Google Gemini 3 Pro • Privacy Focused',
    'btn_generate': 'Generate Audit Report',
    'status_idle': 'AI Auditor is ready',
    'status_parsing': 'Reading report files...',
    'status_auditing': 'Gemini 3 Pro is analyzing critical issues (P0/P1)...',
    'status_formatting': 'Structuring final data...',
    'error_prefix': 'Error',
    
    // FileUpload
    'upload_title': 'Upload LQA Reports',
    'upload_desc': 'Drag and drop HTML files here, or click to select.',
    'upload_supported': 'Supported: .html, .htm from Auto SSR tools',
    'btn_select_files': 'Select Files',
    'files_selected': 'files selected',
    'btn_clear_all': 'Clear All',
    
    // Dashboard - Sidebar
    'nav_overview': 'Overview',
    'nav_fix_list': 'Fix List',
    'nav_needs_context': 'Needs Context',
    'nav_improvements': 'Improvements',
    'btn_export': 'Export XLSX',
    'btn_new_audit': 'New Audit',
    
    // Dashboard - Overview
    'card_critical': 'Critical (P0)',
    'card_high': 'High (P1)',
    'card_context': 'Needs Context',
    'card_files': 'Files Audited',
    'title_exec_summary': 'Executive Summary',
    'title_issues_category': 'Issues by Category',
    'title_top_risk': 'Top Risk Areas',
    'generated_on': 'Generated',
    
    // Dashboard - Fix List
    'title_action_required': 'Action Required',
    'col_priority': 'Priority',
    'col_lang': 'Lang',
    'col_category': 'Category',
    'col_summary': 'Summary',
    'col_proposed': 'Proposed Fix',
    'col_action': 'Action',
    'label_context': 'Issue Context',
    'label_file': 'File:',
    'label_source': 'Source:',
    'label_current': 'Current:',
    'label_recommendation': 'Recommendation',
    'label_verification': 'Verification Steps',
    
    // Dashboard - Context
    'label_missing_info': 'Missing Information',
    'label_risk': 'Risk If Wrong',
    'label_next_step': 'Next Step:',
    
    // Dashboard - Improvements
    'title_process_opt': 'Process Optimization',
    'label_benefit': 'Expected Benefit:',
    'label_example': 'Example:'
  },
  'zh-CN': {
    // App
    'app_name': 'Auto SSR QA 报告智能审计 Pro',
    'app_desc': '上传 AI 生成的 LQA 报告。我们要使用高级 LLM 过滤噪音，识别 P0/P1 问题，并生成专业的修复清单。',
    'powered_by': '由 Google Gemini 3 Pro 驱动 • 隐私保护',
    'btn_generate': '生成审计报告',
    'status_idle': 'AI 审计员准备就绪',
    'status_parsing': '正在读取报告文件...',
    'status_auditing': 'Gemini 3 Pro 正在分析关键问题 (P0/P1)...',
    'status_formatting': '正在构建最终数据...',
    'error_prefix': '错误',
    
    // FileUpload
    'upload_title': '上传 LQA 报告',
    'upload_desc': '将 HTML 文件拖放到此处，或点击选择。',
    'upload_supported': '支持格式：来自 Auto SSR 工具的 .html, .htm',
    'btn_select_files': '选择文件',
    'files_selected': '个文件已选',
    'btn_clear_all': '清空所有',
    
    // Dashboard - Sidebar
    'nav_overview': '概览',
    'nav_fix_list': '修复清单',
    'nav_needs_context': '待确认项',
    'nav_improvements': '改进建议',
    'btn_export': '导出 XLSX',
    'btn_new_audit': '新审计',
    
    // Dashboard - Overview
    'card_critical': '严重 (P0)',
    'card_high': '高优 (P1)',
    'card_context': '待确认',
    'card_files': '审计文件数',
    'title_exec_summary': '执行摘要',
    'title_issues_category': '问题分类',
    'title_top_risk': '高风险领域',
    'generated_on': '生成时间',
    
    // Dashboard - Fix List
    'title_action_required': '待修复项',
    'col_priority': '优先级',
    'col_lang': '语言',
    'col_category': '类别',
    'col_summary': '摘要',
    'col_proposed': '建议修复',
    'col_action': '操作',
    'label_context': '问题背景',
    'label_file': '文件:',
    'label_source': '原文:',
    'label_current': '当前译文:',
    'label_recommendation': '修改建议',
    'label_verification': '验证步骤',
    
    // Dashboard - Context
    'label_missing_info': '缺失信息',
    'label_risk': '潜在风险',
    'label_next_step': '下一步:',
    
    // Dashboard - Improvements
    'title_process_opt': '流程优化建议',
    'label_benefit': '预期收益:',
    'label_example': '示例:'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Locale>('en-US');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language') as Locale;
    if (savedLang && (savedLang === 'en-US' || savedLang === 'zh-CN')) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Locale) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
