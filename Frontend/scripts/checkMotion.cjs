const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const puppeteer = require('puppeteer');

const FRONTEND_DIR = path.resolve(__dirname, '..');
const SCREENSHOT_DIR = path.join(FRONTEND_DIR, '.screenshots', 'D');
const VITE_PORT = 5179;
const BASE_URL = process.env.CHECK_MOTION_URL || `http://127.0.0.1:${VITE_PORT}`;
const CHROME_PATH =
  process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SAMPLE_CATEGORIES = [
  { _id: 'cat-1', key: 'lms', name: { en: 'LMS Platforms', ar: 'منصات التعليم' }, isActive: true },
  { _id: 'cat-2', key: 'ecommerce', name: { en: 'E-Commerce', ar: 'المتاجر الإلكترونية' }, isActive: true },
];

const SAMPLE_PROJECT = {
  _id: 'proj-1',
  id: 'proj-1',
  slug: 'nexus-lms-pro',
  title: { en: 'Nexus LMS Pro', ar: 'منصة نيكسس التعليمية' },
  tagline: {
    en: 'Production-ready learning management system with live courses and certificates.',
    ar: 'نظام إدارة تعلم متكامل جاهز للإطلاق مع دورات وشهادات.',
  },
  description: {
    en: 'Full-stack educational platform built with React, Node.js, and MongoDB.',
    ar: 'منصة تعليمية متكاملة مبنية باستخدام React و Node.js و MongoDB.',
  },
  category: SAMPLE_CATEGORIES[0],
  isFeatured: true,
  startingPrice: 450000,
  thumbnailUrl: 'https://placehold.co/800x500/131F45/FFFFFF?text=Nexus+LMS',
  thumbnail: { url: 'https://placehold.co/800x500/131F45/FFFFFF?text=Nexus+LMS' },
  gallery: [
    { url: 'https://placehold.co/800x500/131F45/FFFFFF?text=Nexus+LMS', publicId: 'nexus-1' },
    { url: 'https://placehold.co/800x500/2B72CF/FFFFFF?text=Dashboard', publicId: 'nexus-2' },
  ],
  preview: {
    url: 'https://example.com',
    mode: 'modal',
    demoNote: { en: 'Demo student credentials ready', ar: 'بيانات تجربة جاهزة' },
    demoCredentials: {
      label: 'Demo Account',
      email: 'demo@bytecraft.dev',
      password: 'Password123',
    },
  },
  techStack: ['React', 'Node.js', 'MongoDB', 'Tailwind CSS'],
  features: [
    { en: 'RTL + LTR dual-language UI', ar: 'واجهة ثنائية اللغة عربي وإنجليزي' },
    { en: 'Dark and Light themes', ar: 'دعم الوضع الفاتح والداكن' },
  ],
  packages: [
    {
      key: 'standard',
      name: { en: 'Standard License', ar: 'الترخيص القياسي' },
      description: { en: 'Complete source code + docs', ar: 'الكود المصدري كامل مع التوثيق' },
      price: 450000,
      supportDays: 30,
      licenseType: 'single',
      isActive: true,
      isPopular: true,
      features: [{ en: 'Full Repository Access', ar: 'وصول كامل للمستودع' }],
    },
    {
      key: 'extended',
      name: { en: 'Extended License', ar: 'الترخيص الموسع' },
      description: { en: 'Multi-client commercial license', ar: 'رخصة تجارية متعددة المشاريع' },
      price: 750000,
      supportDays: 60,
      licenseType: 'multi',
      isActive: true,
      features: [{ en: 'Priority Engineer Onboarding', ar: 'دعم هندسي مباشر' }],
    },
  ],
  reviewsSummary: { average: 4.9, count: 12, averageRating: 4.9, totalReviews: 12 },
  stats: { purchases: 34, views: 540 },
};

