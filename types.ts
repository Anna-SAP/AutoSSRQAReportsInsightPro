export interface FileRecord {
  id: string;
  name: string;
  size: number;
  content: string;
  status: 'pending' | 'parsed' | 'error';
}

export enum IssuePriority {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2'
}

export interface FixItem {
  priority: IssuePriority;
  language: string;
  category: string;
  summary: string;
  evidence: {
    file_name: string;
    issue_id?: string;
    location?: string;
    source_text?: string;
    target_text?: string;
    rule_hit?: string;
  };
  why_it_matters: string;
  proposed_fix: string;
  verification_steps: string[];
  confidence: number;
  dedup?: {
    group_id: string;
    occurrences: number;
    other_locations?: Array<{file_name: string, location: string}>;
  };
  missing_fields?: string[];
}

export interface NeedsContextItem {
  language: string;
  category: string;
  summary: string;
  what_is_missing: string[];
  risk_if_wrong: string;
  suggested_next_step: string;
}

export interface ProcessImprovement {
  area: string;
  recommendation: string;
  expected_benefit: string;
  example: string;
}

export interface QualityOverview {
  overall_assessment: string;
  p0_count: number;
  p1_count: number;
  needs_context_count: number;
  top_risk_areas: string[];
}

export interface AuditReport {
  meta: {
    supported_languages: string[];
    detected_languages: string[];
    report_files: Array<{file_name: string, language: string, issues_found: number}>;
    generated_at: string;
  };
  quality_overview: QualityOverview;
  fix_list: FixItem[];
  needs_context: NeedsContextItem[];
  process_improvements: ProcessImprovement[];
  // We add this manually after generation because the prompt asks for separate summary text, 
  // but we will try to bake it into the JSON or handle it separately.
  // For this implementation, we will rely on 'quality_overview.overall_assessment'
}

export type AnalysisStatus = 'idle' | 'parsing' | 'auditing' | 'formatting' | 'complete' | 'error';
