# ByteCraft Front End Foundation

Welcome to the Front End of **ByteCraft** — high-performance digital studio and platform engine.
This foundation was created by Prompt 1 strictly according to `docs/frontend-contract.md`, `docs/stitch/bytecraft_studio_engine/DESIGN.md`, and `docs/API.md`.

---

## 1. Stack & Fixed Versions

| Technology | Version / Configuration | Notes |
| :--- | :--- | :--- |
| **Runtime / Library** | React 18.3.1 (JSX) | Strictly React 18 for full ecosystem compatibility |
| **Bundler & Dev Server** | Vite 6 | Proxying `/api` and `/uploads` to `VITE_DEV_API_TARGET` (default port 5000; port 5001 in test mode) |
| **Routing** | React Router v6.30 | Auto-collects routes from `pages/**/routes.jsx` |
| **Styling** | TailwindCSS v3.4 + PostCSS | Custom color tokens based on CSS variables with alpha support |
| **Icons** | Material Symbols Outlined | Self-hosted via npm package `material-symbols` (zero CDN hotlinking) |
| **Typography** | Cairo (Arabic) & Inter (English) | Self-hosted via `@fontsource/cairo` and `@fontsource/inter` |
| **Data Fetching** | `@tanstack/react-query` v5 | Central `queryClient` with 1m staleTime, namespaced queries |
| **Forms & Validation** | `react-hook-form` + `zod` | Server errors automatically mapped via `applyApiErrorsToForm` |
| **i18n & Direction** | `i18next` + `react-i18next` | Arabic default (RTL), English toggle (LTR), auto-loaded namespaces |

> [!IMPORTANT]
> **No new npm packages can be installed by subsequent prompts.** All dependencies needed by Prompts 2–10 are already installed.

---

## 2. Folder Structure & Ownership Rules

```
Frontend/src/
  api/
    client.js                 # Central API client & error handling (Owned by Prompt 1)
    meta.js                   # Hook useMeta() for /api/meta (Prompt 1)
    <domain>.js               # Domain APIs: projects.js, orders.js, etc. (Owned by their feature prompt)
  app/
    router.jsx                # Auto-discovers pages/**/routes.jsx (Prompt 1)
    providers.jsx             # React Query, Lang, Theme, Toast providers (Prompt 1)
    ErrorBoundary.jsx         # Catch-all error boundary (Prompt 1)
  components/
    ui/                       # 23 Core UI primitives (Prompt 1 - READ ONLY)
    shared/                   # ProjectCard, Rating, PriceTag, CtaBanner, etc. (Prompt 1 - READ ONLY)
    layout/                   # PublicLayout, Navbar, MobileMenu, Footer (Prompt 1) · OwnerLayout (Placeholder by 1, real by 8)
  config/
    routes.js                 # Path constants (ROUTES.*) (Prompt 1)
    nav.js                    # Public navigation & footer links (Prompt 1)
    ownerNav.js               # Owner sidebar navigation & icons (Prompt 1)
  features/<name>/            # Feature components & hooks (Owned by parallel prompts 2–10)
  pages/<area>/               # Page components + routes.jsx (Owned by parallel prompts 2–10)
  i18n/
    index.js                  # Auto-loaders for locales (Prompt 1)
    locales/{ar,en}/          # JSON namespaces (common.json by 1; others by respective prompts)
  lib/
    money.js                  # Piasters <-> EGP & formatMoney (Prompt 1)
    format.js                 # Dates (Cairo timezone), numbers, file sizes (Prompt 1)
    localized.js              # Bilingual reader helper: localized(obj, lang) (Prompt 1)
    storage.js                # Safe localStorage / sessionStorage wrappers (Prompt 1)
  styles/
    index.css                 # CSS variables, tokens, fonts, button gradient, scrollbars (Prompt 1)
```

### Strict Rules for Parallel Prompts (2–10):
1. **Scope Boundary**: Only create or modify files inside your own `features/<name>/`, `pages/<area>/`, `api/<domain>.js`, and `i18n/locales/{ar,en}/<namespace>.json`.
2. **Never modify shared folders**: Do NOT touch `components/ui/`, `components/shared/`, `api/client.js`, `app/*`, `config/*`, `lib/*`, `styles/*`, `package.json`, or configuration files. If you need special behavior, compose or wrap the shared primitive inside your own `features/` folder.
3. **No Mock Data**: All dynamic data must flow from the API. Marketing and static copy belong exclusively in `i18n/locales/{ar,en}/<namespace>.json`.
4. **No Direct Images from Stitch Export**: Stitch `googleusercontent` URLs expire rapidly. Always use API images or neutral fallback placeholders.

