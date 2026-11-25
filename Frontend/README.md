# Nexus Front End

Welcome to the Front End of **Nexus** — full-stack software marketplace, custom engineering studio, and owner management console.
Built according to [`docs/frontend-contract.md`](../docs/frontend-contract.md), [`docs/design-conformance.md`](../docs/design-conformance.md), and [`docs/API.md`](../docs/API.md).

---

## 1. Stack & Core Architecture

| Layer | Technology / Configuration | Notes |
| :--- | :--- | :--- |
| **Brand Identity** | `Nexus` / `NEXUS` (`src/config/brand.js`) | Ribbon `N` `LogoMark` + `BrandLogo` (`tone="auto"` / `tone="light"`), fixed `<title>Nexus</title>`, `public/favicon.svg` |
| **Runtime** | React 18.3 (JSX) + Vite 6 | Proxies `/api` and `/uploads` to `VITE_DEV_API_TARGET` (`http://localhost:5000`, or `http://localhost:5001` in test mode) |
| **Routing** | React Router v6.30 | Auto-discovers route modules via `pages/**/routes.jsx` with lazy-loaded route chunks |
| **Styling & Themes** | Tailwind CSS v3.4 (`darkMode: 'class'`) | Dual fully designed themes (**Light** default + **Dark**) driven by `--bc-*` RGB CSS variables |
| **Typography** | `Plus Jakarta Sans` (EN) & `Cairo` (AR) | Self-hosted (`400–800`) via `@fontsource/plus-jakarta-sans` and `@fontsource/cairo` |
| **Icons** | Material Symbols **Rounded** | Self-hosted via `material-symbols/rounded.css` with `.icon-gradient` fills |
| **Data Layer** | `@tanstack/react-query` v5 | Real API data only (`projects`, `categories`, `service-plans`, `meta`, `stats/public`, `reviews/latest`) |
| **Forms & Validation** | `react-hook-form` + `zod` | Accessible field errors + automatic server validation mapping via `applyApiErrorsToForm` |
| **Charts** | `recharts` | Theme-reactive Light & Dark palettes on the Owner Dashboard |
| **i18n & Direction** | `i18next` + `react-i18next` | Arabic (`ar`, RTL) & English (`en`, LTR) persisted in `bc_lang` |

---

## 2. Folder Structure

```text
Frontend/src/
  api/
    client.js                 # Central fetch client, cookie credentials, 401 redirect & ApiError mapping
    auth.js                   # Session (/api/auth/me), login, register, logout, verify email, password reset
    account.js                # Customer profile, password, claim guest orders, session-mode orders
    home.js                   # Featured/portfolio projects, /api/stats/public, /api/reviews/latest
    meta.js                   # Public contact, social links, payment methods, registrationEnabled (/api/meta)
    owner/                    # Authenticated admin console API hooks (dashboard, projects, orders, users, admins, settings, …)
    ...                       # projects.js, checkout.js, orderTracking.js, servicePlans.js, inquiries.js
  app/
    router.jsx                # Dynamic route collector + lazy suspense loader
    providers.jsx             # QueryClient, Lang (bc_lang), Theme (bc_theme_v3), Toast, AuthProvider
    ErrorBoundary.jsx         # Top-level crash recovery screen
  components/
    ui/                       # Pill Button, Card, Input, custom portal Select, Modal, Drawer, ConfirmDialog, Tabs, Pagination, Table, etc.
    shared/                   # LogoMark/BrandLogo, HeroCubes, SectionHeader/TwoToneText, ProjectCard, CtaBanner, Accordion, etc.
    layout/                   # PublicLayout (Navbar, UserMenu, MobileMenu, Footer) & OwnerLayout (Navy sidebar + topbar)
  config/
    brand.js                  # BRAND = { name: 'Nexus', wordmark: 'NEXUS' }
    routes.js                 # Route path constants & getSafeRedirectPath / loginPath helpers
    nav.js / ownerNav.js      # Public & owner navigation items
  features/<domain>/          # Domain-scoped feature sections (auth, account, checkout, orders, owner*, …)
  pages/<area>/               # Lazy-loaded page entrypoints + routes.jsx (public, auth, account, owner*)
  i18n/
    index.js                  # Locale loader
    locales/{ar,en}/*.json    # Bilingual translation namespaces
  lib/
    money.js                  # Integer piasters <-> EGP helpers & formatMoney
    format.js                 # Cairo timezone dates, Western numbers, file sizes
    localized.js              # Bilingual field resolver localized(obj, lang)
    storage.js                # Safe localStorage / sessionStorage keys (bc_lang, bc_theme_v3, bc_session_hint, bc_order_token_*)
  styles/
    index.css                 # Light (:root) & Dark (:root.dark) tokens, typography, gradients, scrollbars
```

---

## 3. Dual Theme System (Light Default + Dark)

- **Default Theme**: **Light** (`light`) on first visit regardless of OS preference.
- **Storage Key**: `bc_theme_v3` in `localStorage`.
- **Zero-Flash Paint**: An inline early script in `index.html` applies `html.dark` and updates `<meta name="color-scheme">` and `<meta name="theme-color">` before first paint.
- **Smooth Switching**: `44px` (`rounded-full`) sun/moon toggles in the public `Navbar`, `MobileMenu`, `OwnerLayout` top bar, and `OwnerLoginPage` animate surface, text, and border colors over `300ms`.

