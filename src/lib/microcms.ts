const serviceDomain = import.meta.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = import.meta.env.MICROCMS_API_KEY;

const endpoint = "column";
const categoryEndpoint = "category";

type QueryValue = string | number | boolean | undefined;

const nowIso = () => new Date().toISOString();

const buildPublishedFilter = (extra?: string) => {
  const publishedFilter = `publishedAt[less_than]${nowIso()}`;
  if (!extra) return publishedFilter;
  return `${publishedFilter}[and]${extra}`;
};

const isPublishedNow = (content: Pick<ColumnContent, "publishedAt">) => {
  if (!content.publishedAt) return false;
  const publishedTime = new Date(content.publishedAt).getTime();
  if (Number.isNaN(publishedTime)) return false;
  return publishedTime <= Date.now();
};

export type MicroCMSImage = {
  url: string;
  width?: number;
  height?: number;
};

export type ColumnCategory = {
  id: string;
  slug?: string;
  name?: string;
  title?: string;
  label?: string;
};

export type ColumnTag = {
  id: string;
  name?: string;
  title?: string;
  label?: string;
  slug?: string;
};

export type ColumnContent = {
  id: string;
  title: string;
  content: string;
  eyecatch?: MicroCMSImage;
  category?: ColumnCategory | string | null;
  tag?: ColumnTag[] | ColumnTag | string | null;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  revisedAt: string;
};

export type CategoryContent = {
  id: string;
  name?: string;
  title?: string;
  label?: string;
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

export const getCategoryId = (category?: ColumnContent["category"]) => {
  if (!category || typeof category === "string" || Array.isArray(category)) return "";
  return category.id ?? "";
};

export const getCategorySlug = (category?: ColumnContent["category"]) => {
  if (!category || typeof category === "string" || Array.isArray(category)) return "";
  return category.slug ?? category.id ?? "";
};

export const getTagLabel = (tag?: string) => {
  if (!tag) return "";
  return tag.trim();
};

const getTagLabelFromObject = (tag: ColumnTag) => {
  return tag.name ?? tag.title ?? tag.label ?? tag.slug ?? tag.id ?? "";
};

export const getTagEntries = (tagField?: ColumnContent["tag"]) => {
  if (!tagField) return [] as { id: string; label: string; slug: string }[];

  if (typeof tagField === "string") {
    return tagField
      .split(/[、,]/)
      .map((raw) => raw.trim())
      .filter(Boolean)
      .map((value) => ({ id: value, label: value, slug: value }));
  }

  if (Array.isArray(tagField)) {
    return tagField
      .map((tag) => {
        const id = tag?.id ?? "";
        const label = getTagLabelFromObject(tag);
        const slug = tag?.slug ?? id;
        if (!id || !label || !slug) return null;
        return { id, label, slug };
      })
      .filter((item): item is { id: string; label: string; slug: string } => Boolean(item));
  }

  const id = tagField.id ?? "";
  const label = getTagLabelFromObject(tagField);
  const slug = tagField.slug ?? id;
  if (!id || !label || !slug) return [];
  return [{ id, label, slug }];
};

export const getTagLabels = (tagField?: ColumnContent["tag"]) => {
  return getTagEntries(tagField).map((tag) => tag.label);
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
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).formatToParts(d);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  if (!year || !month || !day) return "";
  return `${year}年${month}月${day}日`;
};

export const getPublishedColumns = async () => {
  const data = await request<ListResponse<ColumnContent>>(endpoint, {
    orders: "-publishedAt",
    limit: 100,
    depth: 1,
    filters: buildPublishedFilter()
  });
  return data.contents;
};

export const getPublishedColumnsByCategory = async (categoryId: string) => {
  const data = await request<ListResponse<ColumnContent>>(endpoint, {
    orders: "-publishedAt",
    limit: 100,
    depth: 1,
    filters: buildPublishedFilter(`category[equals]${categoryId}`)
  });
  return data.contents;
};

export const getPublishedColumnsByTag = async (tag: string) => {
  const data = await request<ListResponse<ColumnContent>>(endpoint, {
    orders: "-publishedAt",
    limit: 100,
    depth: 1,
    filters: buildPublishedFilter(`tag[contains]${tag}`)
  });
  return data.contents;
};

export const getPublishedColumnsByCategorySlug = async (categorySlug: string) => {
  const contents = await getPublishedColumns();
  return contents.filter((item) => getCategorySlug(item.category) === categorySlug);
};

export const getPublishedColumnsByTagSlug = async (tagSlug: string) => {
  const contents = await getPublishedColumns();
  return contents.filter((item) => getTagEntries(item.tag).some((tag) => tag.slug === tagSlug));
};

export const getCategoryById = async (categoryId: string) => {
  return request<CategoryContent>(`${categoryEndpoint}/${categoryId}`);
};

export const getColumnBySlug = async (slug: string, draftKey?: string) => {
  const baseFilter = `slug[equals]${slug}`;
  const filters = draftKey ? baseFilter : buildPublishedFilter(baseFilter);

  try {
    const data = await request<ListResponse<ColumnContent>>(endpoint, {
      filters,
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
  const bySlug = fallback.contents.find((item) => item.slug === slug) ?? null;
  if (!bySlug) return null;
  if (draftKey) return bySlug;
  return isPublishedNow(bySlug) ? bySlug : null;
};

export const getColumnById = async (contentId: string, draftKey?: string) => {
  return request<ColumnContent>(`${endpoint}/${contentId}`, {
    draftKey,
    depth: 1
  });
};
