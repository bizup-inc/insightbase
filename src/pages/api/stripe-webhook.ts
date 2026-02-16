import type { APIRoute } from "astro";
import Stripe from "stripe";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover", // StripeダッシュボードのAPIバージョンに合わせる
});

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

  // まずは checkout.session.completed を確認
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
  }

  return new Response("ok", { status: 200 });
};

// （任意）ブラウザで生存確認したければ残す
export const GET: APIRoute = async () => {
  return new Response("alive", { status: 200 });
};