### Token Summary

| Token Role | Light (`:root`) | Dark (`:root.dark`) |
| :--- | :--- | :--- |
| **Page Canvas** | `#FFFFFF` | `#0B1020` |
| **Soft Band / Soft Card** | `#F5F7FC` | `#0F1730` |
| **Card Surface** | `#FFFFFF` | `#121B38` |
| **Border / Strong Border** | `#E6EAF5` / `#CBD3EC` | `#222D52` / `#33417A` |
| **Headings / Body / Muted** | `#0A1134` / `#3D4468` / `#5C6289` | `#F2F5FF` / `#C3CCEA` / `#97A2CB` |
| **Placeholder** | `#9AA1C2` | `#6F7AA6` |
| **Brand Solid** | `#4150B0` | `#8EA2FF` |
| **Brand Soft (Bg / Text)** | `#E5EDFA` / `#3A3F8F` | `#1B2550` / `#B9C6FF` |
| **Brand Gradient** | `linear-gradient(90deg, #2B72CF 0%, #5443A9 100%)` (text `#FFFFFF`) | Same gradient (text `#FFFFFF`) |
| **Footer & Owner Sidebar** | `#131F45` (text `#C9D0EE`) | `#070B1A` (text `#AEB8DE`) |
| **Success / Warning / Danger** | `#0E9F6E` (`#067A55` text) / `#B45309` / `#C81E1E` | `#34D399` / `#FBBF24` / `#F87171` |
| **Chart Palette** | `#2B72CF #5443A9 #8FD0FF #6A5BDB #0E9F6E #F59E0B` | `#5B9BFF #8B7CFF #8FD0FF #6A5BDB #34D399 #FBBF24` |

---

## 4. Development & Verification Commands

Run all commands inside `Frontend/` (PowerShell):

```powershell
# Start local dev server against main backend (default port 5000)
npm run dev

# Start local dev server on port 5171 against isolated test backend (port 5001 / bytecraft_test)
$env:VITE_DEV_API_TARGET="http://localhost:5001"; npm run dev -- --port 5171

# Lint (ESLint — must pass with 0 errors and 0 warnings)
npm run lint

# Production build (Vite — must pass with 0 errors and 0 warnings)
npm run build

# Motion verification & sequence screenshots (Puppeteer, saved in Frontend/.screenshots/D/)
node scripts/checkMotion.cjs
```

### Authentication & Customer Accounts
- Root `AuthProvider` (`src/features/auth/AuthProvider.jsx`) exposes `useAuth()` backed by `GET /api/auth/me` (and `useOwner()` delegates to `useAuth()`).
- Public auth pages (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`) use `PublicLayout` with a centered `rounded-3xl` card and top `BrandLogo`; `/owner/login` redirects cleanly to `/login`.
- Customer portal (`/account`, `/account/orders`, `/account/orders/:orderNumber`) is guarded by `<RequireAuth>` and supports checkout prefill, verification resend, guest order claiming, password changes, account deletion, and session-mode order tracking/reviews.
- Admin management pages `/owner/users` and `/owner/admins` plus the `registrationEnabled` toggle in `/owner/settings` live under `OwnerLayout` (showing a `403` view with a `/account` link if visited by a non-admin customer).

### UI Component Test Bench
Open `/__ui` in development (e.g., `http://localhost:5171/__ui`) to inspect `BrandLogo`, `HeroCubes`, `.icon-gradient` chips, pill buttons, custom `Select` portals, forms, cards, tables, modals, drawers, toasts, and empty/error states in both **Light** and **Dark** themes and **AR (RTL)** / **EN (LTR)**.

### Motion System (`framer-motion`)
- **Tokens & Provider**: `src/lib/motion.js` defines `MOTION_DURATION = 0.3`, `MOTION_EASE = [0.4, 0, 0.2, 1]`, `STAGGER_DELAY = 0.06`, RTL-aware variants (`fade`, `fadeUp`, `scaleIn`, `slideFromEnd`, `slideUp`, `sheetSlideUp`, `pageTransition`, `stagger`), and `useAnimatedNativeDialog`. `MotionProvider` in `src/app/providers.jsx` wraps the app with `<MotionConfig reducedMotion="user">` and `<LazyMotion features={domAnimation} strict>`.
- **Primitives (`src/components/ui/Motion.jsx`)**: Exports `<Reveal>`, `<Stagger>`, `<StaggerItem>`, `<MotionImage>`, `<LayoutMotion>` (lazy-loading `src/lib/motionLayout.js` for shared `layoutId` indicators), and `<AnimatedOutlet>` (`AnimatePresence mode="wait" initial={false}` page transitions with scroll-to-top in `onExitComplete`).
- **Timing & Reduced Motion**: All transitions, CSS tokens (`--duration-base: 300ms` / `--ease-base: cubic-bezier(0.4, 0, 0.2, 1)`), Tailwind default transitions (`300ms`), accordions, tabs, native `<dialog>` modals/drawers, interactive cards (`y: -4`), buttons (`whileTap` `0.98`), and Recharts (`animationDuration={300}`) enforce `300ms` timing (only infinite spinners/skeletons/pings are excluded). `HeroCubes` enters once from the `end` side (`0.3s`) without slow idle floating so the strict `300ms` rule holds everywhere. Run `node scripts/checkMotion.cjs` to audit computed durations across all routes, themes, and directions.
