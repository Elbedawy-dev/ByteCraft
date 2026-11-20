const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function capture() {
  const outputDir = path.resolve(__dirname, '../.screenshots/1');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const viewports = [
    { name: '375', width: 375, height: 812 },
    { name: '768', width: 768, height: 1024 },
    { name: '1440', width: 1440, height: 900 },
  ];

  const langs = ['ar', 'en'];
  const themes = ['dark', 'light'];

  const page = await browser.newPage();

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });

    for (const lang of langs) {
      for (const theme of themes) {
        // Go to page
        await page.goto('http://localhost:5173/__ui', { waitUntil: 'networkidle0' });

        // Set state in localStorage & document
        await page.evaluate((l, t) => {
          localStorage.setItem('bc_lang', l);
          localStorage.setItem('bc_theme', t);
          document.documentElement.setAttribute('lang', l);
          document.documentElement.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr');
          if (t === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
          }
        }, lang, theme);

        // Reload to let i18n & react load with these keys
        await page.reload({ waitUntil: 'networkidle0' });
        await new Promise((r) => setTimeout(r, 600));

        const fileName = `${vp.name}-${lang}-${theme}.png`;
        const filePath = path.join(outputDir, fileName);

        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`Saved screenshot: ${fileName}`);

        // If on 375px in ar/dark, also open the mobile menu drawer and capture
        if (vp.name === '375' && lang === 'ar' && theme === 'dark') {
          const menuBtn = await page.$('button[aria-label="Open main navigation menu"]');
          if (menuBtn) {
            await menuBtn.click();
            await new Promise((r) => setTimeout(r, 400));
            const drawerPath = path.join(outputDir, '375-mobile-drawer.png');
            await page.screenshot({ path: drawerPath });
            console.log('Saved screenshot: 375-mobile-drawer.png');
          }
        }
      }
    }
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
