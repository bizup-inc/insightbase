import type { APIRoute } from "astro";

export const POST: APIRoute = async () => {
  console.log("✅ stripe webhook hit");
  return new Response("ok", { status: 200 });
};

export const GET: APIRoute = async () => {
  return new Response("alive", { status: 200 });
};
