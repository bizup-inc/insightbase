import { adBudgetResultMessages } from "../data/adBudgetResultMessages";

export type AdBudgetSiteType = "b2b_lead" | "service_site" | "ec_site" | "recruit_site";
export type AdBudgetMode = "goal" | "audit";
export type AdBudgetAuditStatus = "good" | "caution" | "strict";
export type AdBudgetMetricFormat = "currency" | "count" | "percent" | "ratio";

export type AdBudgetFieldKey =
  | "monthlyBudget"
  | "assumedCpc"
  | "clicks"
  | "leads"
  | "cvs"
  | "purchases"
  | "applications"
  | "targetLeads"
  | "targetCvs"
  | "targetRevenue"
  | "targetHires"
  | "interviewCount"
  | "hireCount"
  | "meetingCount"
  | "orderCount"
  | "dealCount"
  | "serviceCloseRate"
  | "interviewRate"
  | "hireRate"
  | "averageOrderValue"
  | "averageDealValue"
  | "averageOrderAmount"
  | "grossMargin"
  | "allowableHireCost"
  | "ltv";

export interface AdBudgetFieldConfig {
  key: AdBudgetFieldKey;
  label: string;
  required: boolean;
  allowZero?: boolean;
  suffix: string;
  kind: "currency" | "percent" | "number";
  placeholder: string;
}

export interface AdBudgetModeConfig {
  key: AdBudgetMode;
  label: string;
  description: string;
  submitLabel: string;
  intro: string;
  fields: AdBudgetFieldConfig[];
}

export interface AdBudgetSiteTypeConfig {
  key: AdBudgetSiteType;
  label: string;
  shortLabel: string;
  description: string;
  modes: Record<AdBudgetMode, AdBudgetModeConfig>;
}

export interface AdBudgetInputValues {
  monthlyBudget?: number;
  assumedCpc?: number;
  clicks?: number;
  leads?: number;
  cvs?: number;
  purchases?: number;
  applications?: number;
  targetLeads?: number;
  targetCvs?: number;
  targetRevenue?: number;
  targetHires?: number;
  interviewCount?: number;
  hireCount?: number;
  meetingCount?: number;
  orderCount?: number;
  dealCount?: number;
  serviceCloseRate?: number;
  interviewRate?: number;
  hireRate?: number;
  averageOrderValue?: number;
  averageDealValue?: number;
  averageOrderAmount?: number;
  grossMargin?: number;
  allowableHireCost?: number;
  ltv?: number;
}

export interface AdBudgetMetricItem {
  label: string;
  value: number;
  format: AdBudgetMetricFormat;
}

export interface AdBudgetReferenceCard {
  title: string;
  valueLabel: string;
  value: number;
  format: AdBudgetMetricFormat;
  description: string;
}

export interface AdBudgetReferenceTableColumn {
  key:
    | "cvrLabel"
    | "cpc"
    | "clicks"
    | "cvs"
    | "cpa"
    | "revenue"
    | "grossProfit"
    | "roas"
    | "grossProfitRoas"
    | "interviews"
    | "hires";
  label: string;
  tooltip: string;
}

export interface AdBudgetReferenceTableRow {
  cvrLabel: string;
  cvrValue: number;
  cpc: number;
  clicks: number;
  cvs: number;
  cpa: number;
  revenue: number;
  grossProfit: number;
  roas: number;
  grossProfitRoas: number;
  interviews?: number;
  hires?: number;
  highlighted?: boolean;
}

export interface AdBudgetSimulationResult {
  siteType: AdBudgetSiteType;
  mode: AdBudgetMode;
  status?: AdBudgetAuditStatus;
  statusLabel?: string;
  resultTitle: string;
  summary: string;
  primaryHeading?: string;
  referenceHeading?: string;
  secondaryHeading?: string;
  primaryMetrics: AdBudgetMetricItem[];
  secondaryMetrics: AdBudgetMetricItem[];
  referenceCards: AdBudgetReferenceCard[];
  referenceTableTitle?: string;
  referenceTableColumns?: AdBudgetReferenceTableColumn[];
  referenceTableRows?: AdBudgetReferenceTableRow[];
  referenceNote?: string;
  insightPoints: string[];
  recommendedActions: string[];
  differenceText?: string;
  priorityText?: string;
}

type ResultMessage = {
  title: string;
  summary: string;
  insights: string[];
  actions: string[];
};

const percent = (value?: number) => (value ?? 0) / 100;
const safeDivide = (numerator: number, denominator: number) =>
  denominator > 0 ? numerator / denominator : 0;
const round = (value: number) => Math.round(value * 10) / 10;
const floorCount = (value: number) => Math.floor(value);

const statusLabelMap: Record<AdBudgetAuditStatus, string> = {
  good: "良好",
  caution: "注意",
  strict: "厳しめ",
};

const cpcReferenceCards = (allowableCpa: number): AdBudgetReferenceCard[] =>
  [1, 2, 3].map((rate) => ({
    title: `CVR ${rate}%`,
    valueLabel: "許容CPC",
    value: allowableCpa * (rate / 100),
    format: "currency",
    description: `CVRが${rate}%で推移した場合に検討しやすいCPCの目安です。`,
  }));

const serviceGoalTableColumns: AdBudgetReferenceTableColumn[] = [
  { key: "cvrLabel", label: "CVR", tooltip: "クリックのうち何件が販売につながるかを示す割合です。" },
  { key: "cpc", label: "想定クリック単価", tooltip: "広告クリック1件あたりに想定している単価です。" },
  { key: "clicks", label: "想定クリック数", tooltip: "許容広告費の上限目安を想定クリック単価で割ったクリック数です。" },
  { key: "cvs", label: "販売件数", tooltip: "想定クリック数にCVRを掛けて算出した販売件数です。" },
  { key: "cpa", label: "CPA", tooltip: "販売1件を獲得するのにかかる広告費です。" },
  { key: "revenue", label: "想定売上", tooltip: "販売件数に平均成約単価を掛けて算出した売上です。" },
  { key: "grossProfit", label: "想定粗利益", tooltip: "想定売上に粗利率を掛けて算出した粗利益です。" },
  { key: "roas", label: "ROAS", tooltip: "広告費に対して売上が何倍返ってくるかを示す指標です。" },
  { key: "grossProfitRoas", label: "粗利ベースROAS", tooltip: "広告費に対して粗利益が何倍返ってくるかを示す指標です。" },
];

