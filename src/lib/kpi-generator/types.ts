import type {
  currentIssueOptions,
  evaluationAxisOptions,
  outcomeOptions,
  sitePurposeOptions,
  siteTypeOptions,
  toolOptions,
  trafficSourceOptions,
} from "./options";

export type SitePurpose = (typeof sitePurposeOptions)[number];
export type SiteType = (typeof siteTypeOptions)[number];
export type TrafficSource = (typeof trafficSourceOptions)[number];
export type EvaluationAxis = (typeof evaluationAxisOptions)[number];
export type CurrentIssue = (typeof currentIssueOptions)[number];
export type Outcome = (typeof outcomeOptions)[number];
export type ToolName = (typeof toolOptions)[number];

export type ScenarioKey =
  | "btob_lead"
  | "document_request"
  | "ecommerce"
  | "owned_media"
  | "recruit"
  | "reservation"
  | "lp";

export interface KpiGeneratorInput {
  sitePurpose: SitePurpose;
  siteType: SiteType;
  trafficSources: TrafficSource[];
  evaluationAxes: EvaluationAxis[];
  currentIssue: CurrentIssue;
  outcomes: Outcome[];
  tools: ToolName[];
}

export interface ScenarioDefinition {
  key: ScenarioKey;
  label: string;
  summary: string;
  kgiBase: string;
  primaryKpis: string[];
  supportKpis: string[];
  viewOrder: string[];
  reportItems: string[];
  advice: string;
}

export interface KpiGeneratorResult {
  scenarioKey: ScenarioKey;
  scenarioLabel: string;
  summary: string;
  kgi: string;
  primaryKpis: string[];
  supportKpis: string[];
  viewOrder: string[];
  reportItems: string[];
  advice: string;
}