const SAMPLE_PLANS = [
  {
    id: 'plan-1',
    group: 'web',
    name: { en: 'Launch Ready', ar: 'باقة الانطلاق' },
    description: { en: 'Production setup + branding', ar: 'تجهيز وإطلاق كامل بالهوية' },
    startingPrice: 350000,
    deliveryDays: 7,
    isPopular: false,
    features: [{ en: 'Custom Domain & SSL', ar: 'ربط الدومين وشهادة الحماية' }],
  },
  {
    id: 'plan-2',
    group: 'systems',
    name: { en: 'Enterprise Platform', ar: 'منصة المؤسسات' },
    description: { en: 'Dedicated architecture & deployment', ar: 'بنية مخصصة ونشر احترافي' },
    startingPrice: 950000,
    deliveryDays: 21,
    isPopular: true,
    features: [{ en: 'API + Admin Console', ar: 'لوحة تحكم كاملة و API' }],
  },
];

const SAMPLE_META = {
  guaranteeDays: 30,
  contact: {
    email: 'hello@bytecraft.dev',
    whatsapp: '+201000000000',
    location: { en: 'Cairo, Egypt', ar: 'القاهرة، مصر' },
    socials: {},
  },
  paymentMethods: {
    vodafone_cash: { enabled: true, accountNumber: '01000000000' },
    instapay: { enabled: true, handle: 'bytecraft@instapay' },
  },
};

const SAMPLE_ORDER = {
  orderNumber: 'ORD-2026-001',
  status: 'paid',
  createdAt: '2026-11-20T10:00:00.000Z',
  snapshot: {
    slug: 'nexus-lms-pro',
    title: SAMPLE_PROJECT.title,
    packageName: SAMPLE_PROJECT.packages[0].name,
  },
  pricing: { subtotal: 450000, discount: 0, total: 450000 },
  payment: { method: 'instapay' },
  delivery: { gitProvider: 'github', gitUsername: 'demo-user' },
};

function buildApiFallback(urlStr) {
  const pathname = new URL(urlStr).pathname;
  if (pathname === '/api/meta') {
    return { status: 200, body: { success: true, data: SAMPLE_META } };
  }
  if (pathname === '/api/categories') {
    return { status: 200, body: { success: true, data: { categories: SAMPLE_CATEGORIES } } };
  }
  if (pathname === '/api/projects') {
    return {
      status: 200,
      body: {
        success: true,
        data: { projects: [SAMPLE_PROJECT] },
        meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
      },
    };
  }
  if (pathname.startsWith('/api/projects/') && pathname.endsWith('/reviews')) {
    return {
      status: 200,
      body: {
        success: true,
        data: { reviews: [] },
        meta: { page: 1, limit: 5, total: 0, totalPages: 1 },
      },
    };
  }
  if (pathname.startsWith('/api/projects/')) {
    return { status: 200, body: { success: true, data: { project: SAMPLE_PROJECT } } };
  }
  if (pathname === '/api/service-plans') {
    return { status: 200, body: { success: true, data: { plans: SAMPLE_PLANS } } };
  }
  if (pathname === '/api/stats' || pathname === '/api/public/stats') {
    return {
      status: 200,
      body: {
        success: true,
        data: { publishedProjects: 8, deliveredOrders: 42, reviewsCount: 18, reviewsAverage: 4.9 },
      },
    };
  }
  if (pathname === '/api/reviews' || pathname === '/api/public/reviews') {
    return {
      status: 200,
      body: {
        success: true,
        data: {
          reviews: [
            {
              _id: 'rev-1',
              customerName: 'Ahmed Hassan',
              rating: 5,
              comment: 'Clean code and super responsive support team.',
              projectTitle: SAMPLE_PROJECT.title,
              projectSlug: SAMPLE_PROJECT.slug,
            },
          ],
        },
      },
    };
  }
  if (pathname.startsWith('/api/orders/')) {
    return { status: 200, body: { success: true, data: { order: SAMPLE_ORDER } } };
  }
  if (pathname.includes('/auth/me')) {
    return { status: 401, body: { success: false, error: { code: 'UNAUTHORIZED', message: 'Not logged in' } } };
  }
  return { status: 200, body: { success: true, data: {} } };
}