const b2bGoalTableColumns: AdBudgetReferenceTableColumn[] = [
  { key: "cvrLabel", label: "CVR", tooltip: "クリックのうち何件がリード獲得につながるかを示す割合です。" },
  { key: "cpc", label: "想定クリック単価", tooltip: "広告クリック1件あたりに想定している単価です。" },
  { key: "clicks", label: "想定クリック数", tooltip: "許容広告費の上限目安を想定クリック単価で割ったクリック数です。" },
  { key: "cvs", label: "リード件数", tooltip: "想定クリック数にCVRを掛けて算出したリード件数です。" },
  { key: "cpa", label: "CPA", tooltip: "リード1件を獲得するのにかかる広告費です。" },
  { key: "revenue", label: "想定売上", tooltip: "リードから商談・受注への歩留まりを反映して算出した売上です。" },
  { key: "grossProfit", label: "想定粗利益", tooltip: "想定売上に粗利率を掛けて算出した粗利益です。" },
  { key: "roas", label: "ROAS", tooltip: "広告費に対して売上が何倍返ってくるかを示す指標です。" },
  { key: "grossProfitRoas", label: "粗利ベースROAS", tooltip: "広告費に対して粗利益が何倍返ってくるかを示す指標です。" },
];

const ecGoalTableColumns: AdBudgetReferenceTableColumn[] = [
  { key: "cvrLabel", label: "CVR", tooltip: "クリックのうち何件が購入につながるかを示す割合です。" },
  { key: "cpc", label: "想定クリック単価", tooltip: "広告クリック1件あたりに想定している単価です。" },
  { key: "clicks", label: "想定クリック数", tooltip: "許容広告費の上限目安を想定クリック単価で割ったクリック数です。" },
  { key: "cvs", label: "購入件数", tooltip: "想定クリック数にCVRを掛けて算出した購入件数です。" },
  { key: "cpa", label: "CPA", tooltip: "購入1件を獲得するのにかかる広告費です。" },
  { key: "revenue", label: "想定売上", tooltip: "購入件数に平均注文単価を掛けて算出した売上です。" },
  { key: "grossProfit", label: "想定粗利益", tooltip: "想定売上に粗利率を掛けて算出した粗利益です。" },
  { key: "roas", label: "ROAS", tooltip: "広告費に対して売上が何倍返ってくるかを示す指標です。" },
  { key: "grossProfitRoas", label: "粗利ベースROAS", tooltip: "広告費に対して粗利益が何倍返ってくるかを示す指標です。" },
];

const recruitGoalTableColumns: AdBudgetReferenceTableColumn[] = [
  { key: "cvrLabel", label: "CVR", tooltip: "クリックのうち何件が応募につながるかを示す割合です。" },
  { key: "cpc", label: "想定クリック単価", tooltip: "広告クリック1件あたりに想定している単価です。" },
  { key: "clicks", label: "想定クリック数", tooltip: "許容広告費の上限目安を想定クリック単価で割ったクリック数です。" },
  { key: "cvs", label: "エントリー数", tooltip: "想定クリック数にCVRを掛けて算出したエントリー数です。" },
  { key: "cpa", label: "応募単価", tooltip: "応募1件を獲得するのにかかる広告費です。" },
  { key: "interviews", label: "面接数", tooltip: "応募数に面接化率を掛けて算出した面接数です。" },
  { key: "hires", label: "採用数", tooltip: "面接数に採用率を掛けて算出した採用数です。" },
];

const unique = (items: string[]) => [...new Set(items)];

const getGoalMessage = (siteType: AdBudgetSiteType): ResultMessage =>
  adBudgetResultMessages[siteType].goal.guide;

const getAuditMessage = (siteType: AdBudgetSiteType, status: AdBudgetAuditStatus): ResultMessage =>
  adBudgetResultMessages[siteType].audit[status];

const buildGoalInsights = (
  siteType: AdBudgetSiteType,
  values: AdBudgetInputValues,
): string[] => {
  const items: string[] = [];

  if (siteType === "b2b_lead" || siteType === "service_site") {
    items.push("必要CVRがやや高く見える場合でも、想定クリック単価を下げられれば成立しやすいラインまで下げられることがあります。");
    items.push("CVRだけでなくCPCの前提でも結果は大きく変わるため、LP改善と配信改善をセットで考えるのがおすすめです。");
  }

  if (siteType === "ec_site") {
    items.push("ECはCVR改善だけでなく、クリック単価や商品別の配分見直しでも成立ラインを動かしやすいです。");
  }

  if (siteType === "recruit_site") {
    items.push("採用は応募率だけでなく、クリック単価を抑えられる媒体や訴求を探すことで必要条件を下げやすくなります。");
  }

  if (values.ltv) {
    items.push("LTVが高い商材は、初回の回収だけでなくLTV前提でも許容値を見直しやすくなります。");
  }

  return unique(items).slice(0, 5);
};

const buildGoalActions = (siteType: AdBudgetSiteType): string[] =>
  (
    {
      b2b_lead: [
        "必要CVRだけでなく、想定クリック単価を下げられる余地があるかを先に確認する",
        "キーワード、配信面、広告訴求を見直してCPCを抑えつつ、LP改善でCVRも底上げする",
      ],
      service_site: [
        "クリック単価を抑えられる前提が作れそうかを見ながら、必要CVRの妥当性を判断する",
        "広告訴求・配信面・LP改善を合わせて見直し、必要CVRを現実的な水準に寄せる",
      ],
      ec_site: [
        "粗利率と許容CPAを確認しつつ、クリック単価を抑えられる商品や配信面を優先する",
        "LTVがある場合は初回回収だけでなくLTVベースでもCPC上限を見直す",
      ],
      recruit_site: [
        "必要応募数だけでなく、クリック単価を抑えられる媒体や訴求を先に洗い出す",
        "応募率改善とCPC改善の両方で、必要条件を現実的なラインに近づける",
      ],
    } as const
  )[siteType];

