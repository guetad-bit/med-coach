import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const user = (req.query.user || "").toString().trim().toLowerCase();
  if (!user || user.length < 3 || user.length > 40) {
    return res.status(400).json({ error: "invalid user code" });
  }
  const key = `medcoach:${user}`;

  try {
    if (req.method === "GET") {
      const data = (await kv.get(key)) || null;
      return res.status(200).json({ data });
    }
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      await kv.set(key, body);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
