import React, { useState } from 'react';
import { AuditReport, FixItem, IssuePriority } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { useLanguage } from '../contexts/LanguageContext';
import { AlertTriangle, CheckCircle, HelpCircle, Download, ChevronDown, ChevronRight, FileText, BarChart3, ListChecks, Lightbulb, ExternalLink, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  report: AuditReport;
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ report, onReset }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'fixes' | 'context' | 'improvements'>('overview');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const { t } = useLanguage();

  // Stats for charts
  const categoryData = Object.entries(
    report.fix_list.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const exportXLSX = () => {
    const wb = XLSX.utils.book_new();
    
    // Fix List Sheet
    const fixListRows = report.fix_list.map(item => ({
      [t('col_priority')]: item.priority,
      [t('col_lang')]: item.language,
      [t('col_category')]: item.category,
      [t('col_summary')]: item.summary,
      [t('label_file')]: item.evidence.file_name,
      'Location': item.evidence.location || '',
      [t('label_source')]: item.evidence.source_text || '',
      'Target Text': item.evidence.target_text || '',
      [t('col_proposed')]: item.proposed_fix,
      [t('label_verification')]: item.verification_steps.join('; '),
      'Confidence': item.confidence,
      'Occurrences': item.dedup?.occurrences || 1
    }));
    const fixSheet = XLSX.utils.json_to_sheet(fixListRows);
    XLSX.utils.book_append_sheet(wb, fixSheet, "Fix List");

    // Needs Context Sheet
    const contextRows = report.needs_context.map(item => ({
      [t('col_lang')]: item.language,
      [t('col_category')]: item.category,
      [t('col_summary')]: item.summary,
      [t('label_missing_info')]: item.what_is_missing.join(', '),
      [t('label_risk')]: item.risk_if_wrong,
      [t('label_next_step')]: item.suggested_next_step
    }));
    const contextSheet = XLSX.utils.json_to_sheet(contextRows);
    XLSX.utils.book_append_sheet(wb, contextSheet, "Needs Context");

    XLSX.writeFile(wb, `LQA_Audit_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'P0': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'P1': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">{t('card_critical')}</p>
                <h3 className="text-3xl font-bold text-white mt-1">{report.quality_overview.p0_count}</h3>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">{t('card_high')}</p>
                <h3 className="text-3xl font-bold text-white mt-1">{report.quality_overview.p1_count}</h3>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">{t('card_context')}</p>
                <h3 className="text-3xl font-bold text-white mt-1">{report.quality_overview.needs_context_count}</h3>
              </div>
              <HelpCircle className="w-8 h-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-slate-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">{t('card_files')}</p>
                <h3 className="text-3xl font-bold text-white mt-1">{report.meta.report_files.length}</h3>
              </div>
              <FileText className="w-8 h-8 text-slate-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Executive Summary */}
        <div className="lg:col-span-2 space-y-6">
           <Card className="h-full">
            <CardHeader>
                <CardTitle>{t('title_exec_summary')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="prose prose-invert max-w-none text-slate-300">
                    <p className="whitespace-pre-wrap leading-relaxed">
                        {report.quality_overview.overall_assessment}
                    </p>
                </div>
            </CardContent>
           </Card>
        </div>

        {/* Charts & Risk */}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t('title_issues_category')}</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData}>
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                cursor={{fill: '#1e293b', opacity: 0.4}}
                            />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#6366f1'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('title_top_risk')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {report.quality_overview.top_risk_areas.map((area, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-red-200 bg-red-950/20 px-3 py-2 rounded-md border border-red-900/30">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium">{area}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );

  const renderFixList = () => (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">{t('title_action_required')} ({report.fix_list.length})</h3>
      </div>
      
      <div className="rounded-xl border border-border overflow-hidden bg-surface/50">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-border text-slate-400">
                <tr>
                    <th className="p-4 font-medium w-20">{t('col_priority')}</th>
                    <th className="p-4 font-medium w-20">{t('col_lang')}</th>
                    <th className="p-4 font-medium w-32">{t('col_category')}</th>
                    <th className="p-4 font-medium">{t('col_summary')}</th>
                    <th className="p-4 font-medium w-1/3">{t('col_proposed')}</th>
                    <th className="p-4 font-medium w-10">{t('col_action')}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {report.fix_list.map((item, idx) => {
                    const rowId = `fix-${idx}`;
                    const isExpanded = expandedRow === rowId;
                    
                    return (
                        <React.Fragment key={idx}>
                            <tr 
                                className={`group hover:bg-slate-800/50 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-800/50' : ''}`}
                                onClick={() => setExpandedRow(isExpanded ? null : rowId)}
                            >
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                                        {item.priority}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-300">{item.language}</td>
                                <td className="p-4 text-slate-300">{item.category}</td>
                                <td className="p-4 font-medium text-slate-100">{item.summary}</td>
                                <td className="p-4 text-green-300 font-mono text-xs bg-green-950/10 rounded">
                                    {item.proposed_fix}
                                </td>
                                <td className="p-4">
                                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </td>
                            </tr>
                            {isExpanded && (
                                <tr className="bg-slate-900/30">
                                    <td colSpan={6} className="p-0">
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-border shadow-inner">
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t('label_context')}</h4>
                                                    <div className="bg-slate-950 rounded-lg p-3 border border-border space-y-2 text-sm">
                                                        <div className="flex gap-2">
                                                            <span className="text-slate-500 w-16 flex-shrink-0">{t('label_file')}</span>
                                                            <span className="text-slate-300 break-all">{item.evidence.file_name}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <span className="text-slate-500 w-16 flex-shrink-0">{t('label_source')}</span>
                                                            <span className="text-slate-300 italic">{item.evidence.source_text || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <span className="text-slate-500 w-16 flex-shrink-0">{t('label_current')}</span>
                                                            <span className="text-red-300 line-through">{item.evidence.target_text || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                     <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Why It Matters</h4>
                                                     <p className="text-sm text-slate-300">{item.why_it_matters}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t('label_recommendation')}</h4>
                                                    <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-3">
                                                        <p className="text-green-300 font-mono text-sm">{item.proposed_fix}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                     <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t('label_verification')}</h4>
                                                     <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                                                        {item.verification_steps.map((step, i) => (
                                                            <li key={i}>{step}</li>
                                                        ))}
                                                     </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    );
                })}
            </tbody>
        </table>
      </div>
    </div>
  );

  const renderNeedsContext = () => (
     <div className="space-y-4 animate-in fade-in duration-500">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {report.needs_context.map((item, idx) => (
                 <Card key={idx} className="bg-slate-900/40 border-slate-800 hover:border-blue-500/30 transition-colors">
                     <CardContent className="p-5 space-y-3">
                         <div className="flex justify-between items-start">
                             <div className="flex items-center gap-2">
                                <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-1 rounded uppercase">{item.language}</span>
                                <span className="text-xs font-bold bg-slate-800 text-blue-300 px-2 py-1 rounded">{item.category}</span>
                             </div>
                         </div>
                         <h4 className="font-semibold text-slate-200">{item.summary}</h4>
                         
                         <div className="pt-2 space-y-2">
                             <div className="flex items-start gap-2 text-sm text-amber-200/80 bg-amber-950/20 p-2 rounded">
                                 <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                 <div>
                                     <span className="font-semibold block text-xs uppercase mb-0.5 text-amber-500">{t('label_missing_info')}</span>
                                     {item.what_is_missing.join(', ')}
                                 </div>
                             </div>
                             <div className="text-sm text-slate-400">
                                 <span className="text-slate-500 font-medium">{t('label_risk')}: </span>
                                 {item.risk_if_wrong}
                             </div>
                             <div className="text-sm text-slate-300 border-t border-slate-800 pt-2 mt-2">
                                <span className="text-blue-400 font-medium">{t('label_next_step')} </span>
                                {item.suggested_next_step}
                             </div>
                         </div>
                     </CardContent>
                 </Card>
             ))}
         </div>
     </div>
  );

  const renderImprovements = () => (
      <div className="space-y-6 animate-in fade-in duration-500">
           <h3 className="text-xl font-bold flex items-center gap-2">
               <Lightbulb className="w-5 h-5 text-yellow-400" />
               {t('title_process_opt')}
           </h3>
           <div className="grid gap-6">
                {report.process_improvements.map((imp, idx) => (
                    <Card key={idx} className="border-l-4 border-l-purple-500">
                        <CardContent className="p-6">
                            <h4 className="text-lg font-semibold text-white mb-1">{imp.area}</h4>
                            <p className="text-purple-200 font-medium mb-4">{imp.recommendation}</p>
                            
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div className="bg-slate-900 p-3 rounded border border-slate-800">
                                    <span className="block text-slate-500 text-xs uppercase font-bold mb-1">{t('label_benefit')}</span>
                                    <p className="text-slate-300">{imp.expected_benefit}</p>
                                </div>
                                <div className="bg-slate-900 p-3 rounded border border-slate-800">
                                    <span className="block text-slate-500 text-xs uppercase font-bold mb-1">{t('label_example')}</span>
                                    <p className="text-slate-300 italic">"{imp.example}"</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
           </div>
      </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border hidden md:flex flex-col">
        <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                Report Insight
            </h2>
            <p className="text-xs text-slate-500 mt-1">{t('generated_on')}: {new Date(report.meta.generated_at).toLocaleDateString()}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <Button 
                variant={activeTab === 'overview' ? 'secondary' : 'ghost'} 
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab('overview')}
            >
                <BarChart3 className="w-4 h-4" /> {t('nav_overview')}
            </Button>
            <Button 
                variant={activeTab === 'fixes' ? 'secondary' : 'ghost'} 
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab('fixes')}
            >
                <ListChecks className="w-4 h-4" /> {t('nav_fix_list')}
                <span className="ml-auto bg-slate-700 text-slate-300 text-xs py-0.5 px-2 rounded-full">
                    {report.fix_list.length}
                </span>
            </Button>
            <Button 
                variant={activeTab === 'context' ? 'secondary' : 'ghost'} 
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab('context')}
            >
                <HelpCircle className="w-4 h-4" /> {t('nav_needs_context')}
                {report.needs_context.length > 0 && (
                    <span className="ml-auto bg-slate-800 border border-slate-600 text-slate-300 text-xs py-0.5 px-2 rounded-full">
                        {report.needs_context.length}
                    </span>
                )}
            </Button>
            <Button 
                variant={activeTab === 'improvements' ? 'secondary' : 'ghost'} 
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab('improvements')}
            >
                <Lightbulb className="w-4 h-4" /> {t('nav_improvements')}
            </Button>
        </nav>
        <div className="p-4 border-t border-border space-y-3">
             <Button 
                variant="primary" 
                className="w-full gap-2"
                onClick={exportXLSX}
            >
                <Download className="w-4 h-4" /> {t('btn_export')}
            </Button>
            <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={onReset}
            >
                <RefreshCw className="w-4 h-4" /> {t('btn_new_audit')}
            </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background p-8">
         <div className="max-w-6xl mx-auto">
             {activeTab === 'overview' && renderOverview()}
             {activeTab === 'fixes' && renderFixList()}
             {activeTab === 'context' && renderNeedsContext()}
             {activeTab === 'improvements' && renderImprovements()}
         </div>
      </main>
    </div>
  );
};