const buildAuditInsights = (
  siteType: AdBudgetSiteType,
  status: AdBudgetAuditStatus,
  values: AdBudgetInputValues,
): string[] => {
  const items: string[] = [];

  if (siteType === "b2b_lead") {
    items.push("B2BはCPAだけでなく、商談件数と受注件数まで含めると広告費の重さが見えやすくなります。");
  }

  if (siteType === "service_site") {
    items.push("CVは取れていても、成約率が低いと広告費の回収感は大きく変わります。");
  }

  if (siteType === "ec_site") {
    items.push("ECは売上ROASだけでなく、粗利ベースROASで見ると判断しやすくなります。");
  }

  if (siteType === "recruit_site") {
    items.push("採用は応募数だけで見ると判断を誤りやすいため、採用単価まで含めて見るのがおすすめです。");
  }

  if (status !== "good") {
    items.push("予算増の前に、CPC・CVR・後工程の歩留まりのどこを優先して改善するかを決めると動きやすくなります。");
  }

  if (values.grossMargin && values.grossMargin < 30) {
    items.push("粗利率が低い前提だと、売上ベースで成立していても広告費の余裕は小さくなりやすいです。");
  }

  return unique(items).slice(0, 5);
};

const buildAuditActions = (siteType: AdBudgetSiteType, status: AdBudgetAuditStatus): string[] => {
  const base =
    {
      b2b_lead: [
        "商談件数か受注件数のどこで落ちているかを分けて確認する",
        "CV単価だけでなく受注獲得単価を毎月見る指標に含める",
      ],
      service_site: [
        "CVRと成約率のどちらを優先改善するかを先に決める",
        "広告・LP・営業接続を分けてボトルネックを確認する",
      ],
      ec_site: [
        "CPAだけでなく粗利ベースROASを基準に運用判断する",
        "CPC改善とCVR改善のどちらが効くかを商品別に見直す",
      ],
      recruit_site: [
        "応募率と面接化率のどちらが弱いかを先に切り分ける",
        "媒体面だけでなく求人訴求や応募導線も合わせて見直す",
      ],
    } as const;

  const items = [...base[siteType]];
  if (status === "strict") {
    items.unshift("予算増より先に、今の前提条件でどこが重いかを再確認する");
  }

  return unique(items).slice(0, 5);
};

const goalSimulationB2B = (
  values: AdBudgetInputValues,
): AdBudgetSimulationResult => {
  const targetLeads = values.targetLeads ?? 0;
  const meetings = values.meetingCount ?? 0;
  const orders = values.orderCount ?? 0;
  const revenue = orders * (values.averageOrderValue ?? 0);
  const grossProfit = revenue * percent(values.grossMargin);
  const budget = grossProfit;
  const assumedCpc = values.assumedCpc ?? 0;
  const clicks = safeDivide(budget, assumedCpc);
  const allowableCpa = safeDivide(budget, targetLeads);
  const allowableMeetingCost = safeDivide(budget, meetings);
  const allowableOrderCost = safeDivide(budget, orders);
  const meetingRate = safeDivide(meetings, targetLeads);
  const closeRate = safeDivide(orders, meetings);
  const baseRows: AdBudgetReferenceTableRow[] = Array.from({ length: 10 }, (_, index) => {
    const cvr = (index + 1) / 100;
    const projectedLeads = clicks * cvr;
    const projectedMeetings = projectedLeads * meetingRate;
    const projectedOrders = projectedMeetings * closeRate;
    const projectedRevenue = projectedOrders * (values.averageOrderValue ?? 0);
    const projectedGrossProfit = projectedRevenue * percent(values.grossMargin);

    return {
      cvrLabel: `${index + 1}%`,
      cvrValue: cvr * 100,
      cpc: assumedCpc,
      clicks,
      cvs: projectedLeads,
      cpa: safeDivide(budget, projectedLeads),
      revenue: projectedRevenue,
      grossProfit: projectedGrossProfit,
      roas: safeDivide(projectedRevenue, budget),
      grossProfitRoas: safeDivide(projectedGrossProfit, budget),
    };
  });
  const requiredCvr = safeDivide(targetLeads, clicks);
  const requiredLeads = clicks * requiredCvr;
  const requiredMeetings = requiredLeads * meetingRate;
  const requiredOrders = requiredMeetings * closeRate;
  const requiredRevenue = requiredOrders * (values.averageOrderValue ?? 0);
  const requiredGrossProfit = requiredRevenue * percent(values.grossMargin);
  const referenceTableRows = [
    ...baseRows,
    {
      cvrLabel: `${(requiredCvr * 100).toFixed(2)}%`,
      cvrValue: requiredCvr * 100,
      cpc: assumedCpc,
      clicks,
      cvs: requiredLeads,
      cpa: safeDivide(budget, requiredLeads),
      revenue: requiredRevenue,
      grossProfit: requiredGrossProfit,
      roas: safeDivide(requiredRevenue, budget),
      grossProfitRoas: safeDivide(requiredGrossProfit, budget),
      highlighted: true,
    },
  ].sort((a, b) => a.cvrValue - b.cvrValue);
  const message = getGoalMessage("b2b_lead");

  return {
    siteType: "b2b_lead",
    mode: "goal",
    resultTitle: `目標から逆算すると、許容広告費の上限目安は${Math.round(budget).toLocaleString("ja-JP")}円です`,
    summary: message.summary,
    primaryMetrics: [
      { label: "許容広告費の上限目安", value: budget, format: "currency" },
      { label: "月間リード目標件数", value: targetLeads, format: "count" },
      { label: "想定商談件数", value: meetings, format: "count" },
      { label: "想定受注件数", value: orders, format: "count" },
      { label: "想定売上", value: revenue, format: "currency" },
      { label: "想定クリック単価", value: assumedCpc, format: "currency" },
    ],
    secondaryMetrics: [
      { label: "想定粗利", value: grossProfit, format: "currency" },
      { label: "許容CPA", value: allowableCpa, format: "currency" },
      { label: "許容商談獲得単価", value: allowableMeetingCost, format: "currency" },
      { label: "許容受注獲得単価", value: allowableOrderCost, format: "currency" },
      { label: "想定クリック数", value: clicks, format: "count" },
    ],
    referenceCards: [],
    referenceTableTitle: "CVR 1%〜10% と上限ラインの想定CPC・売上・粗利益",
    referenceTableColumns: b2bGoalTableColumns,
    referenceTableRows,
    insightPoints: [...message.insights, ...buildGoalInsights("b2b_lead", values)].slice(0, 5),
    recommendedActions: buildGoalActions("b2b_lead"),
  };
};