function checkUrlReady(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startViteDevServer() {
  const isAlreadyUp = await checkUrlReady(BASE_URL);
  if (isAlreadyUp) {
    return { child: null, url: BASE_URL };
  }

  const viteBin = path.join(FRONTEND_DIR, 'node_modules', 'vite', 'bin', 'vite.js');
  const child = spawn(
    process.execPath,
    [viteBin, '--port', String(VITE_PORT), '--strictPort', '--host', '127.0.0.1'],
    {
      cwd: FRONTEND_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    }
  );

  const startTime = Date.now();
  while (Date.now() - startTime < 30000) {
    if (await checkUrlReady(BASE_URL)) {
      return { child, url: BASE_URL };
    }
    await sleep(300);
  }

  child.kill('SIGTERM');
  throw new Error(`Vite dev server failed to start at ${BASE_URL}`);
}

function stopChild(child) {
  if (!child || child.killed) return Promise.resolve();
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      killer.on('close', () => resolve());
      setTimeout(resolve, 1500);
    } else {
      child.kill('SIGTERM');
      child.on('close', () => resolve());
      setTimeout(resolve, 1500);
    }
  });
}

async function collectDurationViolations(page, contextLabel) {
  return page.evaluate((ctxLabel) => {
    const parseDurationsToMs = (raw) =>
      String(raw || '0s')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          if (part.endsWith('ms')) return parseFloat(part);
          if (part.endsWith('s')) return parseFloat(part) * 1000;
          return parseFloat(part) || 0;
        });

    const isAllowedInfiniteLoader = (el, cs) => {
      if (cs.animationIterationCount !== 'infinite') return false;
      if (
        el.classList.contains('bc-skeleton') ||
        el.classList.contains('animate-spin') ||
        el.classList.contains('animate-ping') ||
        el.classList.contains('animate-pulse')
      ) {
        return true;
      }
      if (el.closest('[role="status"], [aria-busy="true"], .animate-spin, .bc-skeleton')) {
        return true;
      }
      return false;
    };

    const issues = [];
    const elements = document.querySelectorAll('body *');
    for (const el of elements) {
      if (el.closest('iframe')) continue;
      const tag = el.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'link') continue;

      const cs = window.getComputedStyle(el);

      const transMs = parseDurationsToMs(cs.transitionDuration);
      const badTrans = transMs.filter((ms) => ms > 0.01 && Math.abs(ms - 300) > 1);
      if (badTrans.length > 0) {
        issues.push({
          kind: 'transition-duration',
          computed: cs.transitionDuration,
          property: cs.transitionProperty,
          tag,
          id: el.id || '',
          className: typeof el.className === 'string' ? el.className : '',
          context: ctxLabel,
        });
      }

      if (cs.animationName && cs.animationName !== 'none') {
        const animMs = parseDurationsToMs(cs.animationDuration);
        const badAnim = animMs.filter((ms) => ms > 0.01 && Math.abs(ms - 300) > 1);
        if (badAnim.length > 0 && !isAllowedInfiniteLoader(el, cs)) {
          issues.push({
            kind: 'animation-duration',
            computed: cs.animationDuration,
            animationName: cs.animationName,
            tag,
            id: el.id || '',
            className: typeof el.className === 'string' ? el.className : '',
            context: ctxLabel,
          });
        }
      }
    }
    return issues;
  }, contextLabel);
}

