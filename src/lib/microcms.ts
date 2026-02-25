const serviceDomain = import.meta.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = import.meta.env.MICROCMS_API_KEY;

const endpoint = "column";

type QueryValue = string | number | boolean | undefined;

export type MicroCMSImage = {
  url: string;
  width?: number;
  height?: number;
};

export type ColumnCategory = {
  id: string;
  name?: string;
  title?: string;
  label?: string;
};

export type ColumnContent = {
  id: string;
  title: string;
  content: string;
  eyecatch?: MicroCMSImage;
  category?: ColumnCategory | string | null;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  revisedAt: string;
};

type ListResponse<T> = {
  contents: T[];
  totalCount: number;
  offset: number;
  limit: number;
};

const ensureConfig = () => {
  if (!serviceDomain || !apiKey) {
    throw new Error("microCMS env vars are missing.");
  }
};

const createUrl = (path: string, query: Record<string, QueryValue> = {}) => {
  ensureConfig();
  const url = new URL(`https://${serviceDomain}.microcms.io/api/v1/${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    url.searchParams.set(key, String(value));
  });
  return url;
};

const request = async <T>(path: string, query?: Record<string, QueryValue>) => {
  const url = createUrl(path, query);
  const res = await fetch(url, {
    headers: { "X-MICROCMS-API-KEY": apiKey! }
  });
  if (!res.ok) {
    throw new Error(`microCMS request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
};

export const getCategoryLabel = (category?: ColumnContent["category"]) => {
  if (!category) return "";
  if (typeof category === "string") return category;
  if (Array.isArray(category)) return "";
  return category.name ?? category.title ?? category.label ?? category.id ?? "";
};

export const getEyecatchUrl = (eyecatch: unknown) => {
  if (!eyecatch) return "";
  if (typeof eyecatch === "string") return eyecatch;
  if (typeof eyecatch === "object" && "url" in eyecatch) {
    const candidate = (eyecatch as { url?: unknown }).url;
    return typeof candidate === "string" ? candidate : "";
  }
  return "";
};

export const formatDateJa = (date: string | undefined) => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

export const getPublishedColumns = async () => {
  const data = await request<ListResponse<ColumnContent>>(endpoint, {
    orders: "-publishedAt",
    limit: 100,
    depth: 1
  });
  return data.contents;
};

export const getColumnBySlug = async (slug: string, draftKey?: string) => {
  try {
    const data = await request<ListResponse<ColumnContent>>(endpoint, {
      filters: `slug[equals]${slug}`,
      limit: 1,
      depth: 1,
      draftKey
    });
    if (data.contents[0]) return data.contents[0];
  } catch {
    // Fall through to a broader fetch when filters fail (field mismatch etc.)
  }

  const fallback = await request<ListResponse<ColumnContent>>(endpoint, {
    limit: 100,
    depth: 1,
    draftKey
  });
  return fallback.contents.find((item) => item.slug === slug) ?? null;
};

export const getColumnById = async (contentId: string, draftKey: string) => {
  return request<ColumnContent>(`${endpoint}/${contentId}`, {
    draftKey,
    depth: 1
  });
};
