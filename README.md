# Structure Lab — PWA

اپلیکیشن Progressive Web App فارسی (RTL) برای مسیر یادگیری مهندسی سازه.

## ویژگی‌ها
- طراحی موبایل‌فرست و نصب‌پذیر روی آیفون (Add to Home Screen)
- جلسه نمونه با ساختار ۶ مرحله‌ای
- نقشه راه پنج‌ساله
- ذخیره یادداشت محلی + همگام‌سازی با Supabase
- Service Worker برای کار آفلاین shell

## استقرار روی Cloudflare Pages (توصیه‌شده)

### روش ۱ — آپلود مستقیم (سریع‌ترین)
1. محتویات همین پوشه را zip کن (یا از همین فایل‌ها استفاده کن).
2. به [Cloudflare Dashboard → Pages](https://dash.cloudflare.com) برو.
3. **Create a project** → **Upload assets**.
4. فایل‌ها را آپلود کن (ریشه باید `index.html` باشد).
5. دامنه را انتخاب کن یا از دامنه رایگان `*.pages.dev` استفاده کن.

### روش ۲ — اتصال به Git
1. این پوشه را در یک ریپوی GitHub قرار بده.
2. در Cloudflare Pages → Create project → Connect to Git.
3. Framework preset: **None** (استاتیک).
4. Build command را خالی بگذار.
5. Output directory را خالی بگذار یا `.` بگذار.

### بعد از استقرار
1. آدرس HTTPS را کپی کن (مثال: `https://structure-lab.pages.dev`).
2. در Supabase Dashboard → Authentication → URL Configuration:
   - **Site URL** را روی همان آدرس HTTPS بگذار.
   - در **Redirect URLs** همان آدرس را اضافه کن.
3. یک بار حساب شخصی خودت را از داخل اپ بساز.
4. سپس در Supabase → Authentication → Providers / Settings، **ثبت‌نام کاربران جدید را غیرفعال** کن.

## اجرای محلی
```bash
# از داخل همین پوشه
python3 -m http.server 8000
# یا
npx serve .
```
سپس `http://localhost:8000` را باز کن.

## دیتابیس Supabase
فایل `supabase/schema.sql` را در SQL Editor پروژه Supabase اجرا کن.

اگر قبلاً جدول `lesson_notes` با ستون `body` ساخته‌ای:
```sql
alter table public.lesson_notes rename column body to note;
```

کلید publishable در `src/supabase.js` قرار دارد (برای فرانت‌اند و با RLS امن است).  
هرگز service_role key را در مرورگر قرار نده.

## نصب روی آیفون
1. Safari را باز کن و آدرس سایت را بزن.
2. دکمه Share → **Add to Home Screen**.
3. اپ مثل برنامه عادی باز می‌شود (standalone).

## نکات
- Web Push هنوز پیاده‌سازی نشده.
- محتوا فعلاً استاتیک است؛ جدول `lessons` برای نسخه‌های بعدی آماده است.
- همیشه منابع علمی را با citation واقعی منتشر کن.
