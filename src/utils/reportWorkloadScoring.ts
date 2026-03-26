import { REPORT_WORKLOAD_CTA_LINKS, reportWorkloadResultTemplates } from "../data/reportWorkloadResults";
import type {
  ManualTaskValue,
  ReportWorkloadAnswers,
  ReportWorkloadCtaKey,
  ReportWorkloadResult,
  ReportWorkloadResultKey,
  ReportWorkloadResultTemplate,
  ReportCountValue,
  TimePerReportValue,
} from "./reportWorkloadTypes";

const timePerReportMap: Record<TimePerReportValue, number> = {
  under_30m: 0.5,
  "30m_1h": 0.75,
  "1_2h": 1.5,
  "2_4h": 3,
  over_4h: 5,
};

const manualTaskHourMap: Record<ManualTaskValue, number> = {
  ga4_export: 0.3,
  ad_manual_input: 0.3,
  graph_manual: 0.5,
  slide_paste: 0.5,
  duplicate_replace: 0.2,
  comment_manual: 0.3,
};

const reportCountMap: Record<ReportCountValue, number> = {
  one: 1,
  two_three: 2.5,
  four_five: 4.5,
  six_ten: 8,
  eleven_plus: 11,
};

const feelingHourMap = {
  very_bothersome: 0.25,
  analysis_time_lost: 0.3,
  numbers_only: 0.2,
  person_dependent: 0.25,
  want_automation: 0.15,
  no_complaint: 0,
} as const;

const has = <T extends string>(items: T[], value: T) => items.includes(value);
const unique = (items: string[]) => [...new Set(items)];
const roundHours = (value: number) => Math.round(value * 10) / 10;
const formatHours = (value: number) => `${roundHours(value).toFixed(1)}時間`;

const getCurrentMonthlyHours = (answers: ReportWorkloadAnswers) => {
  const baseHours = timePerReportMap[answers.timePerReport];
  const manualHours = answers.manualTasks.reduce(
    (sum, item) => sum + manualTaskHourMap[item],
    0,
  );
  const hiddenHours = answers.painPoints.length * 0.15;
  const feelingHours = feelingHourMap[answers.workloadFeeling];
  const reportCount = reportCountMap[answers.reportCount];

  let additionalHours = manualHours * 0.55 + hiddenHours * 0.5 + feelingHours * 0.6;

  if (answers.timePerReport === "under_30m" && answers.reportCount === "one") {
    additionalHours = Math.min(additionalHours, 0.35);
  } else if (
    (answers.timePerReport === "under_30m" || answers.timePerReport === "30m_1h") &&
    (answers.reportCount === "one" || answers.reportCount === "two_three")
  ) {
    additionalHours = Math.min(additionalHours, 0.6);
  }

  const perReportHours = baseHours + additionalHours;

  return perReportHours * reportCount;
};

const getReductionRate = (answers: ReportWorkloadAnswers) => {
  const manualScore = answers.manualTasks.length;
  const repetitionScore =
    (has(answers.manualTasks, "duplicate_replace") ? 1 : 0) +
    (has(answers.painPoints, "same_repetition") ? 1 : 0) +
    (answers.reportCount === "six_ten" || answers.reportCount === "eleven_plus" ? 1 : 0);
  const stressScore =
    answers.painPoints.length +
    (answers.workloadFeeling === "very_bothersome" || answers.workloadFeeling === "analysis_time_lost" ? 1 : 0);
  const automationNeedScore =
    manualScore * 1.2 +
    repetitionScore +
    stressScore * 0.4 +
    (answers.workloadFeeling === "want_automation" ? 1 : 0);

  let rate = 0.55;

  if (automationNeedScore >= 8) rate = 0.8;
  else if (automationNeedScore >= 6) rate = 0.72;
  else if (automationNeedScore >= 4) rate = 0.65;
  else if (automationNeedScore >= 2) rate = 0.6;

  if (
    answers.workloadFeeling === "no_complaint" &&
    manualScore <= 1 &&
    answers.painPoints.length <= 1
  ) {
    rate = Math.min(rate, 0.5);
  }

  return Math.min(Math.max(rate, 0.5), 0.8);
};

const getReducedMonthlyHours = (
  answers: ReportWorkloadAnswers,
  currentMonthlyHours: number,
  reductionRate: number,
) => {
  const reportCount = reportCountMap[answers.reportCount];
  const rawReducedHours = currentMonthlyHours * (1 - reductionRate);
  const perReportCap = 0.5;
  const monthlyCap = reportCount * perReportCap;

  return Math.min(rawReducedHours, monthlyCap);
};

const resolveResultKey = (
  currentMonthlyHours: number,
  savedMonthlyHours: number,
  answers: ReportWorkloadAnswers,
): ReportWorkloadResultKey => {
  if (
    savedMonthlyHours >= 8 ||
    (answers.manualTasks.length >= 4 && currentMonthlyHours >= 10) ||
    answers.reportCount === "six_ten" ||
    answers.reportCount === "eleven_plus"
  ) {
    return "high";
  }

  if (savedMonthlyHours >= 3 || answers.manualTasks.length >= 2 || answers.painPoints.length >= 3) {
    return "medium";
  }

  return "low";
};