const goalSimulationService = (
  values: AdBudgetInputValues,
): AdBudgetSimulationResult => {
  const revenue = values.targetRevenue ?? 0;
  const targetSalesCount = safeDivide(revenue, values.averageDealValue ?? 0);
  const grossProfit = revenue * percent(values.grossMargin);
  const budget = grossProfit;
  const allowableSaleCost = safeDivide(budget, targetSalesCount);
  const assumedCpc = values.assumedCpc ?? 0;
  const clicks = safeDivide(budget, assumedCpc);
  const baseRows: AdBudgetReferenceTableRow[] = Array.from({ length: 10 }, (_, index) => {
    const cvr = (index + 1) / 100;
    const cvs = clicks * cvr;
    const projectedRevenue = cvs * (values.averageDealValue ?? 0);
    const projectedGrossProfit = projectedRevenue * percent(values.grossMargin);

    return {
      cvrLabel: `${index + 1}%`,
      cvrValue: cvr * 100,
      cpc: assumedCpc,
      clicks,
      cvs,
      cpa: allowableSaleCost,
      revenue: projectedRevenue,
      grossProfit: projectedGrossProfit,
      roas: safeDivide(projectedRevenue, budget),
      grossProfitRoas: safeDivide(projectedGrossProfit, budget),
    };
  });
  const requiredCvr = safeDivide(targetSalesCount, clicks);
  const requiredCvs = clicks * requiredCvr;
  const requiredRevenue = requiredCvs * (values.averageDealValue ?? 0);
  const requiredGrossProfit = requiredRevenue * percent(values.grossMargin);
  const referenceTableRows = [
    ...baseRows,
    {
      cvrLabel: `${(requiredCvr * 100).toFixed(2)}%`,
      cvrValue: requiredCvr * 100,
      cpc: assumedCpc,
      clicks,
      cvs: requiredCvs,
      cpa: allowableSaleCost,
      revenue: requiredRevenue,
      grossProfit: requiredGrossProfit,
      roas: safeDivide(requiredRevenue, budget),
      grossProfitRoas: safeDivide(requiredGrossProfit, budget),
      highlighted: true,
    },
  ].sort((a, b) => a.cvrValue - b.cvrValue);
  const message = getGoalMessage("service_site");

  return {
    siteType: "service_site",
    mode: "goal",
    resultTitle: `目標から逆算すると、許容広告費の上限目安は${Math.round(budget).toLocaleString("ja-JP")}円です`,
    summary: message.summary,
    primaryHeading: "許容広告費の上限目安と主要指標",
    referenceHeading: "販売目標から見た参考目安",
    secondaryHeading: "補足指標",
    primaryMetrics: [
      { label: "許容広告費の上限目安", value: budget, format: "currency" },
      { label: "販売目標件数", value: targetSalesCount, format: "count" },
      { label: "月間売上目標", value: revenue, format: "currency" },
      { label: "平均成約単価", value: values.averageDealValue ?? 0, format: "currency" },
      { label: "想定クリック単価", value: assumedCpc, format: "currency" },
    ],
    secondaryMetrics: [
      { label: "想定粗利", value: grossProfit, format: "currency" },
      { label: "許容販売単価", value: allowableSaleCost, format: "currency" },
      { label: "想定クリック数", value: clicks, format: "count" },
      {
        label: "広告費率",
        value: safeDivide(budget, revenue) * 100,
        format: "percent",
      },
    ],
    referenceCards: [],
    referenceTableTitle: "CVR 1%〜10% と上限ラインの想定CPC・売上・粗利益",
    referenceTableColumns: serviceGoalTableColumns,
    referenceTableRows,
    insightPoints: [...message.insights, ...buildGoalInsights("service_site", values)].slice(0, 5),
    recommendedActions: buildGoalActions("service_site"),
  };
};

