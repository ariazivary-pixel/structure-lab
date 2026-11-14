/**
 * Structure Lab — Engineering Tutor Agent
 * Local grounded tutor + optional remote LLM endpoint.
 * Policy: never invent codes/values; cite source type; distinguish Iranian vs international.
 */

const LESSON_CONTEXT = {
  id: '01',
  title: 'سازه چگونه رفتار می‌کند؟',
  stage: 'مبانی رفتار سازه',
  goals: 'درک رابطه میان بار، مسیر انتقال بار و پاسخ سازه',
  topics: [
    'مسیر انتقال بار ثقلی و جانبی',
    'تعادل ΣF=0 و ΣM=0',
    'سه پایه تحلیل: تعادل، سازگاری، رفتار مصالح',
    'نقش سختی نسبی در توزیع نیرو',
    'قضاوت مهندسی روی خروجی نرم‌افزار'
  ]
};

export const RESOURCE_CATALOG = [
  {
    id: 'fema-p749',
    type: 'official technical guide',
    title: 'FEMA P-749 Earthquake-Resistant Design Concepts',
    org: 'FEMA',
    year: 2010,
    supports: 'مفاهیم پایه رفتار لرزه‌ای و انتقال بار در ساختمان',
    limits: 'آیین‌نامه طراحی ایران نیست؛ مقادیر طراحی محلی را جایگزین نمی‌کند',
    region: 'international'
  },
  {
    id: 'asce-7',
    type: 'standard',
    title: 'ASCE/SEI 7 Minimum Design Loads',
    org: 'ASCE',
    year: null,
    supports: 'تعریف بارها و ترکیبات بار در چارچوب آمریکا',
    limits: 'مستقیماً جایگزین مبحث ششم مقررات ملی ایران نیست',
    region: 'international'
  },
  {
    id: 'aci-318',
    type: 'code',
    title: 'ACI 318 Building Code Requirements for Structural Concrete',
    org: 'ACI',
    year: null,
    supports: 'اصول طراحی بتن‌آرمه',
    limits: 'با مبحث نهم ایران تفاوت‌هایی دارد؛ برای پروژه ایران باید مقررات ملی کنترل شود',
    region: 'international'
  },
  {
    id: 'aisc-360',
    type: 'code',
    title: 'AISC 360 Specification for Structural Steel Buildings',
    org: 'AISC',
    year: null,
    supports: 'اصول طراحی فولاد',
    limits: 'معادل کامل مباحث فولاد ایران نیست',
    region: 'international'
  },
  {
    id: 'iran-m6',
    type: 'national regulation',
    title: 'مبحث ششم مقررات ملی ساختمان — بارهای وارد بر ساختمان',
    org: 'دفتر مقررات ملی ساختمان',
    year: null,
    supports: 'تعریف بارها برای پروژه‌های مشمول مقررات ملی ایران',
    limits: 'جزئیات عددی باید از آخرین ویرایش رسمی خوانده شود',
    region: 'iran'
  },
  {
    id: 'iran-m9',
    type: 'national regulation',
    title: 'مبحث نهم — طرح و اجرای ساختمان‌های بتن‌آرمه',
    org: 'دفتر مقررات ملی ساختمان',
    year: null,
    supports: 'چارچوب طراحی بتن در ایران',
    limits: 'اعداد و بندها باید از متن رسمی کنترل شوند',
    region: 'iran'
  },
  {
    id: 'iran-m10',
    type: 'national regulation',
    title: 'مبحث دهم — طرح و اجرای ساختمان‌های فولادی',
    org: 'دفتر مقررات ملی ساختمان',
    year: null,
    supports: 'چارچوب طراحی فولاد در ایران',
    limits: 'اعداد و بندها باید از متن رسمی کنترل شوند',
    region: 'iran'
  },
  {
    id: 'standard-2800',
    type: 'national standard',
    title: 'استاندارد ۲۸۰۰ — طراحی ساختمان‌ها در برابر زلزله',
    org: 'مرکز تحقیقات راه، مسکن و شهرسازی',
    year: null,
    supports: 'طیف و ضوابط لرزه‌ای ایران',
    limits: 'ویرایش معتبر رسمی باید مبنای محاسبه باشد',
    region: 'iran'
  }
];