async function setPreferences(page, baseUrl, lang, theme) {
  const currentUrl = page.url();
  if (!currentUrl.startsWith(baseUrl)) {
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle2' });
  }
  await page.evaluate((l, t) => {
    window.localStorage.setItem('bc_lang', l);
    window.localStorage.setItem('bc_theme_v3', t);
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    if (t === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, lang, theme);
  await page.reload({ waitUntil: 'networkidle2' });
}

async function safeHoverAndClickInteractive(page, route, allIssues, contextPrefix) {
  // Hover common interactive elements
  const hoverTargets = await page.$$('header a, header button, main a, main button, .bc-card-hover, [data-fm-hover="true"]');
  for (let i = 0; i < Math.min(hoverTargets.length, 6); i += 1) {
    try {
      const box = await hoverTargets[i].boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        await hoverTargets[i].hover();
      }
    } catch {
      // detached element
    }
  }
  allIssues.push(...(await collectDurationViolations(page, `${contextPrefix}:hover`)));

  // Route-specific interactions
  if (route === '/' || route === '/pricing') {
    const tabs = await page.$$('[role="tab"]');
    if (tabs.length > 1) {
      await tabs[1].click().catch(() => {});
      await sleep(80);
      allIssues.push(...(await collectDurationViolations(page, `${contextPrefix}:tab-switch`)));
      await sleep(300);
    }
  }

  if (route === '/pricing') {
    const accordions = await page.$$('button[aria-expanded]');
    for (const btn of accordions.slice(0, 1)) {
      await btn.click().catch(() => {});
      await sleep(100);
      allIssues.push(...(await collectDurationViolations(page, `${contextPrefix}:accordion-open`)));
      await sleep(300);
      await btn.click().catch(() => {});
      await sleep(100);
      allIssues.push(...(await collectDurationViolations(page, `${contextPrefix}:accordion-close`)));
      await sleep(300);
    }
  }

  if (route.startsWith('/projects/')) {
    // Open delivery FAQ accordion & copy button & lightbox / live preview modal
    const expBtn = await page.$('main button[aria-expanded]');
    if (expBtn) {
      await expBtn.click().catch(() => {});
      await sleep(350);
    }
    const copyBtns = await page.$$('button[aria-label*="Copy"], button[aria-label*="نسخ"]');
    if (copyBtns[0]) {
      await copyBtns[0].click().catch(() => {});
      await sleep(100);
      allIssues.push(...(await collectDurationViolations(page, `${contextPrefix}:copy`)));
      await sleep(250);
    }
    const lightboxBtn = await page.$('button[aria-label*="zoom"], button[aria-label*="تكبير"], button[aria-label*="عرض"], button[aria-label*="Lightbox"], button.cursor-zoom-in');
    if (lightboxBtn) {
      await lightboxBtn.click().catch(() => {});
      await sleep(120);
      allIssues.push(...(await collectDurationViolations(page, `${contextPrefix}:lightbox-open`)));
      await sleep(300);
      await page.keyboard.press('Escape');
      await sleep(120);
      allIssues.push(...(await collectDurationViolations(page, `${contextPrefix}:lightbox-close`)));
      await sleep(300);
    }
  }

  if (route.startsWith('/checkout')) {
    const mobileSummaryBtn = await page.$('button[aria-controls="checkout-mobile-summary-panel"]');
    if (mobileSummaryBtn) {
      const box = await mobileSummaryBtn.boundingBox();
      if (box && box.width > 0) {
        await mobileSummaryBtn.click().catch(() => {});
        await sleep(120);
        allIssues.push(...(await collectDurationViolations(page, `${contextPrefix}:checkout-accordion`)));
        await sleep(300);
      }
    }
  }

  if (route === '/login' || route === '/owner/login') {
    const pwToggle = await page.$('button[aria-pressed]');
    if (pwToggle) {
      await pwToggle.click().catch(() => {});
      await sleep(100);
      allIssues.push(...(await collectDurationViolations(page, `${contextPrefix}:password-toggle`)));
      await sleep(300);
    }
  }

  if (route === '/__ui') {
    // Exercise Select, Tabs, Switch, Checkbox, Radio, Modal, Drawer, Accordion on UiShowcase
    const combobox = await page.$('button[role="combobox"]');
    if (combobox) {
      await combobox.click().catch(() => {});
      await sleep(120);
      allIssues.push(...(await collectDurationViolations(page, `${contextPrefix}:select-open`)));
      await page.keyboard.press('Escape');
      await sleep(320);
    }
    const switches = await page.$$('input[role="switch"], input[type="checkbox"], input[type="radio"]');
    for (const sw of switches.slice(0, 3)) {
      await sw.evaluate((el) => el.closest('label')?.click() || el.click()).catch(() => {});
      await sleep(60);
    }
    const uiButtons = await page.$$('main button');
    for (const btn of uiButtons) {
      const info = await btn.evaluate((el) => ({
        label: el.textContent?.trim() || '',
        inDialog: Boolean(el.closest('[role="dialog"]')),
      }));
      if (/open modal|open drawer|confirm|toast|accordion/i.test(info.label) && !info.inDialog) {
        await btn.click().catch(() => {});
        await sleep(120);
        allIssues.push(...(await collectDurationViolations(page, `${contextPrefix}:ui:${info.label}`)));
        await page.keyboard.press('Escape');
        await sleep(320);
      }
    }
    allIssues.push(...(await collectDurationViolations(page, `${contextPrefix}:controls`)));
  }

  // Test theme switch transitions right on home page
  if (route === '/') {
    const themeBtn = await page.$('header button[aria-label*="mode"], header button[aria-label*="الوضع"]');
    if (themeBtn) {
      await themeBtn.click().catch(() => {});
      await sleep(60);
      allIssues.push(...(await collectDurationViolations(page, `${contextPrefix}:theme-toggle`)));
      await sleep(320);
      await themeBtn.click().catch(() => {});
      await sleep(320);
    }
  }
}

async function captureVerificationSequences(page, baseUrl) {
  fs.rmSync(SCREENSHOT_DIR, { recursive: true, force: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  for (const lang of ['en', 'ar']) {
    // 1. Mobile (375x812): Mobile Drawer + Page Transition settled
    await page.setViewport({ width: 375, height: 812 });
    await setPreferences(page, baseUrl, lang, 'light');
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle2' });
    await sleep(400);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `drawer-${lang}-375-closed.png`) });
    const burger = await page.$('header button[aria-expanded]');
    if (burger) {
      await burger.click();
      await sleep(60);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `drawer-${lang}-375-mid.png`) });
      await sleep(320);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `drawer-${lang}-375-open.png`) });
      await page.keyboard.press('Escape');
      await sleep(380);
    }

    // 2. Accordion & Modal at 375 and 1440
    await page.goto(`${baseUrl}/pricing`, { waitUntil: 'networkidle2' });
    await sleep(450);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `pagetransition-${lang}-375-settled.png`) });
    const faqBtnMobile = await page.$('main button[aria-expanded]');
    if (faqBtnMobile) {
      await faqBtnMobile.scrollIntoViewIfNeeded?.().catch(() => {});
      await faqBtnMobile.click();
      await sleep(380);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `accordion-${lang}-375-open.png`) });
    }

    await page.goto(`${baseUrl}/projects/nexus-lms-pro`, { waitUntil: 'networkidle2' });
    await sleep(450);
    const zoomBtnMobile = await page.$('button[aria-label*="lightbox"], button.cursor-zoom-in');
    if (zoomBtnMobile) {
      await zoomBtnMobile.click();
      await sleep(380);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `modal-${lang}-375-open.png`) });
      await page.keyboard.press('Escape');
      await sleep(380);
    }

    // 3. Desktop (1440x900): Page Transition, Accordion, Modal
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle2' });
    await sleep(450);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `pagetransition-${lang}-1440-start.png`) });

    const pricingNavLink = await page.$('header nav a[href="/pricing"]');
    if (pricingNavLink) {
      await pricingNavLink.click();
      await sleep(100);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `pagetransition-${lang}-1440-mid.png`) });
      await sleep(280);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `pagetransition-${lang}-1440-enter.png`) });
      await sleep(350);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `pagetransition-${lang}-1440-settled.png`) });
    }

    // Accordion on /pricing 1440
    const faqBtnDesktop = await page.$('main button[aria-expanded]');
    if (faqBtnDesktop) {
      await faqBtnDesktop.scrollIntoViewIfNeeded?.().catch(() => {});
      await sleep(200);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `accordion-${lang}-1440-closed.png`) });
      await faqBtnDesktop.click();
      await sleep(380);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `accordion-${lang}-1440-open.png`) });
    }

    // Modal open & close on /projects/nexus-lms-pro 1440
    await page.goto(`${baseUrl}/projects/nexus-lms-pro`, { waitUntil: 'networkidle2' });
    await sleep(450);
    const zoomBtnDesktop = await page.$('button[aria-label*="lightbox"], button.cursor-zoom-in');
    if (zoomBtnDesktop) {
      await zoomBtnDesktop.click();
      await sleep(380);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `modal-${lang}-1440-open.png`) });
      await page.keyboard.press('Escape');
      await sleep(140);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `modal-${lang}-1440-midclose.png`) });
      await sleep(260);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `modal-${lang}-1440-closed.png`) });
    }
  }
}

