import { scenarioDefinitions } from "./scenarios";
import type {
  EvaluationAxis,
  KpiGeneratorInput,
  KpiGeneratorResult,
  Outcome,
  ScenarioKey,
  SitePurpose,
  ToolName,
  TrafficSource,
} from "./types";

const unique = (items: string[]) => [...new Set(items)];

const resolveScenarioKey = ({ sitePurpose, siteType }: KpiGeneratorInput): ScenarioKey => {
  if (siteType === "ECサイト") return "ecommerce";
  if (siteType === "採用サイト" || sitePurpose === "採用応募を増やしたい") return "recruit";
  if (siteType === "オウンドメディア" || sitePurpose === "認知を広げたい") return "owned_media";
  if (sitePurpose === "来店予約を増やしたい") return "reservation";
  if (siteType === "LP単体") return "lp";
  if (sitePurpose === "資料請求を増やしたい") return "document_request";
  return "btob_lead";
};

const purposeKgiMap: Record<SitePurpose, string> = {
  "問い合わせを増やしたい": "月間問い合わせ完了数を増やす",
  "資料請求を増やしたい": "月間資料請求完了数を増やす",
  "来店予約を増やしたい": "月間予約完了数を増やす",
  "購入数を増やしたい": "月間購入完了数を増やす",
  "売上を伸ばしたい": "月間売上を伸ばす",
  "認知を広げたい": "成果につながる集客量を増やす",
  "採用応募を増やしたい": "月間応募完了数を増やす",
};

const trafficSourceSupportMap: Record<TrafficSource, string[]> = {
  "自然検索": ["自然検索流入数", "表示回数", "CTR", "平均掲載順位"],
  "Google広告": ["Google広告費", "Google広告CV数", "Google広告CPA", "Google広告CTR"],
  "Meta広告": ["Meta広告費", "Meta広告CV数", "Meta広告CPA", "Meta広告CTR"],
  "Yahoo広告": ["Yahoo広告費", "Yahoo広告CV数", "Yahoo広告CPA", "Yahoo広告CTR"],
  "SNS自然流入": ["SNS自然流入数", "SNS投稿経由CV数", "SNS流入のCVR"],
  "メルマガ": ["メルマガ経由セッション数", "メルマガ経由CV数", "クリック率"],
  "外部サイト・紹介": ["紹介流入数", "紹介流入のCVR", "掲載元別セッション数"],
  "直接流入": ["直接流入数", "リピーター比率", "直接流入のCVR"],
};

const trafficSourceReportMap: Record<TrafficSource, string[]> = {
  "自然検索": ["検索クエリ別クリック数", "ランディングページ別自然検索流入"],
  "Google広告": ["キャンペーン別CV数", "広告グループ別CPA"],
  "Meta広告": ["広告セット別CV数", "クリエイティブ別CTR"],
  "Yahoo広告": ["キャンペーン別CV数", "配信面別CPA"],
  "SNS自然流入": ["投稿別流入数", "SNS経由CV数"],
  "メルマガ": ["配信別クリック率", "メルマガ経由CV数"],
  "外部サイト・紹介": ["紹介元別流入", "紹介元別CV数"],
  "直接流入": ["直接流入数", "再訪ユーザー数"],
};

const outcomeSupportMap: Record<Outcome, string[]> = {
  "問い合わせ完了": ["問い合わせ完了数"],
  "資料請求完了": ["資料請求完了数"],
  "購入完了": ["購入完了数", "購入単価"],
  "予約完了": ["予約完了数"],
  "電話クリック": ["電話クリック数"],
  "LINE追加": ["LINE追加数"],
  "メルマガ登録": ["メルマガ登録数"],
  "まだ決めていない": ["主要成果の定義整理"],
};

const buildIssueAdvice = (issue: KpiGeneratorInput["currentIssue"]) => {
  switch (issue) {
    case "何を見ればよいかわからない":
      return "まずは KGI と主要KPI を 3〜4個に絞り、毎月見る順番を固定すると判断しやすくなります。";
    case "数字はあるが改善点がわからない":
      return "成果数だけでなく、チャネル別CVRやLP別の歩留まりを並べると改善点が見つかりやすくなります。";
    case "CVはあるが流入評価がしづらい":
      return "CV数だけでなく、チャネル別のCVR・CPA・流入量をセットで見ると評価しやすくなります。";
    case "レポートがごちゃごちゃしている":
      return "レポートはKGI、主要KPI、補助KPIの順で分けると見やすくなります。";
    case "クライアントに説明しづらい":
      return "成果→流入→導線の順で説明すると、数字のつながりが伝わりやすくなります。";
    case "LPのどこが弱いかわからない":
      return "LP単位のCVRに加えて、CTAクリックやスクロール到達率も並べると弱点が見つかりやすくなります。";
  }
};

