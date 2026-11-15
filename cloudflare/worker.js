const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
const MAX_BODY_BYTES = 24000;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 6000;

function json(data, status = 200, cors = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...cors, "cache-control": "no-store" } });
}
function corsHeaders(origin, allowedOrigin) {
  return { "access-control-allow-origin": origin === allowedOrigin ? origin : "null", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "authorization, content-type", "access-control-max-age": "86400", "vary": "Origin" };
}
const SYSTEM_INSTRUCTION = `تو دستیار آموزشی Structure Lab برای یادگیری مهندسی عمران و سازه هستی. به فارسی روشن و مرحله‌به‌مرحله پاسخ بده، مگر کاربر زبان دیگری بخواهد. ابتدا مسئله، فرضیات، دستگاه واحدها و قرارداد علامت را روشن کن. در محاسبات، داده‌ها، روابط، جایگذاری عددی و کنترل مستقل نتیجه را جداگانه نشان بده. بین الزام آیین‌نامه، توصیه مهندسی و توضیح آموزشی تفاوت بگذار. شماره بند، ضریب، حد مجاز یا ویرایش آیین‌نامه را حدس نزن؛ اگر منبع دقیق در دسترس نیست صریح بگو باید بررسی شود. خروجی نرم‌افزار را حقیقت قطعی فرض نکن؛ مسیر انتقال بار، شرایط مرزی، تعادل، سازگاری و معقول‌بودن پاسخ را کنترل کن. مثال آموزشی را طراحی اجرایی قابل ساخت معرفی نکن. اگر داده کافی نیست، مهم‌ترین داده مفقود را مشخص کن و فرض پنهان نساز. از HTML یا اسکریپت اجرایی در پاسخ استفاده نکن.`;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "";
    const cors = corsHeaders(origin, allowedOrigin);
    if (!allowedOrigin || origin !== allowedOrigin) return json({ error: "Origin not allowed" }, 403, cors);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/api/ai/health") return json({ ok: true, service: "structure-lab-ai" }, 200, cors);
    if (request.method !== "POST" || url.pathname !== "/api/ai/chat") return json({ error: "Not found" }, 404, cors);
    if (!env.GEMINI_API_KEY || !env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) return json({ error: "Server configuration incomplete" }, 503, cors);
    const auth = request.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401, cors);
    const accessToken = auth.slice(7).trim();
    if (!accessToken || accessToken.length > 8000) return json({ error: "Invalid session token" }, 401, cors);
    const userResponse = await fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/user`, { headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${accessToken}` } });
    if (!userResponse.ok) return json({ error: "Session is invalid or expired" }, 401, cors);
    if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) return json({ error: "Request is too large" }, 413, cors);
    let body;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ error: "Request is too large" }, 413, cors);
      body = JSON.parse(raw);
    } catch { return json({ error: "Invalid JSON body" }, 400, cors); }
    if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > MAX_MESSAGES) return json({ error: "messages must contain 1 to 12 items" }, 400, cors);
    const contents = [];
    for (const m of body.messages) {
      if (!m || !["user", "model"].includes(m.role) || typeof m.content !== "string" || !m.content.trim() || m.content.length > MAX_MESSAGE_CHARS) return json({ error: "Invalid message format" }, 400, cors);
      contents.push({ role: m.role, parts: [{ text: m.content.trim() }] });
    }
    if (contents.at(-1).role !== "user") return json({ error: "The last message must be from the user" }, 400, cors);
    const model = (env.GEMINI_MODEL || "gemini-3.8-flash").trim();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    let aiResponse;
    try {
      aiResponse = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY }, body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] }, contents, generationConfig: { temperature: 0.25, maxOutputTokens: 1800 } }) });
    } catch { return json({ error: "AI provider could not be reached" }, 502, cors); }
    const aiData = await aiResponse.json().catch(() => ({}));
    if (!aiResponse.ok) return json({ error: "AI provider request failed", providerStatus: aiResponse.status }, 502, cors);
    const answer = aiData?.candidates?.[0]?.content?.parts?.map(p => typeof p.text === "string" ? p.text : "").join("").trim();
    if (!answer) return json({ error: "AI returned an empty response" }, 502, cors);
    return json({ answer, model }, 200, cors);
  }
};