---

## 3. Router & Page Registration

Every page area registers itself by placing a `routes.jsx` inside its folder (e.g. `src/pages/marketplace/routes.jsx`).

```jsx
// src/pages/marketplace/routes.jsx
import React, { lazy } from 'react';
import { ROUTES } from '@/config/routes';

const MarketplacePage = lazy(() => import('./MarketplacePage'));

export default {
  layout: 'public', // 'public' (Navbar + Footer) | 'owner' (Sidebar shell) | 'none'
  routes: [
    {
      path: ROUTES.PROJECTS,
      element: <MarketplacePage />,
    },
  ],
};
```

The router dynamically auto-discovers all `routes.jsx` files via `import.meta.glob('../pages/**/routes.jsx', { eager: true })`.

---

## 4. Internationalization & RTL / LTR

- **Default Language**: Arabic (`ar`, RTL). English (`en`, LTR) is the secondary language.
- **Persistence**: Persisted in `localStorage` under `bc_lang`.
- **Hooks & Helpers**:
  ```jsx
  import { useTranslation } from 'react-i18next';
  import { useLang } from '@/app/providers';
  import { localized } from '@/lib/localized';

  function MyComponent({ project }) {
    const { t } = useTranslation('marketplace'); // loads locales/{ar,en}/marketplace.json automatically
    const { lang, dir } = useLang(); // 'ar'|'en', 'rtl'|'ltr'
    const title = localized(project.title, lang); // resolves { ar: "...", en: "..." }
    
    return <h1>{title}</h1>;
  }
  ```
- **Logical Tailwind Classes Only**:
  - Use `ms-*` / `me-*` instead of `ml-*` / `mr-*`.
  - Use `ps-*` / `pe-*` instead of `pl-*` / `pr-*`.
  - Use `start-*` / `end-*` instead of `left-*` / `right-*`.
  - Use `text-start` / `text-end` instead of `text-left` / `text-right`.
- **Directional Icons**: Use `rtl:-scale-x-100` on chevrons and directional arrows (`arrow_forward`, `arrow_back`, `chevron_right`).
- **Codes & Numbers**: Render emails, phone numbers, URLs, and git usernames inside `<bdi dir="ltr">` or inputs with `dir="ltr"`. Numbers always use Western numerals (`1, 2, 3...`).

---

## 5. API Client & Data Layer

Call backend endpoints using `client` from `@/api/client`:

```javascript
import { client, ApiError, applyApiErrorsToForm } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useProjects(filters) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => client.get('/api/projects', { params: filters }),
  });
}
```

### Error Handling in Forms:
```javascript
const onSubmit = async (values) => {
  try {
    await submitMutation.mutateAsync(values);
  } catch (err) {
    if (err instanceof ApiError && err.status === 400 && err.details) {
      applyApiErrorsToForm(err, setError); // Maps field-level server errors to react-hook-form
    } else {
      toast.error(err.message);
    }
  }
};
```

### Money Conventions:
- **Backend Representation**: All prices in the API are integer **piasters** (`100 piasters = 1 EGP`).
- **Display**: Use `formatMoney(piasters, lang)` from `@/lib/money` (outputs `5,800 ج.م` in Arabic and `EGP 5,800` in English).
- **Owner Form Entry**: The owner types EGP in forms. Convert using `egpToPiasters(egp)` before submitting. Never compute totals or taxes on the client.

### Anti-Spam Honeypot:
Public forms (`/inquiries`, `/orders`) must include the invisible honeypot field:
```jsx
import { HoneypotField } from '@/components/ui';

// Inside your form:
<HoneypotField register={register} />
```

---

## 6. UI Primitives & Design Tokens (Light-First Theme)

### Theme & Storage Key:
- **Default Theme**: Light (`light`). Persisted in `localStorage` under `bc_theme_v2` (bumped so users who previously had `dark` saved start in the new light theme). Dark mode remains functional via the theme toggle (`html.dark`).

### Light Theme Palette (`src/styles/index.css` & `tailwind.config.js` — White + Mint):
- **Page / Canvas Background** (`bg-background` / `bg-surface`): `#FFFFFF`
- **Alternate Section Band & Footer** (`bg-section-band`): `#F6FBF8`
- **Cards (Mint-White)** (`bg-card` / `bg-surface-container`): `#F8FCFA`
  - **Card Border** (`border-card-border`): `#E2EEE8` (1px solid)
  - **Card Default Shadow** (`shadow-card`): `0 1px 2px rgba(15,23,42,.05), 0 10px 30px -12px rgba(15,23,42,.10)`
  - **Clickable Card Hover**: background `#FFFFFF` (`bg-card-hover`), border `#BFEBD5` (`border-card-hover-border`), `translateY(-2px)`, hover shadow `0 16px 40px -14px rgba(16,185,129,.25)` (`shadow-card-hover`).