const goalSimulationEc = (
  values: AdBudgetInputValues,
): AdBudgetSimulationResult => {
  const revenue = values.targetRevenue ?? 0;
  const purchases = safeDivide(revenue, values.averageOrderAmount ?? 0);
  const grossProfit = revenue * percent(values.grossMargin);
  const budget = grossProfit;
  const assumedCpc = values.assumedCpc ?? 0;
  const clicks = safeDivide(budget, assumedCpc);
  const allowableCpa = safeDivide(budget, purchases);
  const breakEvenRoas = safeDivide(revenue, budget);
  const message = getGoalMessage("ec_site");
  const baseRows: AdBudgetReferenceTableRow[] = Array.from({ length: 10 }, (_, index) => {
    const cvr = (index + 1) / 100;
    const projectedPurchases = clicks * cvr;
    const projectedRevenue = projectedPurchases * (values.averageOrderAmount ?? 0);
    const projectedGrossProfit = projectedRevenue * percent(values.grossMargin);

    return {
      cvrLabel: `${index + 1}%`,
      cvrValue: cvr * 100,
      cpc: assumedCpc,
      clicks,
      cvs: projectedPurchases,
      cpa: safeDivide(budget, projectedPurchases),
      revenue: projectedRevenue,
      grossProfit: projectedGrossProfit,
      roas: safeDivide(projectedRevenue, budget),
      grossProfitRoas: safeDivide(projectedGrossProfit, budget),
    };
  });
  const requiredCvr = safeDivide(purchases, clicks);
  const requiredPurchases = clicks * requiredCvr;
  const requiredRevenue = requiredPurchases * (values.averageOrderAmount ?? 0);
  const requiredGrossProfit = requiredRevenue * percent(values.grossMargin);
  const referenceTableRows = [
    ...baseRows,
    {
      cvrLabel: `${(requiredCvr * 100).toFixed(2)}%`,
      cvrValue: requiredCvr * 100,
      cpc: assumedCpc,
      clicks,
      cvs: requiredPurchases,
      cpa: safeDivide(budget, requiredPurchases),
      revenue: requiredRevenue,
      grossProfit: requiredGrossProfit,
      roas: safeDivide(requiredRevenue, budget),
      grossProfitRoas: safeDivide(requiredGrossProfit, budget),
      highlighted: true,
    },
  ].sort((a, b) => a.cvrValue - b.cvrValue);
  const secondaryMetrics: AdBudgetMetricItem[] = [
    { label: "想定粗利", value: grossProfit, format: "currency" },
    { label: "許容CPA", value: allowableCpa, format: "currency" },
    { label: "損益分岐ROAS", value: breakEvenRoas * 100, format: "percent" },
    { label: "想定クリック数", value: clicks, format: "count" },
  ];

  if (values.ltv) {
    secondaryMetrics.push({
      label: "LTVベース許容CPA",
      value: (values.ltv ?? 0) * percent(values.grossMargin),
      format: "currency",
    });
  }

  return {
    siteType: "ec_site",
    mode: "goal",
    resultTitle: `目標から逆算すると、許容広告費の上限目安は${Math.round(budget).toLocaleString("ja-JP")}円です`,
    summary: message.summary,
    primaryHeading: "許容広告費の上限目安と主要指標",
    referenceHeading: "購入目標から見た参考目安",
    secondaryHeading: "補足指標",
    primaryMetrics: [
      { label: "許容広告費の上限目安", value: budget, format: "currency" },
      { label: "月間売上目標", value: revenue, format: "currency" },
      { label: "想定購入件数", value: purchases, format: "count" },
      { label: "平均注文単価", value: values.averageOrderAmount ?? 0, format: "currency" },
      { label: "想定クリック単価", value: assumedCpc, format: "currency" },
    ],
    secondaryMetrics,
    referenceCards: [],
    referenceTableTitle: "CVR 1%〜10% と上限ラインの想定CPC・売上・粗利益",
    referenceTableColumns: ecGoalTableColumns,
    referenceTableRows,
    insightPoints: [...message.insights, ...buildGoalInsights("ec_site", values)].slice(0, 5),
    recommendedActions: buildGoalActions("ec_site"),
  };
};

const goalSimulationRecruit = (
  values: AdBudgetInputValues,
): AdBudgetSimulationResult => {
  const hires = values.targetHires ?? 0;
  const interviews = values.interviewCount ?? 0;
  const applications = values.applications ?? 0;
  const budget = hires * (values.allowableHireCost ?? 0);
  const assumedCpc = values.assumedCpc ?? 0;
  const clicks = safeDivide(budget, assumedCpc);
  const allowableApplicationCost = safeDivide(budget, applications);
  const allowableInterviewCost = safeDivide(budget, interviews);
  const interviewRate = safeDivide(interviews, applications);
  const hireRate = safeDivide(hires, interviews);
  const baseRows: AdBudgetReferenceTableRow[] = Array.from({ length: 10 }, (_, index) => {
    const cvr = (index + 1) / 100;
    const projectedApplications = floorCount(clicks * cvr);
    const projectedInterviews = floorCount(projectedApplications * interviewRate);
    const projectedHires = floorCount(projectedInterviews * hireRate);

    return {
      cvrLabel: `${index + 1}%`,
      cvrValue: cvr * 100,
      cpc: assumedCpc,
      clicks,
      cvs: projectedApplications,
      cpa: safeDivide(budget, projectedApplications),
      revenue: 0,
      grossProfit: 0,
      roas: 0,
      grossProfitRoas: 0,
      interviews: projectedInterviews,
      hires: projectedHires,
    };
  });
  const requiredCvr = safeDivide(applications, clicks);
  const requiredApplications = floorCount(clicks * requiredCvr);
  const requiredInterviews = floorCount(requiredApplications * interviewRate);
  const requiredHires = floorCount(requiredInterviews * hireRate);
  const referenceTableRows = [
    ...baseRows,
    {
      cvrLabel: `${(requiredCvr * 100).toFixed(2)}%`,
      cvrValue: requiredCvr * 100,
      cpc: assumedCpc,
      clicks,
      cvs: requiredApplications,
      cpa: safeDivide(budget, requiredApplications),
      revenue: 0,
      grossProfit: 0,
      roas: 0,
      grossProfitRoas: 0,
      interviews: requiredInterviews,
      hires: requiredHires,
      highlighted: true,
    },
  ].sort((a, b) => a.cvrValue - b.cvrValue);
  const message = getGoalMessage("recruit_site");

  return {
    siteType: "recruit_site",
    mode: "goal",
    resultTitle: `目標から逆算すると、許容広告費の上限目安は${Math.round(budget).toLocaleString("ja-JP")}円です`,
    summary: message.summary,
    primaryHeading: "許容広告費の上限目安と主要指標",
    referenceHeading: "採用目標から見た参考目安",
    secondaryHeading: "補足指標",
    primaryMetrics: [
      { label: "許容広告費の上限目安", value: budget, format: "currency" },
      { label: "採用目標人数", value: hires, format: "count" },
      { label: "月間エントリー数", value: applications, format: "count" },
      { label: "面接件数", value: interviews, format: "count" },
      { label: "想定クリック単価", value: assumedCpc, format: "currency" },
    ],
    secondaryMetrics: [
      { label: "許容応募単価", value: allowableApplicationCost, format: "currency" },
      { label: "許容面接単価", value: allowableInterviewCost, format: "currency" },
      { label: "想定クリック数", value: clicks, format: "count" },
    ],
    referenceCards: [],
    referenceTableTitle: "CVR 1%〜10% と上限ラインの応募数・面接数・採用数",
    referenceTableColumns: recruitGoalTableColumns,
    referenceTableRows,
    insightPoints: [...message.insights, ...buildGoalInsights("recruit_site", values)].slice(0, 5),
    recommendedActions: buildGoalActions("recruit_site"),
  };
};

