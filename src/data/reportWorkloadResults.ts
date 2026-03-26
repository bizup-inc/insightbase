import type {
  ReportWorkloadCtaKey,
  ReportWorkloadResultKey,
  ReportWorkloadResultTemplate,
} from "../utils/reportWorkloadTypes";

export const REPORT_WORKLOAD_CTA_LINKS: Record<
  ReportWorkloadCtaKey,
  {
    title: string;
    href: string;
    imageSrc: string;
    imageAlt: string;
    price: string;
    buttonLabel: string;
    buttonClass: string;
    dataProduct: string;
  }
> = {
  ga4_template: {
    title: "GA4レポートテンプレート",
    href: "/ga4-report-template",
    imageSrc: "/assets/img/screenshot/image03.jpg",
    imageAlt: "GA4レポートテンプレート",
    price: "17,600円（税込）",
    buttonLabel: "今すぐ購入する",
    buttonClass: "herobtn btn--green btn--cubic-green",
    dataProduct: "ga4cta",
  },
  google_ads_template: {
    title: "Google広告レポート",
    href: "/googlead-report-template",
    imageSrc: "/assets/img/screenshot/image07.jpg",
    imageAlt: "Google広告レポートテンプレート",
    price: "17,600円（税込）",
    buttonLabel: "今すぐ購入する",
    buttonClass: "herobtn btn--blue btn--cubic-blue",
    dataProduct: "gadcta",
  },
};

export const reportWorkloadResultTemplates: Record<
  ReportWorkloadResultKey,
  ReportWorkloadResultTemplate
> = {
  high: {
    resultTitle: "かなり工数を使っている可能性があります",
    leadMessage:
      "数字を集めて整える作業に、想像以上の時間を使っている状態です。本来は分析や改善提案に使える時間が、毎月の転記・加工・貼り付け作業に消えている可能性があります。",
    insightPoints: [
      "手作業の工程が多いほど、見えない確認作業や整形作業も増えやすくなります。",
      "件数が増えるほど、同じ作業の繰り返しが月間工数を押し上げやすくなります。",
      "テンプレート化で集計・整形・見せ方をまとめて減らしやすい状態です。",
    ],
    recommendedActions: [
      "まずは毎月繰り返している作業をテンプレートへ置き換える",
      "数字の集計とグラフ作成を分けずに一体で自動化する",
      "レポート作業より分析時間を増やせる運用へ寄せる",
    ],
  },
  medium: {
    resultTitle: "テンプレート化でかなり楽になる可能性があります",
    leadMessage:
      "現時点でも一定の負担がありますが、件数が増えたり資料が増えると作業時間が伸びやすい状態です。今のうちにテンプレート化しておくと、今後の運用がかなり楽になります。",
    insightPoints: [
      "毎月の定型作業を減らせるだけでも、レポート全体の負担はかなり軽くなります。",
      "今は回せていても、案件数が増えると属人的な運用がボトルネックになりやすくなります。",
      "テンプレート化で見せ方を標準化すると、確認や修正の手間も減らしやすくなります。",
    ],
    recommendedActions: [
      "まずは集計やグラフ化など、毎回同じ工程から減らす",
      "提出用のレイアウトを固定して作り直しを減らす",
      "月次作業を分析・提案に回せる形へ整える",
    ],
  },
  low: {
    resultTitle: "比較的整理されていますが、まだ削減余地はあります",
    leadMessage:
      "すでにある程度は整理できていますが、見せ方や標準化を進めることで、さらに安定して短時間で回せる可能性があります。完全自動でなくても、テンプレート化の価値は十分あります。",
    insightPoints: [
      "今の運用が大きく崩れていなくても、標準化すると属人性を減らしやすくなります。",
      "テンプレート化は時間削減だけでなく、レポート品質の安定にもつながります。",
      "案件数が増えたときにも対応しやすい土台を先に作れます。",
    ],
    recommendedActions: [
      "現状の良い運用を崩さず、見せ方だけテンプレート化する",
      "確認しやすい要約ページを作ってレポート品質を安定させる",
      "今後件数が増える前に、手作業の残りを先に減らす",
    ],
  },
};

export const reportWorkloadFaqs = [
  {
    question: "このシミュレーションの時間は実測ですか？",
    answer:
      "実測ではなく、回答内容から月次レポートで発生しやすい隠れ工数も含めて簡易計算した目安です。",
  },
  {
    question: "なぜ自己申告時間より増える場合があるのですか？",
    answer:
      "転記、整形、確認、貼り付け、コメント作成などは、本人が意識している時間より少し多く積み上がることがあるため、軽い補正を入れています。",
  },
  {
    question: "テンプレート化すると本当に時間は減りますか？",
    answer:
      "集計、グラフ化、見せ方の固定化が進むため、毎月繰り返す作業はかなり減らしやすくなります。分析や最終確認の時間は残る前提で計算しています。",
  },
];