const SYSTEM_RULES = `\nتو دستیار آموزشی Structure Lab هستی؛ مخصوص یادگیری مهندسی سازه.\nقوانین سخت:\n1) هیچ عدد آیین‌نامه‌ای، ضریب، یا بند را از حافظه به‌عنوان قطعی اعلام نکن مگر منبع مشخص باشد.\n2) بین مقررات ایران و استانداردهای بین‌المللی تمایز بگذار.\n3) اگر مطمئن نیستی بگو باید از متن رسمی کنترل شود.\n4) مثال‌های آموزشی را تشریحی برچسب بزن.\n5) روی قضاوت مهندسی تأکید کن.\n6) پاسخ‌ها کوتاه، فارسی، ساختاریافته باشند.\n`.trim();

function matchIntent(q) {
  const t = q.trim();
  if (/مسیر\s*بار|انتقال\s*بار|load\s*path/i.test(t)) return 'load_path';
  if (/تعادل|equilibrium|ΣF|ΣM|مجموع\s*نیرو/i.test(t)) return 'equilibrium';
  if (/سازگاری|سختی|stiffness|compatibility/i.test(t)) return 'compatibility';
  if (/قضاوت|نرم[‌ ]?افزار|etabs|خروجی/i.test(t)) return 'judgment';
  if (/منبع|مبحث|آیین|fema|asce|aci|۲۸۰۰|2800/i.test(t)) return 'sources';
  if (/زلزله|لرزه|جانبی/i.test(t)) return 'lateral';
  if (/کمک|چه\s*کار|راهنما/i.test(t)) return 'help';
  return 'general';
}

function formatSources(ids) {
  return RESOURCE_CATALOG.filter((r) => ids.includes(r.id))
    .map((r) => `• ${r.title} (${r.type}) — ${r.supports}. محدودیت: ${r.limits}`)
    .join('\n');
}

function localReply(question) {
  const intent = matchIntent(question);
  const lessonLine = `بستر جلسه فعلی: «${LESSON_CONTEXT.title}» — ${LESSON_CONTEXT.stage}.`;
  const replies = {
    load_path: `${lessonLine}\n\n**مسیر انتقال بار (تشریحی):**\nبار ثقلی معمولاً: دال → تیر → ستون/دیوار → فونداسیون → خاک.\nدر بار جانبی: دیافراگم کف نیرو را به سیستم باربر جانبی می‌رساند.\n\n**منابع:**\n${formatSources(['fema-p749', 'iran-m6'])}`,
    equilibrium: `${lessonLine}\n\n**تعادل:** ΣF = 0 و ΣM = 0 لازم است اما برای پاسخ کامل کافی نیست. سازگاری و رفتار مصالح هم لازم‌اند.`,
    compatibility: `${lessonLine}\n\n**سازگاری و سختی:** سختی نسبی توزیع نیرو را تعیین می‌کند. فرضیات مدل را قبل از اعتماد به عدد چک کن.`,
    judgment: `${lessonLine}\n\n**قضاوت مهندسی:** مسیر بار، تکیه‌گاه، دیافراگم، تعادل واکنش‌ها، تغییرشکل، آیین‌نامه حاکم.`,
    sources: RESOURCE_CATALOG.map((r) => `• **${r.title}**\n  ${r.type} · ${r.region}\n  ${r.supports}\n  محدودیت: ${r.limits}`).join('\n\n'),
    lateral: `${lessonLine}\n\n**بار جانبی:** دیافراگم → سیستم باربر جانبی. مرجع ایران: استاندارد ۲۸۰۰ (از متن رسمی).\n${formatSources(['standard-2800', 'fema-p749'])}`,
    help: `می‌توانی بپرسی: مسیر بار، تعادل، سه پایه تحلیل، قضاوت مهندسی، منابع.\n${lessonLine}`,
    general: `${lessonLine}\n\nسؤال را مشخص‌تر بپرس (مثل «مسیر بار ثقلی»). برای فهرست منابع بنویس: منابع`
  };
  return replies[intent] || replies.general;
}

export async function askAgent(message, history = []) {
  const url = (typeof window !== 'undefined' && window.STRUCTURE_LAB_AGENT_URL) || '';
  if (url) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          lessonId: LESSON_CONTEXT.id,
          lesson: LESSON_CONTEXT,
          resources: RESOURCE_CATALOG,
          system: SYSTEM_RULES,
          history: history.slice(-8)
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) return { reply: data.reply, mode: 'remote' };
      }
    } catch (e) {
      console.warn('Agent remote failed, falling back to local', e);
    }
  }
  return { reply: localReply(message), mode: 'local' };
}

export { LESSON_CONTEXT, SYSTEM_RULES };