const auditDifferenceText = (
  siteType: AdBudgetSiteType,
  actual: number,
  ideal: number,
): string => {
  if (siteType === "ec_site") {
    const diff = round(actual - ideal);
    return diff >= 0
      ? `理想目安の粗利ベースROAS ${ideal.toFixed(1)}倍に対して、現在は ${actual.toFixed(1)}倍です。`
      : `理想目安の粗利ベースROAS ${ideal.toFixed(1)}倍に対して、現在は ${actual.toFixed(1)}倍で ${Math.abs(diff).toFixed(1)}倍足りていません。`;
  }

  if (siteType === "recruit_site") {
    const diff = actual - ideal;
    return diff <= 0
      ? `許容採用コスト ${Math.round(ideal).toLocaleString("ja-JP")}円に対して、現在の採用単価は ${Math.round(actual).toLocaleString("ja-JP")}円です。`
      : `許容採用コスト ${Math.round(ideal).toLocaleString("ja-JP")}円に対して、現在の採用単価は ${Math.round(actual).toLocaleString("ja-JP")}円で ${Math.round(diff).toLocaleString("ja-JP")}円高い状態です。`;
  }

  const diff = round(actual - ideal);
  return diff <= 0
    ? `理想目安の粗利広告比率 ${Math.round(ideal * 100)}% に対して、現在は ${Math.round(actual * 100)}% です。`
    : `理想目安の粗利広告比率 ${Math.round(ideal * 100)}% に対して、現在は ${Math.round(actual * 100)}% で ${Math.round(diff * 100)}pt 高い状態です。`;
};

const auditPriorityText = (
  siteType: AdBudgetSiteType,
  values: AdBudgetInputValues,
  derived: { cvr?: number; meetingRate?: number; closeRate?: number; serviceDealRate?: number; interviewRate?: number; hireRate?: number },
): string => {
  if (siteType === "b2b_lead") {
    if ((derived.cvr ?? 0) < 0.02) return "改善優先度: まずはLPや訴求の見直しでCVR改善を優先したい状態です。";
    if ((derived.meetingRate ?? 0) < 0.2) return "改善優先度: リード後の商談化件数を増やす導線改善を優先して見たい状態です。";
    return "改善優先度: 受注件数につながる営業接続や歩留まりを先に確認したい状態です。";
  }

  if (siteType === "service_site") {
    if ((derived.cvr ?? 0) < 0.02) return "改善優先度: まずはCVR改善を優先し、獲得効率の前提を整えたい状態です。";
    if ((derived.serviceDealRate ?? 0) < 0.15) return "改善優先度: 成約件数が伸びにくく、広告より後工程の改善が効きやすい状態です。";
    return "改善優先度: 訴求と営業接続の両面を見直して、成約単価を下げたい状態です。";
  }

  if (siteType === "ec_site") {
    if ((derived.cvr ?? 0) < 0.02) return "改善優先度: 商品訴求やLP改善でCVRを底上げする優先度が高い状態です。";
    return "改善優先度: CPCと商品別配分を見直し、粗利ベースROASを優先して改善したい状態です。";
  }

  if ((derived.interviewRate ?? 0) < 0.3) {
    return "改善優先度: 応募後の面接化率改善を先に見たい状態です。";
  }
  if ((derived.cvr ?? 0) < 0.02) {
    return "改善優先度: まずは応募率改善を優先して、母集団形成の前提を整えたい状態です。";
  }
  return "改善優先度: 求人訴求と採用率の改善を優先して見たい状態です。";
};

