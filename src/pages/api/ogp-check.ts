import type { APIRoute } from "astro";
import * as dns from "node:dns/promises";
import * as net from "node:net";

const REQUEST_TIMEOUT_MS = 8000;
const MAX_CONTENT_LENGTH = 2 * 1024 * 1024;
const FETCH_USER_AGENT =
  "InsightBase OGP Checker/1.0 (+https://insightbase.jp/tools/ogp-checker)";

const isPrivateIpv4 = (ip: string) => {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;

  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
};

const isPrivateIpv6 = (ip: string) => {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
};

const decodeHtml = (value: string) =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ")
    .trim();

const extractTitle = (html: string) => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1].replace(/\s+/g, " ")) : "";
};

const extractMetaMap = (html: string) => {
  const metaMap = new Map<string, string>();
  const tags = html.match(/<meta\s+[^>]*>/gi) ?? [];

  tags.forEach((tag) => {
    const attrs = new Map<string, string>();
    const attrRegex = /([:@\w-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
    let attrMatch;

    while ((attrMatch = attrRegex.exec(tag)) !== null) {
      const name = attrMatch[1].toLowerCase();
      const value = attrMatch[3] ?? attrMatch[4] ?? attrMatch[5] ?? "";
      attrs.set(name, decodeHtml(value));
    }

    const key = attrs.get("property") ?? attrs.get("name");
    const content = attrs.get("content") ?? "";

    if (key && content && !metaMap.has(key.toLowerCase())) {
      metaMap.set(key.toLowerCase(), content);
    }
  });

  return metaMap;
};

const resolveMaybeRelativeUrl = (value: string, baseUrl: URL) => {
  if (!value) {
    return { value: "", wasRelative: false };
  }

  try {
    const resolved = new URL(value, baseUrl).toString();
    const wasRelative = !/^https?:\/\//i.test(value);
    return { value: resolved, wasRelative };
  } catch {
    return { value, wasRelative: false };
  }
};

const createCheck = (label: string, state: "success" | "warning" | "info", message: string) => ({
  label,
  state,
  message,
});

const validateTargetUrl = async (input: string) => {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error("URL の形式が正しくありません。`https://` または `http://` から始まるURLを入力してください。");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("`http` または `https` のURLのみ確認できます。");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (["localhost", "127.0.0.1", "::1"].includes(hostname) || hostname.endsWith(".local")) {
    throw new Error("localhost や内部向けURLは確認できません。");
  }

  if (net.isIP(hostname)) {
    if (isPrivateIpv4(hostname) || isPrivateIpv6(hostname)) {
      throw new Error("内部ネットワーク向けのURLは確認できません。");
    }
    return parsed;
  }

  try {
    const resolved = await dns.lookup(hostname, { all: true });
    const hasPrivateAddress = resolved.some((item) =>
      item.family === 4 ? isPrivateIpv4(item.address) : isPrivateIpv6(item.address)
    );

    if (hasPrivateAddress) {
      throw new Error("内部ネットワーク向けのURLは確認できません。");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("内部ネットワーク")) {
      throw error;
    }
  }

  return parsed;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const targetUrl = typeof body.url === "string" ? body.url.trim() : "";

    if (!targetUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "URL を入力してください。",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const parsedUrl = await validateTargetUrl(targetUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(parsedUrl.toString(), {
        method: "GET",
        headers: {
          "User-Agent": FETCH_USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `対象URLの取得に失敗しました。ステータス: ${response.status}`,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "HTML ページ以外は確認できません。",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (contentLength > MAX_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "対象ページのサイズが大きいため確認できませんでした。",
        }),
        { status: 413, headers: { "Content-Type": "application/json" } }
      );
    }

    const html = (await response.text()).slice(0, MAX_CONTENT_LENGTH);
    const metaMap = extractMetaMap(html);
    const title = extractTitle(html);
    const description = metaMap.get("description") ?? "";
    const finalUrl = new URL(response.url || parsedUrl.toString());

    const ogImage = resolveMaybeRelativeUrl(metaMap.get("og:image") ?? "", finalUrl);
    const twitterImage = resolveMaybeRelativeUrl(metaMap.get("twitter:image") ?? "", finalUrl);
    const ogUrl = resolveMaybeRelativeUrl(metaMap.get("og:url") ?? "", finalUrl);

    const result = {
      success: true,
      requestedUrl: parsedUrl.toString(),
      finalUrl: finalUrl.toString(),
      fetchedAt: new Date().toISOString(),
      basic: {
        title,
        description,
      },
      ogp: {
        title: metaMap.get("og:title") ?? "",
        description: metaMap.get("og:description") ?? "",
        image: ogImage.value,
        rawImage: metaMap.get("og:image") ?? "",
        imageWasRelative: ogImage.wasRelative,
        url: ogUrl.value,
        rawUrl: metaMap.get("og:url") ?? "",
        type: metaMap.get("og:type") ?? "",
        siteName: metaMap.get("og:site_name") ?? "",
        locale: metaMap.get("og:locale") ?? "",
      },
      twitter: {
        card: metaMap.get("twitter:card") ?? "",
        title: metaMap.get("twitter:title") ?? "",
        description: metaMap.get("twitter:description") ?? "",
        image: twitterImage.value,
        rawImage: metaMap.get("twitter:image") ?? "",
        imageWasRelative: twitterImage.wasRelative,
        site: metaMap.get("twitter:site") ?? "",
      },
    };

    const checks = [];

    checks.push(
      result.ogp.title
        ? createCheck("og:title", "success", "設定されています")
        : createCheck("og:title", "warning", "未設定です")
    );
    checks.push(
      result.ogp.description
        ? createCheck("og:description", "success", "設定されています")
        : createCheck("og:description", "warning", "未設定です")
    );
    checks.push(
      result.ogp.image
        ? createCheck(
            "og:image",
            result.ogp.imageWasRelative ? "warning" : "success",
            result.ogp.imageWasRelative
              ? "要確認。画像URLが相対パスだったため絶対URLに補完して表示しています"
              : "設定されています"
          )
        : createCheck("og:image", "warning", "未設定です")
    );
    checks.push(
      result.twitter.card
        ? createCheck("twitter:card", "success", "設定されています")
        : createCheck("twitter:card", "warning", "未設定です")
    );

    if (result.basic.title && !result.ogp.title) {
      checks.push(createCheck("補足", "info", "title はありますが og:title は未設定です"));
    }
    if (result.basic.description && !result.ogp.description) {
      checks.push(
        createCheck("補足", "info", "meta description はありますが og:description は未設定です")
      );
    }
    if (result.ogp.title.length > 70) {
      checks.push(createCheck("参考", "info", "og:title がやや長めです。表示上の収まりを確認してください"));
    }
    if (result.ogp.description.length > 140) {
      checks.push(
        createCheck("参考", "info", "og:description がやや長めです。SNSごとの表示差を確認してください")
      );
    }
    if (!result.ogp.image && result.twitter.image) {
      checks.push(createCheck("補足", "info", "OGP画像は未設定ですが、Twitter画像は設定されています"));
    }
    checks.push(
      createCheck(
        "補足",
        "info",
        "実際のSNS表示は各サービスの仕様やキャッシュによりすぐ反映されない場合があります"
      )
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...result,
          previewImage: result.ogp.image || result.twitter.image || "",
          checks,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "取得がタイムアウトしました。時間をおいて再度お試しください。"
        : error instanceof Error
          ? error.message
          : "対象サイトの設定により取得できない場合があります。";

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