const resolveCtaButtons = (answers: ReportWorkloadAnswers): ReportWorkloadCtaKey[] => {
  const hasGa4Work = has(answers.manualTasks, "ga4_export");
  const hasAdsWork = has(answers.manualTasks, "ad_manual_input");

  if (hasGa4Work && hasAdsWork) {
    return ["ga4_template", "google_ads_template"];
  }

  if (hasAdsWork) {
    return ["google_ads_template"];
  }

  return ["ga4_template"];
};

const buildDynamicInsights = (answers: ReportWorkloadAnswers) => {
  const items: string[] = [];

  if (has(answers.manualTasks, "ga4_export")) {
    items.push("GA4の転記作業は、毎月の確認だけでも積み上がりやすい工程です。");
  }
  if (has(answers.manualTasks, "graph_manual")) {
    items.push("グラフを毎回作り直していると、数字確認以外の作業時間も増えやすくなります。");
  }
  if (has(answers.manualTasks, "slide_paste")) {
    items.push("スライド貼り付けは細かい調整も含めて、見えない工数が発生しやすい作業です。");
  }
  if (has(answers.painPoints, "same_repetition")) {
    items.push("毎回同じ作業を繰り返している状態は、テンプレート化の効果が出やすい状態です。");
  }
  if (
    has(answers.manualTasks, "comment_manual") ||
    has(answers.painPoints, "comment_writing")
  ) {
    items.push("コメントや考察も、AIを補助的に使えば下書き作成をかなり短時間で進めやすくなります。");
  }

  return unique(items);
};

const buildDynamicActions = (answers: ReportWorkloadAnswers) => {
  const items: string[] = [];

  if (has(answers.manualTasks, "ga4_export") || has(answers.manualTasks, "ad_manual_input")) {
    items.push("まずは転記している表や数値一覧からテンプレートへ置き換える");
  }
  if (has(answers.manualTasks, "graph_manual") || has(answers.manualTasks, "slide_paste")) {
    items.push("グラフ作成と資料貼り付けを一体で減らせる構成にする");
  }
  if (
    has(answers.manualTasks, "comment_manual") ||
    has(answers.painPoints, "comment_writing")
  ) {
    items.push("コメントはAIで下書きを作り、最終確認だけ人が行う流れにするとかなり短縮しやすくなります。");
  }
  if (answers.freedTimeUse === "analysis" || answers.freedTimeUse === "ad_optimization") {
    items.push("削減できた時間を分析や改善提案に回せるよう、月次運用を先に標準化する");
  }

  return unique(items);
};

export const simulateReportWorkload = (
  answers: ReportWorkloadAnswers,
): ReportWorkloadResult => {
  const currentMonthlyHoursValue = roundHours(getCurrentMonthlyHours(answers));
  const currentYearlyHoursValue = roundHours(currentMonthlyHoursValue * 12);
  const reductionRate = getReductionRate(answers);
  const reducedMonthlyHoursValue = roundHours(
    getReducedMonthlyHours(answers, currentMonthlyHoursValue, reductionRate),
  );
  const savedMonthlyHoursValue = roundHours(currentMonthlyHoursValue - reducedMonthlyHoursValue);
  const savedYearlyHoursValue = roundHours(savedMonthlyHoursValue * 12);
  const savedWorkdaysValue = roundHours(savedYearlyHoursValue / 8);
  const key = resolveResultKey(currentMonthlyHoursValue, savedMonthlyHoursValue, answers);
  const base: ReportWorkloadResultTemplate = reportWorkloadResultTemplates[key];

  return {
    key,
    resultTitle: base.resultTitle,
    leadMessage: base.leadMessage,
    currentMonthlyHours: `${formatHours(currentMonthlyHoursValue)} / 月`,
    currentYearlyHours: `${formatHours(currentYearlyHoursValue)} / 年`,
    reducedMonthlyHours: `${formatHours(reducedMonthlyHoursValue)} / 月`,
    savedMonthlyHours: `${formatHours(savedMonthlyHoursValue)} / 月`,
    savedYearlyHours: `${formatHours(savedYearlyHoursValue)} / 年`,
    savedWorkdays: `${savedWorkdaysValue.toFixed(1)}日分`,
    insightPoints: unique([...base.insightPoints, ...buildDynamicInsights(answers)]).slice(0, 5),
    recommendedActions: unique([...base.recommendedActions, ...buildDynamicActions(answers)]).slice(0, 5),
    ctaButtons: resolveCtaButtons(answers),
    currentMonthlyHoursValue,
    reducedMonthlyHoursValue,
  };
};

export const getReportWorkloadCtas = (keys: ReportWorkloadCtaKey[]) =>
  keys.map((key) => ({
    key,
    ...REPORT_WORKLOAD_CTA_LINKS[key],
  }));