const auditSimulationB2B = (values: AdBudgetInputValues): AdBudgetSimulationResult => {
  const cpc = safeDivide(values.monthlyBudget ?? 0, values.clicks ?? 0);
  const cvr = safeDivide(values.leads ?? 0, values.clicks ?? 0);
  const meetings = values.meetingCount ?? 0;
  const orders = values.orderCount ?? 0;
  const cpa = safeDivide(values.monthlyBudget ?? 0, values.leads ?? 0);
  const meetingCost = safeDivide(values.monthlyBudget ?? 0, meetings);
  const orderCost = safeDivide(values.monthlyBudget ?? 0, orders);
  const revenue = orders * (values.averageOrderValue ?? 0);
  const grossProfit = revenue * percent(values.grossMargin);
  const grossAdRatio = safeDivide(values.monthlyBudget ?? 0, grossProfit);
  const status: AdBudgetAuditStatus =
    grossAdRatio <= 0.3 ? "good" : grossAdRatio <= 0.5 ? "caution" : "strict";
  const message = getAuditMessage("b2b_lead", status);

  return {
    siteType: "b2b_lead",
    mode: "audit",
    status,
    statusLabel: statusLabelMap[status],
    resultTitle: message.title,
    summary: message.summary,
    primaryMetrics: [
      { label: "現在のCPC", value: cpc, format: "currency" },
      { label: "現在のCVR", value: cvr * 100, format: "percent" },
      { label: "現在のCPA", value: cpa, format: "currency" },
      { label: "商談獲得単価", value: meetingCost, format: "currency" },
      { label: "受注獲得単価", value: orderCost, format: "currency" },
    ],
    secondaryMetrics: [
      { label: "想定商談件数", value: meetings, format: "count" },
      { label: "想定受注件数", value: orders, format: "count" },
      { label: "想定売上", value: revenue, format: "currency" },
      { label: "想定粗利", value: grossProfit, format: "currency" },
      { label: "粗利広告比率", value: grossAdRatio * 100, format: "percent" },
    ],
    referenceCards: [
      {
        title: "理想目安",
        valueLabel: "粗利広告比率",
        value: 30,
        format: "percent",
        description: "まずは粗利の30%以内に収まるかをひとつの目安にします。",
      },
      {
        title: "現在値",
        valueLabel: "粗利広告比率",
        value: grossAdRatio * 100,
        format: "percent",
        description: "現在の広告費が粗利に対してどれくらいの重さかを見ています。",
      },
      {
        title: "受注獲得単価",
        valueLabel: "現在の受注獲得単価",
        value: orderCost,
        format: "currency",
        description: "CPAだけでなく、受注獲得単価まで見ると広告費の成立しやすさが見えやすくなります。",
      },
    ],
    referenceNote:
      "※ 粗利広告比率30%は一般的な簡易目安です。商材の粗利構造やLTV、固定費によって適正水準は変わります。",
    insightPoints: [...message.insights, ...buildAuditInsights("b2b_lead", status, values)].slice(0, 5),
    recommendedActions: buildAuditActions("b2b_lead", status),
    differenceText: auditDifferenceText("b2b_lead", grossAdRatio, 0.3),
    priorityText: auditPriorityText("b2b_lead", values, {
      cvr,
      meetingRate: safeDivide(meetings, values.leads ?? 0),
      closeRate: safeDivide(orders, meetings),
    }),
  };
};

const auditSimulationService = (values: AdBudgetInputValues): AdBudgetSimulationResult => {
  const cpc = safeDivide(values.monthlyBudget ?? 0, values.clicks ?? 0);
  const cvr = safeDivide(values.cvs ?? 0, values.clicks ?? 0);
  const cpa = safeDivide(values.monthlyBudget ?? 0, values.cvs ?? 0);
  const deals = values.dealCount ?? 0;
  const dealCost = safeDivide(values.monthlyBudget ?? 0, deals);
  const revenue = deals * (values.averageDealValue ?? 0);
  const grossProfit = revenue * percent(values.grossMargin);
  const grossAdRatio = safeDivide(values.monthlyBudget ?? 0, grossProfit);
  const roas = safeDivide(revenue, values.monthlyBudget ?? 0);
  const status: AdBudgetAuditStatus =
    deals <= 0 || revenue <= 0 || grossProfit <= 0
      ? "strict"
      : grossAdRatio <= 0.3
        ? "good"
        : grossAdRatio <= 0.5
          ? "caution"
          : "strict";
  const message = getAuditMessage("service_site", status);

  return {
    siteType: "service_site",
    mode: "audit",
    status,
    statusLabel: statusLabelMap[status],
    resultTitle: message.title,
    summary: message.summary,
    primaryMetrics: [
      { label: "現在のCPC", value: cpc, format: "currency" },
      { label: "現在のCVR", value: cvr * 100, format: "percent" },
      { label: "現在のCPA", value: cpa, format: "currency" },
      { label: "成約単価", value: dealCost, format: "currency" },
      { label: "ROAS", value: roas * 100, format: "percent" },
    ],
    secondaryMetrics: [
      { label: "想定成約件数", value: deals, format: "count" },
      { label: "想定売上", value: revenue, format: "currency" },
      { label: "想定粗利", value: grossProfit, format: "currency" },
      { label: "粗利広告比率", value: grossAdRatio * 100, format: "percent" },
    ],
    referenceCards: [
      {
        title: "理想目安",
        valueLabel: "粗利広告比率",
        value: 30,
        format: "percent",
        description: "まずは粗利の30%以内をひとつの目安に見ると判断しやすくなります。",
      },
      {
        title: "現在値",
        valueLabel: "粗利広告比率",
        value: grossAdRatio * 100,
        format: "percent",
        description: "今の広告費が粗利に対してどれくらいの重さかを見ています。",
      },
      {
        title: "成約単価",
        valueLabel: "現在の成約単価",
        value: dealCost,
        format: "currency",
        description: "CPAだけでなく成約単価まで含めて見ると、余裕の有無が見えやすくなります。",
      },
    ],
    referenceNote:
      "※ 粗利広告比率30%は一般的な簡易目安です。業種や利益構造、LTVによって適正な水準は変わります。",
    insightPoints: [...message.insights, ...buildAuditInsights("service_site", status, values)].slice(0, 5),
    recommendedActions: buildAuditActions("service_site", status),
    differenceText: auditDifferenceText("service_site", grossAdRatio, 0.3),
    priorityText: auditPriorityText("service_site", values, { cvr, serviceDealRate: safeDivide(deals, values.cvs ?? 0) }),
  };
};

