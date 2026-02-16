import type { APIRoute } from "astro";
import { Resend } from "resend";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RECAPTCHA_ACTION = "inquiry_submit";
const RECAPTCHA_THRESHOLD = 0.5;

const getClientIp = (headers: Headers) => {
  const forwarded = headers.get("x-forwarded-for");
  if (!forwarded) return "";
  return forwarded.split(",")[0]?.trim() ?? "";
};

const wantsJson = (request: Request) =>
  request.headers.get("accept")?.includes("application/json");

const redirectWithError = (code: string) =>
  new Response(null, {
    status: 303,
    headers: { Location: `/inquiry?error=${code}` }
  });

export const POST: APIRoute = async ({ request }) => {
  const serviceDomain = import.meta.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = import.meta.env.MICROCMS_API_KEY;
  const recaptchaSecret = import.meta.env.RECAPTCHA_SECRET;
  const resendApiKey = import.meta.env.RESEND_API_KEY;
  const resendFrom = import.meta.env.RESEND_FROM;
  const resendTo = import.meta.env.RESEND_TO;
  const resendReplyTo = import.meta.env.RESEND_REPLY_TO;

  if (
    !serviceDomain ||
    !apiKey ||
    !recaptchaSecret ||
    !resendApiKey ||
    !resendFrom ||
    !resendTo
  ) {
    const message = "Server configuration is missing.";
    return wantsJson(request)
      ? new Response(JSON.stringify({ ok: false, error: "server" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        })
      : redirectWithError("server");
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
  } catch (error) {
    return wantsJson(request)
      ? new Response(JSON.stringify({ ok: false, error: "required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        })
      : redirectWithError("required");
  }

  const inquiryType = String(data.inquiryType ?? "").trim();
  const company = String(data.company ?? "").trim();
  const name = String(data.name ?? "").trim();
  const email = String(data.email ?? "").trim();
  const message = String(data.message ?? "").trim();
  const recaptchaToken = String(data.recaptchaToken ?? "").trim();
  const recaptchaAction = String(data.recaptchaAction ?? "").trim();

  if (!inquiryType || !name || !email || !message || !recaptchaToken) {
    return wantsJson(request)
      ? new Response(JSON.stringify({ ok: false, error: "required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        })
      : redirectWithError("required");
  }

  if (!EMAIL_REGEX.test(email)) {
    return wantsJson(request)
      ? new Response(JSON.stringify({ ok: false, error: "email" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        })
      : redirectWithError("email");
  }

  const ip = getClientIp(request.headers);
  const userAgent = request.headers.get("user-agent") ?? "";

  const recaptchaBody = new URLSearchParams({
    secret: recaptchaSecret,
    response: recaptchaToken,
    remoteip: ip
  });

  const recaptchaRes = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: recaptchaBody.toString()
    }
  );

  const recaptchaJson = await recaptchaRes.json().catch(() => null);

  if (
    !recaptchaRes.ok ||
    !recaptchaJson?.success ||
    recaptchaJson?.score < RECAPTCHA_THRESHOLD ||
    recaptchaJson?.action !== RECAPTCHA_ACTION ||
    (recaptchaAction && recaptchaJson?.action !== recaptchaAction)
  ) {
    return wantsJson(request)
      ? new Response(JSON.stringify({ ok: false, error: "recaptcha" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        })
      : redirectWithError("recaptcha");
  }

  const payload = {
    inquiryType,
    company,
    name,
    email,
    message,
    recaptchaAction: recaptchaJson?.action ?? recaptchaAction,
    ip,
    userAgent
  };

  const cmsRes = await fetch(
    `https://${serviceDomain}.microcms.io/api/v1/insightbase`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-MICROCMS-API-KEY": apiKey
      },
      body: JSON.stringify(payload)
    }
  );

  if (!cmsRes.ok) {
    return wantsJson(request)
      ? new Response(JSON.stringify({ ok: false, error: "server" }), {
          status: 502,
          headers: { "Content-Type": "application/json" }
        })
      : redirectWithError("server");
  }

  const resend = new Resend(resendApiKey);
  const adminText = [
    "InsightBaseの問い合わせがありました。",
    "",
    `お問い合わせ種別: ${inquiryType}`,
    `会社名: ${company || "-"}`,
    `お名前: ${name}`,
    `メールアドレス: ${email}`,
    "お問い合わせ内容:",
    message,
    "",
    `IP: ${ip || "-"}`,
    `User-Agent: ${userAgent || "-"}`,
    `reCAPTCHA action: ${recaptchaJson?.action ?? recaptchaAction ?? "-"}`
  ].join("\n");

  const autoReplyText = [
    `${name} 様`,
    "",
    "お世話になります。",
    "ビザップ株式会社でございます。",
    "この度はお問い合わせ誠にありがとうございます。",
    "",
    "お問い合わせへのご回答につきましては2営業日以内にお電話もしくは",
    "メールにてご回答させて頂きますのでいましばらくお待ち下さいます様",
    "宜しくお願い致します。",
    "",
    "◆◇───────────────────────────◇◆",
    "　　ビザップ株式会社",
    "　　　https://bizup-inc.co.jp",
    "　・………・………・………・………・………・",
    "　　〒272-0111　千葉県市川市妙典5-13-33 A＆Yビル3F",
    "　　Email:info@bizup-inc.co.jp",
    "　Tel:047-718-3017",
    "◆◇───────────────────────────◇◆"
  ].join("\n");

  try {
    await resend.emails.send({
      from: resendFrom,
      to: resendTo,
      replyTo: resendReplyTo || resendTo,
      subject: "InsightBaseの問い合わせがありました",
      text: adminText
    });

    await resend.emails.send({
      from: resendFrom,
      to: email,
      replyTo: resendReplyTo || resendTo,
      subject: "お問い合わせありがとうございます（InsightBase）",
      text: autoReplyText
    });
  } catch (error) {
    return wantsJson(request)
      ? new Response(JSON.stringify({ ok: false, error: "server" }), {
          status: 502,
          headers: { "Content-Type": "application/json" }
        })
      : redirectWithError("server");
  }

  return wantsJson(request)
    ? new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    : new Response(null, { status: 303, headers: { Location: "/inquiry/thanks" } });
};
