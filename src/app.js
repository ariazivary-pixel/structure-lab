import { supabase } from './supabase.js';

const lessonDialog = document.getElementById('lessonDialog');
const panelDialog = document.getElementById('panelDialog');
const authDialog = document.getElementById('authDialog');
const noteField = document.getElementById('lessonNote');
const authForm = document.getElementById('authForm');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authMessage = document.getElementById('authMessage');
const authSubmit = document.getElementById('authSubmit');
const authTitle = document.getElementById('authTitle');
const authHint = document.getElementById('authHint');
const authOpenBtn = document.getElementById('authOpenBtn');
const authModeToggle = document.getElementById('authModeToggle');
const forgotPassword = document.getElementById('forgotPassword');
const signOutBtn = document.getElementById('signOutBtn');

let authMode = 'signin';
let currentUser = null;
let currentNoteId = null;

const localNote = localStorage.getItem('structure-lab-note');
if (localNote) noteField.value = localNote;

document.getElementById('openLesson').addEventListener('click', () => lessonDialog.showModal());
document.getElementById('closeLesson').addEventListener('click', () => lessonDialog.close());
document.getElementById('closePanel').addEventListener('click', () => panelDialog.close());
document.getElementById('closeAuth').addEventListener('click', () => authDialog.close());

function showAuthMessage(message, type = '') {
  authMessage.textContent = message;
  authMessage.className = `auth-message ${type}`.trim();
}

function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === 'signup';
  authTitle.textContent = signup ? 'ساخت حساب شخصی' : 'ورود به حساب شخصی';
  authHint.textContent = signup
    ? 'این مرحله را فقط یک بار برای ساخت حساب شخصی انجام بده. پس از ساخت حساب، ثبت‌نام جدید را در تنظیمات Supabase غیرفعال کن.'
    : 'برای دسترسی شخصی و همگام‌سازی یادداشت‌ها و پیشرفت آموزشی وارد شو.';
  authSubmit.textContent = signup ? 'ایجاد حساب' : 'ورود';
  authModeToggle.textContent = signup ? 'حساب را قبلاً ساخته‌ای؟ ورود' : 'ساخت حساب شخصی (فقط بار اول)';
  forgotPassword.hidden = signup;
  authPassword.autocomplete = signup ? 'new-password' : 'current-password';
  showAuthMessage('');
}

function updateAuthUI(user) {
  currentUser = user;
  if (user) {
    authOpenBtn.textContent = user.email || 'حساب شخصی';
    authTitle.textContent = 'حساب کاربری فعال است';
    authHint.textContent = user.email || '';
    authForm.hidden = true;
    authModeToggle.hidden = true;
    forgotPassword.hidden = true;
    signOutBtn.hidden = false;
  } else {
    authOpenBtn.textContent = 'ورود شخصی';
    authForm.hidden = false;
    authModeToggle.hidden = localStorage.getItem('structure-lab-account-created') === '1';
    signOutBtn.hidden = true;
    setAuthMode('signin');
  }
}

async function loadLatestNote() {
  if (!currentUser) return;
  const { data, error } = await supabase
    .from('lesson_notes')
    .select('id, note')
    .eq('user_id', currentUser.id)
    .is('lesson_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('Could not load note:', error.message);
    return;
  }
  if (data) {
    currentNoteId = data.id;
    noteField.value = data.note || '';
  }
}

async function saveLessonNote() {
  const note = noteField.value.trim();
  localStorage.setItem('structure-lab-note', note);

  if (currentUser) {
    let result;
    if (currentNoteId) {
      result = await supabase
        .from('lesson_notes')
        .update({ note, updated_at: new Date().toISOString() })
        .eq('id', currentNoteId);
    } else {
      result = await supabase
        .from('lesson_notes')
        .insert({ user_id: currentUser.id, note })
        .select('id')
        .single();
      if (result.data) currentNoteId = result.data.id;
    }
    if (result.error) {
      showAuthMessage(`یادداشت در فضای ابری ذخیره نشد: ${result.error.message}`, 'error');
      return;
    }
  }

  const btn = document.getElementById('saveNote');
  const original = 'ذخیره یادداشت';
  btn.textContent = currentUser ? 'یادداشت در حساب ذخیره شد' : 'یادداشت روی همین دستگاه ذخیره شد';
  setTimeout(() => { btn.textContent = original; }, 1800);
}

