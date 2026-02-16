import type { APIRoute } from "astro";
import Stripe from "stripe";
import { Resend } from "resend";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover", // StripeダッシュボードのAPIバージョンに合わせる
});

const resend = new Resend(import.meta.env.RESEND_API_KEY);

function buildMail(params: {
  productKey: string;
  ga4Pass: string;
  adsPass: string;
  setPass: string;
}) {
  const { productKey, ga4Pass, adsPass, setPass } = params;

  // URLは必要に応じてあなたの構成に合わせて変更してください
  const ga4Url = "https://manual.insightbase.jp/";
  const adsUrl = "https://manual.insightbase.jp/";
  const setUrl = "https://manual.insightbase.jp/";

  const inquiryText = `

ご不明な点がございましたらお問い合わせフォームよりご連絡ください。
https://insightbase.jp/inquiry`;

  if (productKey === "ga4") {
    return {
      subject: "【InsightBase】GA4レポートテンプレート：導入マニュアルのご案内",
      text: `ご購入ありがとうございます。

▼ GA4レポートテンプレート 導入マニュアル
URL: ${ga4Url}
パスワード: ${ga4Pass}${inquiryText}`,
    };
  }

  if (productKey === "ads") {
    return {
      subject: "【InsightBase】Google広告レポートテンプレート：導入マニュアルのご案内",
      text: `ご購入ありがとうございます。

▼ Google広告レポートテンプレート 導入マニュアル
URL: ${adsUrl}
パスワード: ${adsPass}${inquiryText}`,
    };
  }

  if (productKey === "set") {
    return {
      subject: "【InsightBase】セット購入：導入マニュアルのご案内",
      text: `ご購入ありがとうございます。

▼ GA4＋Google広告レポートテンプレート 導入マニュアル
URL: ${setUrl}
パスワード: ${setPass}${inquiryText}`,
    };
  }

  // 想定外の値はフォールバック（運用上の事故を防ぐ）
  return {
    subject: "【InsightBase】導入マニュアルのご案内",
    text: `ご購入ありがとうございます。

購入情報の識別ができませんでした。
お手数ですが、本メールへご返信ください（確認のうえご案内いたします）。${inquiryText}`,
  };
}

export const POST: APIRoute = async ({ request }) => {
  const sig = request.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature", { status: 400 });

  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });

  // 署名検証は raw body が必要
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

    // 必要情報が揃っていない場合はここで終了（Stripeには200を返す）
    if (!productKey || !email) {
      console.log("⚠️ Missing product_key or email", { productKey, email });
      return new Response("ok", { status: 200 });
    }

    const resendFrom = import.meta.env.RESEND_FROM;
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
        from: resendFrom, // 例: "Bizup <no-reply@bizup-inc.co.jp>"
        to: email,
        subject: mail.subject,
        text: mail.text,
      });

      console.log("✅ mail sent", { to: email, productKey, id: result?.data?.id });
    } catch (err: any) {
      // 失敗してもStripeには200返す（再送ループを防ぐ）
      console.error("❌ mail send failed:", err?.message || err);
      return new Response("ok", { status: 200 });
    }
  }

  return new Response("ok", { status: 200 });
};

export const GET: APIRoute = async () => {
  return new Response("alive", { status: 200 });
};