const buildToolAdvice = (tools: ToolName[]) => {
  if (tools.includes("まだほとんど使っていない")) {
    return "まずは GA4 で成果計測を安定させ、レポートに載せる指標を少数に絞るところから始めるのがおすすめです。";
  }

  const notes: string[] = [];
  if (tools.includes("Search Console")) {
    notes.push("Search Console を使っているなら、自然検索の表示回数やCTRも一緒に載せると流入評価がしやすくなります。");
  }
  if (tools.includes("Looker Studio")) {
    notes.push("Looker Studio を使っているなら、今回の主要KPIだけを先頭ページにまとめると報告しやすくなります。");
  }
  if (tools.includes("Googleタグマネージャー")) {
    notes.push("GTM を使っているなら、補助KPIのイベント計測も整理しやすい状態です。");
  }

  return notes.join(" ");
};

const axisPriorityMap: Record<EvaluationAxis, string[]> = {
  "件数を増やしたい": ["問い合わせ完了数", "資料請求完了数", "予約完了数", "購入完了数", "応募完了数", "成果完了数", "セッション数"],
  "CVRを改善したい": ["CVR", "LP別CVR", "流入チャネル別CVR", "広告別CVR"],
  "CPAを下げたい": ["CPA", "Google広告CPA", "Meta広告CPA", "Yahoo広告CPA", "ROAS"],
  "売上を伸ばしたい": ["売上", "購入完了数", "平均注文単価", "ROAS", "チャネル別売上"],
  "質の高い見込み客を増やしたい": ["有効商談数", "問い合わせ完了数", "資料請求完了数", "流入チャネル別CV数"],
  "レポートをわかりやすくしたい": ["問い合わせ完了数", "資料請求完了数", "予約完了数", "購入完了数", "応募完了数", "CVR"],
};

const reorderByAxes = (items: string[], axes: EvaluationAxis[]) => {
  const weightMap = new Map<string, number>();

  axes.forEach((axis, axisIndex) => {
    axisPriorityMap[axis].forEach((item, itemIndex) => {
      if (!weightMap.has(item)) {
        weightMap.set(item, axisIndex * 100 + itemIndex);
      }
    });
  });

  return [...items].sort((a, b) => {
    const weightA = weightMap.get(a) ?? 9999;
    const weightB = weightMap.get(b) ?? 9999;
    return weightA - weightB;
  });
};

const buildOutcomeAdvice = (outcomes: Outcome[]) => {
  if (!outcomes.length || outcomes.includes("まだ決めていない")) {
    return "成果地点がまだ曖昧なら、まずは何をCVとして扱うかを先に固めるのがおすすめです。";
  }

  return "";
};

export const generateKpiPlan = (input: KpiGeneratorInput): KpiGeneratorResult => {
  const scenarioKey = resolveScenarioKey(input);
  const scenario = scenarioDefinitions[scenarioKey];

  const primaryKpis = reorderByAxes(scenario.primaryKpis, input.evaluationAxes);

  const supportKpis = unique([
    ...scenario.supportKpis,
    ...input.trafficSources.flatMap((source) => trafficSourceSupportMap[source] ?? []),
    ...input.outcomes.flatMap((outcome) => outcomeSupportMap[outcome] ?? []),
  ]);

  const reportItems = unique([
    ...scenario.reportItems,
    ...input.trafficSources.flatMap((source) => trafficSourceReportMap[source] ?? []),
  ]);

  const kgi =
    input.sitePurpose === "売上を伸ばしたい" && scenarioKey === "ecommerce"
      ? "月間売上と購入完了数を伸ばしつつ、ROAS も改善する"
      : input.evaluationAxes.includes("質の高い見込み客を増やしたい") && scenarioKey === "btob_lead"
        ? "月間問い合わせ完了数を増やしつつ、有効商談につながる見込み客比率を高める"
        : purposeKgiMap[input.sitePurpose] || scenario.kgiBase;

  const adviceParts = [
    scenario.advice,
    buildIssueAdvice(input.currentIssue),
    buildOutcomeAdvice(input.outcomes),
    buildToolAdvice(input.tools),
  ].filter(Boolean);

  const viewOrder = unique([
    ...scenario.viewOrder,
    input.evaluationAxes.includes("レポートをわかりやすくしたい")
      ? "最後にレポートは主要KPI 3〜5項目に絞って整理する"
      : "",
  ].filter(Boolean));

  return {
    scenarioKey,
    scenarioLabel: scenario.label,
    summary: scenario.summary,
    kgi,
    primaryKpis,
    supportKpis,
    viewOrder,
    reportItems,
    advice: adviceParts.join(" "),
  };
};
