import type { APIRoute } from "astro";
import Stripe from "stripe";
import { Resend } from "resend";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const PURCHASE_NOTICE_EMAIL = "suzuki@bizup-inc.co.jp";

const INQUIRY_URL = "https://insightbase.jp/inquiry";

// 送信専用注記（一般的な表現）
const NO_REPLY_NOTE_TEXT = "※ 本メールは送信専用のため、ご返信いただいてもお答えできませんのでご了承ください。";

const SIGNATURE_TEXT = `◆◇───────────────────────────◇◆
　　ビザップ株式会社
　　　https://bizup-inc.co.jp

　　InsightBase
　　　https://insightbase.jp
　・………・………・………・………・………・
　　〒272-0111　千葉県市川市妙典5-13-33 A＆Yビル3F
　　Email:info@bizup-inc.co.jp
◆◇───────────────────────────◇◆`;

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function nl2br(text: string) {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

function buildMail(params: {
  productKey: string;
  ga4Pass: string;
  adsPass: string;
  setPass: string;
}) {
  const { productKey, ga4Pass, adsPass, setPass } = params;

  const ga4Url = "https://manual.insightbase.jp/";
  const adsUrl = "https://manual.insightbase.jp/";
  const setUrl = "https://manual.insightbase.jp/";

  // ★ここがご希望の「丁寧な案内文」
  const introText = `この度はInsightBaseのテンプレートをご購入いただき、誠にありがとうございます。
テンプレートの導入手順は、以下のマニュアルサイトにてご案内しております。
下記URLへアクセスのうえ、記載のパスワードでログインしてご確認ください。`;

  const footerText = `

ご不明な点がございましたらお問い合わせフォームよりご連絡ください。
${INQUIRY_URL}

${NO_REPLY_NOTE_TEXT}

${SIGNATURE_TEXT}`;

  let subject = "【InsightBase】導入マニュアルのご案内";
  let manualBlock = "";

  if (productKey === "ga4") {
    subject = "【InsightBase】GA4レポートテンプレート：導入マニュアルのご案内";
    manualBlock = `▼ GA4レポートテンプレート 導入マニュアル
URL: ${ga4Url}
パスワード: ${ga4Pass}`;
  } else if (productKey === "ads") {
    subject = "【InsightBase】Google広告レポートテンプレート：導入マニュアルのご案内";
    manualBlock = `▼ Google広告レポートテンプレート 導入マニュアル
URL: ${adsUrl}
パスワード: ${adsPass}`;
  } else if (productKey === "set") {
    subject = "【InsightBase】セット購入：導入マニュアルのご案内";
    manualBlock = `▼ GA4＋Google広告レポートテンプレート導入マニュアル
URL: ${setUrl}
パスワード: ${setPass}`;
  } else {
    // 想定外
    manualBlock = `購入情報の識別ができませんでした。
恐れ入りますが、お問い合わせフォームよりご連絡ください。
${INQUIRY_URL}`;
  }

  const text = `${introText}

${manualBlock}${footerText}`;

  // HTML（最低限の装飾）
  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Hiragino Kaku Gothic ProN','Hiragino Sans','Noto Sans JP',Arial,sans-serif; line-height:1.7; color:#111;">
    <p style="margin:0 0 14px;">${nl2br(
      "この度はInsightBaseのテンプレートをご購入いただき、誠にありがとうございます。"
    )}</p>
    <p style="margin:0 0 16px;">${nl2br(
      "テンプレートの導入手順は、以下のマニュアルサイトにてご案内しております。"
    )}</p>
        <p style="margin:0 0 14px;">${nl2br(
      "下記URLへアクセスのうえ、記載のパスワードでログインしてご確認ください。"
    )}</p>

    <div style="border:1px solid #e5e7eb; border-radius:12px; padding:16px; background:#fafafa; margin:0 0 16px;">
      ${nl2br(manualBlock)}
    </div>

    <p style="margin:0 0 8px;">ご不明な点がございましたらお問い合わせフォームよりご連絡ください。<br>
      <a href="${INQUIRY_URL}" style="color:#2563eb; text-decoration:underline;">${INQUIRY_URL}</a>
    </p>

    <p style="margin:0 0 16px; color:#6b7280; font-size:13px;">${escapeHtml(NO_REPLY_NOTE_TEXT)}</p>

    <pre style="margin:0; padding:12px 14px; background:#424242; color:#ffffff; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace; font-size:12px; overflow:auto;">${escapeHtml(
      SIGNATURE_TEXT
    )}</pre>
  </div>`.trim();

  return { subject, text, html };
}

export const POST: APIRoute = async ({ request }) => {
  const sig = request.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature", { status: 400 });

  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ signature verification failed:", err?.message || err);
    return new Response("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const productKey = session.metadata?.product_key;
    const email =
      session.customer_details?.email ||
      (typeof session.customer_email === "string" ? session.customer_email : undefined);

    console.log("✅ checkout.session.completed");
    console.log("product_key:", productKey);
    console.log("email:", email);
    console.log("session.id:", session.id);

    if (!productKey || !email) {
      console.log("⚠️ Missing product_key or email", { productKey, email });
      return new Response("ok", { status: 200 });
    }

    const resendFrom = import.meta.env.RESEND_FROM; // 例: "ビザップ株式会社 <no-reply@bizup-inc.co.jp>"
    const ga4Pass = import.meta.env.GA4_MANUAL_PASSWORD;
    const adsPass = import.meta.env.ADS_MANUAL_PASSWORD;
    const setPass = import.meta.env.SET_MANUAL_PASSWORD;

    if (!resendFrom || !ga4Pass || !adsPass || !setPass) {
      console.log("⚠️ Missing env vars", {
        resendFrom: !!resendFrom,
        ga4Pass: !!ga4Pass,
        adsPass: !!adsPass,
        setPass: !!setPass,
      });
      return new Response("ok", { status: 200 });
    }

    try {
      const mail = buildMail({ productKey, ga4Pass, adsPass, setPass });

      const result = await resend.emails.send({
        from: resendFrom,
        to: email,
        bcc: [PURCHASE_NOTICE_EMAIL],
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });

      if (result.error) {
        console.error("❌ mail send failed:", result.error);
        return new Response("ok", { status: 200 });
      }

      console.log("✅ mail sent", {
        to: email,
        bcc: PURCHASE_NOTICE_EMAIL,
        productKey,
        id: result?.data?.id
      });
    } catch (err: any) {
      console.error("❌ mail send failed:", err?.message || err);
      return new Response("ok", { status: 200 });
    }
  }

  return new Response("ok", { status: 200 });
};

export const GET: APIRoute = async () => {
  return new Response("alive", { status: 200 });
};