document.getElementById('saveNote').addEventListener('click', saveLessonNote);

authOpenBtn.addEventListener('click', () => authDialog.showModal());
authModeToggle.addEventListener('click', () => setAuthMode(authMode === 'signin' ? 'signup' : 'signin'));

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = authEmail.value.trim();
  const password = authPassword.value;
  authSubmit.disabled = true;
  authSubmit.textContent = 'در حال بررسی…';
  showAuthMessage('');

  try {
    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + window.location.pathname }
      });
      if (error) throw error;

      if (data.session) {
        localStorage.setItem('structure-lab-account-created', '1');
        authModeToggle.hidden = true;
        showAuthMessage('حساب شخصی ساخته شد و ورود انجام شد. گام بعدی: ثبت‌نام کاربران جدید را در Supabase غیرفعال کن.', 'success');
      } else {
        localStorage.setItem('structure-lab-account-created', '1');
        authModeToggle.hidden = true;
        showAuthMessage('درخواست ساخت حساب ثبت شد. ایمیل تأیید را بررسی کن؛ پس از فعال‌سازی، ثبت‌نام جدید را در Supabase خاموش کن.', 'success');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showAuthMessage('ورود موفق بود.', 'success');
      setTimeout(() => authDialog.close(), 900);
    }
  } catch (error) {
    showAuthMessage(error.message || 'خطا در احراز هویت.', 'error');
  } finally {
    authSubmit.disabled = false;
    authSubmit.textContent = authMode === 'signup' ? 'ایجاد حساب' : 'ورود';
  }
});

forgotPassword.addEventListener('click', async () => {
  const email = authEmail.value.trim();
  if (!email) {
    showAuthMessage('ابتدا ایمیل خود را وارد کن.', 'error');
    return;
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname
  });
  showAuthMessage(
    error ? error.message : 'اگر این ایمیل ثبت شده باشد، لینک بازنشانی رمز ارسال می‌شود.',
    error ? 'error' : 'success'
  );
});

signOutBtn.addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) showAuthMessage(error.message, 'error');
  else {
    currentNoteId = null;
    authDialog.close();
  }
});

supabase.auth.onAuthStateChange((_event, session) => {
  updateAuthUI(session?.user ?? null);
  if (session?.user) loadLatestNote();
  else currentNoteId = null;
});

const panels = {
  notes: ['یادداشت‌های من', 'یادداشت‌ها در حساب کاربری ذخیره می‌شوند؛ بدون ورود، فقط روی همین دستگاه می‌مانند.'],
  sources: ['کتابخانه منابع', 'در این بخش منابع معتبر مانند FEMA، NIST، ACI، AISC، ASCE و مقالات داوری‌شده با مشخصات کتابشناختی و لینک قابل بررسی ثبت می‌شوند.'],
  progress: ['ارزیابی مهارت‌ها', 'پیشرفت در مبانی تحلیل، بتن‌آرمه، فولاد، زلزله، نرم‌افزار و برنامه‌نویسی به‌صورت جداگانه ثبت خواهد شد.'],
  lessons: ['فهرست درس‌ها', 'درس‌ها به ترتیب پیش‌نیاز علمی و مسیر حرفه‌ای پنج‌ساله مرتب می‌شوند.'],
  profile: ['پروفایل آموزشی', 'از دکمه ورود در بالای صفحه برای مدیریت حساب کاربری استفاده کن.']
};

function openPanel(key) {
  const item = panels[key] || panels.lessons;
  document.getElementById('panelTitle').textContent = item[0];
  document.getElementById('panelText').textContent = item[1];
  panelDialog.showModal();
}

document.querySelectorAll('[data-panel]').forEach((el) => {
  el.addEventListener('click', () => openPanel(el.dataset.panel));
});

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  const btn = document.getElementById('installBtn');
  btn.hidden = false;
  btn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btn.hidden = true;
  }, { once: true });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(console.warn);
  });
}
