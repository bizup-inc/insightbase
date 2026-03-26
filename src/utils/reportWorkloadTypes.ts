export type ManualTaskValue =
  | "ga4_export"
  | "ad_manual_input"
  | "graph_manual"
  | "slide_paste"
  | "duplicate_replace"
  | "comment_manual";

export type TimePerReportValue =
  | "under_30m"
  | "30m_1h"
  | "1_2h"
  | "2_4h"
  | "over_4h";

export type ReportCountValue =
  | "one"
  | "two_three"
  | "four_five"
  | "six_ten"
  | "eleven_plus";

export type PainPointValue =
  | "number_aggregation"
  | "excel_formatting"
  | "graph_building"
  | "slide_pasting"
  | "comment_writing"
  | "checking_numbers"
  | "same_repetition";

export type WorkloadFeelingValue =
  | "very_bothersome"
  | "analysis_time_lost"
  | "numbers_only"
  | "person_dependent"
  | "want_automation"
  | "no_complaint";

export type FreedTimeValue =
  | "analysis"
  | "ad_optimization"
  | "client_communication"
  | "sales_activity"
  | "other_projects"
  | "reduce_overtime";

export type ReportWorkloadQuestionKey =
  | "manualTasks"
  | "timePerReport"
  | "reportCount"
  | "painPoints"
  | "workloadFeeling"
  | "freedTimeUse";

export type ReportWorkloadValue =
  | ManualTaskValue
  | TimePerReportValue
  | ReportCountValue
  | PainPointValue
  | WorkloadFeelingValue
  | FreedTimeValue;

export interface ReportWorkloadOption {
  value: ReportWorkloadValue;
  label: string;
}

export interface ReportWorkloadQuestion {
  key: ReportWorkloadQuestionKey;
  number: number;
  title: string;
  help: string;
  type: "single" | "multiple";
  options: ReportWorkloadOption[];
}

export interface ReportWorkloadAnswers {
  manualTasks: ManualTaskValue[];
  timePerReport: TimePerReportValue;
  reportCount: ReportCountValue;
  painPoints: PainPointValue[];
  workloadFeeling: WorkloadFeelingValue;
  freedTimeUse: FreedTimeValue;
}

export type ReportWorkloadResultKey = "high" | "medium" | "low";

export type ReportWorkloadCtaKey = "ga4_template" | "google_ads_template";

export interface ReportWorkloadResultTemplate {
  resultTitle: string;
  leadMessage: string;
  insightPoints: string[];
  recommendedActions: string[];
}

export interface ReportWorkloadResult {
  key: ReportWorkloadResultKey;
  resultTitle: string;
  leadMessage: string;
  currentMonthlyHours: string;
  currentYearlyHours: string;
  reducedMonthlyHours: string;
  savedMonthlyHours: string;
  savedYearlyHours: string;
  savedWorkdays: string;
  insightPoints: string[];
  recommendedActions: string[];
  ctaButtons: ReportWorkloadCtaKey[];
  currentMonthlyHoursValue: number;
  reducedMonthlyHoursValue: number;
}