const auditSimulationEc = (values: AdBudgetInputValues): AdBudgetSimulationResult => {
  const cpc = safeDivide(values.monthlyBudget ?? 0, values.clicks ?? 0);
  const cvr = safeDivide(values.purchases ?? 0, values.clicks ?? 0);
  const cpa = safeDivide(values.monthlyBudget ?? 0, values.purchases ?? 0);
  const revenue = (values.purchases ?? 0) * (values.averageOrderAmount ?? 0);
  const grossProfit = revenue * percent(values.grossMargin);
  const roas = safeDivide(revenue, values.monthlyBudget ?? 0);
  const grossRoas = safeDivide(grossProfit, values.monthlyBudget ?? 0);
  const ltvRevenue = values.ltv ? (values.purchases ?? 0) * values.ltv : 0;
  const ltvRoas = values.ltv ? safeDivide(ltvRevenue, values.monthlyBudget ?? 0) : 0;
  const status: AdBudgetAuditStatus =
    (values.purchases ?? 0) <= 0 || revenue <= 0 || grossProfit <= 0
      ? "strict"
      : grossRoas > 1.5
        ? "good"
        : grossRoas >= 1.0
          ? "caution"
          : "strict";
  const message = getAuditMessage("ec_site", status);

  return {
    siteType: "ec_site",
    mode: "audit",
    status,
    statusLabel: statusLabelMap[status],
    resultTitle: message.title,
    summary: message.summary,
    primaryMetrics: [
      { label: "現在のCPC", value: cpc, format: "currency" },
      { label: "現在のCVR", value: cvr * 100, format: "percent" },
      { label: "現在のCPA", value: cpa, format: "currency" },
      { label: "ROAS", value: roas * 100, format: "percent" },
      { label: "粗利ベースROAS", value: grossRoas * 100, format: "percent" },
    ],
    secondaryMetrics: [
      { label: "想定売上", value: revenue, format: "currency" },
      { label: "想定粗利", value: grossProfit, format: "currency" },
      ...(values.ltv
        ? [
            { label: "想定LTV売上", value: ltvRevenue, format: "currency" as const },
            { label: "LTVベースROAS", value: ltvRoas * 100, format: "percent" as const },
          ]
        : []),
    ],
    referenceCards: [
      {
        title: "理想目安",
        valueLabel: "粗利ベースROAS",
        value: 150,
        format: "percent",
        description: "まずは粗利ベースで150%をひとつの目安に見ると判断しやすくなります。",
      },
      {
        title: "現在値",
        valueLabel: "粗利ベースROAS",
        value: grossRoas * 100,
        format: "percent",
        description: "売上ではなく粗利で見たときの回収感を表しています。",
      },
      {
        title: "CPA",
        valueLabel: "現在のCPA",
        value: cpa,
        format: "currency",
        description: "CPAが許容範囲かを、粗利率やLTVも含めて見るのがおすすめです。",
      },
    ],
    referenceNote:
      "※ 粗利ベースROAS 150% は一般的な簡易目安です。商材の粗利率やLTV、固定費の重さによって適正水準は変わります。",
    insightPoints: [...message.insights, ...buildAuditInsights("ec_site", status, values)].slice(0, 5),
    recommendedActions: buildAuditActions("ec_site", status),
    differenceText: auditDifferenceText("ec_site", grossRoas, 1.5),
    priorityText: auditPriorityText("ec_site", values, { cvr }),
  };
};

const auditSimulationRecruit = (values: AdBudgetInputValues): AdBudgetSimulationResult => {
  const cpc = safeDivide(values.monthlyBudget ?? 0, values.clicks ?? 0);
  const cvr = safeDivide(values.applications ?? 0, values.clicks ?? 0);
  const interviews = values.interviewCount ?? 0;
  const hires = values.hireCount ?? 0;
  const applicationCost = safeDivide(values.monthlyBudget ?? 0, values.applications ?? 0);
  const interviewCost = safeDivide(values.monthlyBudget ?? 0, interviews);
  const hireCost = safeDivide(values.monthlyBudget ?? 0, hires);
  const allowableHireCost = values.allowableHireCost ?? 0;
  const status: AdBudgetAuditStatus =
    hires <= 0
      ? "strict"
      : hireCost <= allowableHireCost
      ? "good"
      : hireCost <= allowableHireCost * 1.2
        ? "caution"
        : "strict";
  const message = getAuditMessage("recruit_site", status);

  return {
    siteType: "recruit_site",
    mode: "audit",
    status,
    statusLabel: statusLabelMap[status],
    resultTitle: message.title,
    summary: message.summary,
    primaryMetrics: [
      { label: "現在のCPC", value: cpc, format: "currency" },
      { label: "現在のCVR", value: cvr * 100, format: "percent" },
      { label: "応募単価", value: applicationCost, format: "currency" },
      { label: "面接単価", value: interviewCost, format: "currency" },
      { label: "採用単価", value: hireCost, format: "currency" },
    ],
    secondaryMetrics: [
      { label: "想定面接数", value: interviews, format: "count" },
      { label: "想定採用数", value: hires, format: "count" },
      { label: "許容採用コスト", value: allowableHireCost, format: "currency" },
    ],
    referenceCards: [
      {
        title: "理想目安",
        valueLabel: "許容採用コスト",
        value: allowableHireCost,
        format: "currency",
        description: "まずは1名採用あたりの許容コスト以内に収まるかを見ます。",
      },
      {
        title: "現在値",
        valueLabel: "現在の採用単価",
        value: hireCost,
        format: "currency",
        description: "応募数だけでなく、採用単価まで見て判断するのがおすすめです。",
      },
      {
        title: "応募単価",
        valueLabel: "現在の応募単価",
        value: applicationCost,
        format: "currency",
        description: "応募単価と採用単価の差を見ると、後工程の改善余地を見つけやすくなります。",
      },
    ],
    insightPoints: [...message.insights, ...buildAuditInsights("recruit_site", status, values)].slice(0, 5),
    recommendedActions: buildAuditActions("recruit_site", status),
    differenceText: auditDifferenceText("recruit_site", hireCost, allowableHireCost),
    priorityText: auditPriorityText("recruit_site", values, {
      cvr,
      interviewRate: safeDivide(interviews, values.applications ?? 0),
      hireRate: safeDivide(hires, interviews),
    }),
  };
};

export const simulateAdBudget = (
  siteType: AdBudgetSiteType,
  mode: AdBudgetMode,
  values: AdBudgetInputValues,
): AdBudgetSimulationResult => {
  if (mode === "goal") {
    if (siteType === "b2b_lead") return goalSimulationB2B(values);
    if (siteType === "service_site") return goalSimulationService(values);
    if (siteType === "ec_site") return goalSimulationEc(values);
    return goalSimulationRecruit(values);
  }

  if (siteType === "b2b_lead") return auditSimulationB2B(values);
  if (siteType === "service_site") return auditSimulationService(values);
  if (siteType === "ec_site") return auditSimulationEc(values);
  return auditSimulationRecruit(values);
};
