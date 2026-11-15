# Cloudflare Worker — Structure Lab AI

## بارگذاری
فایل `worker.js` را به‌عنوان Worker module بارگذاری کن.

## Variables and Secrets
- `ALLOWED_ORIGIN` = `https://structure-lab.ariazivary.workers.dev`
- `SUPABASE_URL` = آدرس پروژه Supabase فعلی
- `SUPABASE_PUBLISHABLE_KEY` = کلید publishable همان پروژه
- `GEMINI_API_KEY` = کلید Gemini به‌صورت **Secret**؛ هرگز داخل GitHub یا کد مرورگر قرار نگیرد.
- `GEMINI_MODEL` = `gemini-3.8-flash` (در صورت نیاز بر اساس دسترسی حساب قابل تغییر است)

## مسیرها
- `GET /api/ai/health`
- `POST /api/ai/chat`

## بدنه درخواست
```json
{"messages":[{"role":"user","content":"تعادل نیروها در یک تیر ساده را توضیح بده."}]}
```
هدرها: `Authorization: Bearer <supabase_access_token>` و `Content-Type: application/json`.

Worker نشست Supabase را بررسی می‌کند، ورودی را محدود می‌کند و کلید Gemini را فقط سمت سرور نگه می‌دارد. خروجی مدل را به‌عنوان HTML اجرا نکن.

**مهم:** این API هنوز به رابط چت در `src/app.js` متصل نشده است. ابتدا Worker را منتشر و آزمایش کن؛ سپس اتصال رابط کاربری انجام می‌شود.