async function run() {
  const { child, url: baseUrl } = await startViteDevServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const allIssues = [];
  const consoleErrors = [];

  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on('request', (req) => {
      const reqUrl = req.url();
      let parsedUrl;
      try {
        parsedUrl = new URL(reqUrl);
      } catch {
        return req.continue();
      }
      if (parsedUrl.pathname.startsWith('/api/')) {
        const mock = buildApiFallback(reqUrl);
        return req.respond({
          status: mock.status,
          contentType: 'application/json',
          body: JSON.stringify(mock.body),
        });
      }
      if (reqUrl.startsWith('https://placehold.co/')) {
        return req.respond({
          status: 200,
          contentType: 'image/svg+xml',
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="#2B72CF"/></svg>',
        });
      }
      return req.continue();
    });

    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

    const routesToAudit = [
      '/',
      '/projects',
      '/projects/nexus-lms-pro',
      '/pricing',
      '/about',
      '/contact',
      '/checkout?project=nexus-lms-pro&package=standard',
      '/orders/ORD-2026-001?token=demo-token',
      '/payment/result?orderNumber=ORD-2026-001&status=paid',
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password?token=demo',
      '/verify-email?token=demo',
      '/owner/login',
      '/__ui',
      '/not-found-test',
    ];

    // Audit across all language x theme combinations (desktop 1440 + mobile 375 sample)
    const combinations = [
      { lang: 'en', theme: 'light', viewport: { width: 1440, height: 900 } },
      { lang: 'en', theme: 'dark', viewport: { width: 1440, height: 900 } },
      { lang: 'ar', theme: 'light', viewport: { width: 1440, height: 900 } },
      { lang: 'ar', theme: 'dark', viewport: { width: 375, height: 812 } },
    ];

    for (const combo of combinations) {
      await page.setViewport(combo.viewport);
      await setPreferences(page, baseUrl, combo.lang, combo.theme);

      for (const route of routesToAudit) {
        const ctx = `${combo.lang}|${combo.theme}|${combo.viewport.width}|${route}`;
        await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle2' });
        await sleep(380);
        const bodyLen = await page.evaluate(() => document.body.innerText.trim().length);
        if (bodyLen < 5) {
          consoleErrors.push(`Empty render at ${ctx}`);
        }
        allIssues.push(...(await collectDurationViolations(page, ctx)));
        await safeHoverAndClickInteractive(page, route, allIssues, ctx);
      }

      // Check MobileMenu drawer specifically on mobile viewport
      if (combo.viewport.width === 375) {
        await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle2' });
        await sleep(360);
        const burger = await page.$('header button[aria-expanded]');
        if (burger) {
          await burger.click();
          await sleep(120);
          allIssues.push(...(await collectDurationViolations(page, `${combo.lang}|${combo.theme}|375|mobile-drawer-open`)));
          await sleep(250);
          await page.keyboard.press('Escape');
          await sleep(350);
        }
      }
    }

    await captureVerificationSequences(page, baseUrl);

    // Deduplicate identical element reports for readable output
    const uniqueMap = new Map();
    for (const issue of allIssues) {
      const key = `${issue.kind}|${issue.tag}|${issue.computed}|${issue.property || issue.animationName}|${issue.className}|${issue.context}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, issue);
      }
    }
    const violations = Array.from(uniqueMap.values());

    console.log('=== BYTE_CRAFT MOTION CHECK RESULTS ===');
    console.log('Violations count:', violations.length);
    if (violations.length > 0) {
      console.log(JSON.stringify(violations, null, 2));
    } else {
      console.log('VIOLATIONS: [] (Empty — every audited element transition/animation duration is 300ms!)');
    }
    if (consoleErrors.length > 0) {
      console.log('Page errors:', consoleErrors);
    }
    console.log('Screenshots saved in:', SCREENSHOT_DIR);

    if (violations.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    await stopChild(child);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
