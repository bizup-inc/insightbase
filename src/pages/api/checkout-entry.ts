import type { APIRoute } from "astro";

const wantsJson = (request: Request) =>
  request.headers.get("accept")?.includes("application/json");

const productLabels: Record<string, string> = {
  ga4: "GA4レポートテンプレート",
  googlead: "Google広告レポートテンプレート",
  set: "GA4＋Google広告レポートテンプレート"
};

export const POST: APIRoute = async ({ request }) => {
  const serviceDomain = import.meta.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = import.meta.env.MICROCMS_API_KEY;

  if (!serviceDomain || !apiKey) {
    return wantsJson(request)
      ? new Response(JSON.stringify({ ok: false, error: "server" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        })
      : new Response(null, { status: 500 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let data: Record<string, unknown> = {};

  try {
    if (contentType.includes("application/json")) {
      data = (await request.json()) ?? {};
    } else {
      const formData = await request.formData();
      data = Object.fromEntries(formData.entries());
    }
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const company = String(data.company ?? "").trim();
  const name = String(data.name ?? "").trim();
  const product = String(data.product ?? "").trim();

  if (!name || !productLabels[product]) {
    return new Response(JSON.stringify({ ok: false, error: "required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const productLabel = productLabels[product];
  const userAgent = request.headers.get("user-agent") ?? "";

  const payload = {
    inquiryType: "製品購入前フォーム",
    company,
    name,
    email: "no-reply@insightbase.jp",
    message: `購入前フォーム送信\n商品: ${productLabel}`,
    recaptchaAction: "checkout_entry",
    userAgent
  };

  const cmsRes = await fetch(`https://${serviceDomain}.microcms.io/api/v1/insightbase`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-MICROCMS-API-KEY": apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!cmsRes.ok) {
    return new Response(JSON.stringify({ ok: false, error: "server" }), {
      status: 502,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};