- **Typography & Borders (Cool Slate)**:
  - Primary (`text-on-surface`): `#0F172A`
  - Secondary (`text-on-surface-variant`): `#475569`
  - Muted (`text-muted`): `#64748B`
  - Borders (`border-outline-variant`): `#E2E8F0`
  - All three text tokens achieve ≥ 4.5:1 contrast on `#FFFFFF`, `#F8FCFA`, and `#F6FBF8`.
- **Inputs (`Input`, `Select`, `Textarea`, `TagInput`)**:
  - Background (`bg-input`): `#FFFFFF`
  - Border (`border-input-border`): `#CBD5E1`
  - Focus Ring (`focus:ring-input-focus`): 2px `#10B981`
  - Placeholder (`placeholder:text-placeholder`): `#94A3B8`
- **Navbar, Footer, Hero & Overlays**:
  - Navbar: white 90% (`bg-surface/90`) with backdrop blur + bottom border `#E2E8F0`; nav pill `#F1F5F9` (`bg-nav-pill`) with active item `#E6FAF1` (`bg-nav-active-bg`) and text `#047857`; language/theme toggle buttons are white (`#FFFFFF`) with `#E2E8F0` border and `#F1F5F9` hover.
  - Footer: `#F6FBF8` (`bg-section-band`) with top border `#E2E8F0`.
  - Hero headers (`.bc-hero-wash`): soft radial `#DDF9EC` at top end + radial `#E3EEFF` at top start fading to `#FFFFFF`.
  - Modals / Drawers: white panels (`#FFFFFF`) over overlay `rgba(15,23,42,.45)` (`bg-overlay`).
- **Brand, Icon Chips & Statuses**:
  - Filled Button Gradient (`btn-primary-gradient`): `linear-gradient(90deg, #52E982 0%, #19ECB5 100%)` with text `#0A0A0A` and glow `0 10px 24px -8px rgba(25,236,181,.45)`.
  - Readable Green Text / Links / Icons / Active Nav / Charts (`text-primary`): `#047857` (≥ 5:1 contrast).
  - Clean Pastel Icon Chips & Badges (6 pairs, all ≥ 4.5:1):
    - Mint (`.bc-chip-mint`): `#E1F8EE` / `#047857`
    - Violet (`.bc-chip-violet`): `#EEE6FF` / `#6D28D9`
    - Sky (`.bc-chip-sky`): `#E0F2FE` / `#0369A1`
    - Amber (`.bc-chip-amber`): `#FEF3C7` / `#B45309`
    - Rose (`.bc-chip-rose`): `#FFE4E6` / `#BE123C`
    - Blue (`.bc-chip-blue`): `#E0EAFF` / `#1D4ED8`
  - Stars (`text-star`): `#F59E0B`
  - Semantic Statuses: success `#047857`, warning `#B45309`, danger `#B91C1C`, info `#1D4ED8`
  - **Intentional Dark Contrast Element**: Only the decorative code/terminal window in the Home hero (`#0F172A`, `.bc-code-window`) remains dark.

### Buttons (`@/components/ui/Button`):
- **Variants**:
  - `primary-gradient`: `#52E982 → #19ECB5`, text `#0A0A0A` (never white), glow `0 10px 24px -8px rgba(25,236,181,.45)` (`btn-primary-gradient`).
  - `outline`: `#047857` border and text with soft mint hover tint.
  - `ghost`: Subtle `#F1F5F9` hover surface.
  - `secondary`: Clean white surface (`#FFFFFF`) with `#CBD5E1` border and `#F1F5F9` hover.
  - `danger`: `#B91C1C` background with white text (`#FFFFFF`).
- **Sizes**: `sm` (40px), `md` (48px - default), `lg` (56px), `icon`, `icon-sm`.

### Form Layout Rules:
- Height: 48px (`h-12`).
- Radius: 8px (`rounded-lg`).
- Label above control with 8px gap (`mb-2`).
- Required field marker: primary-colored `*` after label.
- Gap between fields: 20px (`gap-5`).
- Hint/error below control: 12–13px (`mt-2`).
- Select: styled native `<select>` with `appearance-none` and custom chevron on the `end` side (`pe-10`).

### Interactive Showcase:
Browse `http://localhost:5173/__ui` in your local development environment to visually inspect all 23 primitives and 10 shared components across all states (default, hover, focus, error, disabled, loading) in light and dark modes.
