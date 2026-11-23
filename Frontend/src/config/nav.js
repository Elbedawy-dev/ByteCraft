import { ROUTES } from './routes';

export const PUBLIC_NAV_ITEMS = [
  { key: 'home', labelKey: 'nav.home', defaultLabel: 'الرئيسية', to: ROUTES.HOME, end: true },
  { key: 'projects', labelKey: 'nav.projects', defaultLabel: 'المشاريع الجاهزة', to: ROUTES.PROJECTS },
  { key: 'pricing', labelKey: 'nav.pricing', defaultLabel: 'باقات الأسعار', to: ROUTES.PRICING },
  { key: 'about', labelKey: 'nav.about', defaultLabel: 'عن بايت كرافت', to: ROUTES.ABOUT },
  { key: 'contact', labelKey: 'nav.contact', defaultLabel: 'تواصل معنا', to: ROUTES.CONTACT },
];

export const navLinks = PUBLIC_NAV_ITEMS;

export const FOOTER_QUICK_LINKS = [
  { key: 'projects', labelKey: 'footer.links.projects', defaultLabel: 'المشاريع والمنصات الجاهزة', to: ROUTES.PROJECTS },
  { key: 'pricing', labelKey: 'footer.links.pricing', defaultLabel: 'باقات الأسعار والخدمات البرمجية', to: ROUTES.PRICING },
  { key: 'about', labelKey: 'footer.links.about', defaultLabel: 'منهجية العمل والخبرات التقنية', to: ROUTES.ABOUT },
  { key: 'customBuild', labelKey: 'footer.links.customBuild', defaultLabel: 'طلب منصة مخصصة (Custom Build)', to: ROUTES.CONTACT, accent: true },
];

export const footerQuickLinks = FOOTER_QUICK_LINKS;

export const FOOTER_SERVICE_LINKS = [];

export const footerServiceLinks = FOOTER_SERVICE_LINKS;

export const FOOTER_TECH_BADGES = [
  { name: 'MongoDB', label: 'MongoDB', tone: 'secondary' },
  { name: 'Express.js', label: 'Express.js', tone: 'neutral' },
  { name: 'React.js', label: 'React.js', tone: 'primary' },
  { name: 'Node.js', label: 'Node.js', tone: 'tertiary' },
  { name: 'TailwindCSS', label: 'TailwindCSS', tone: 'neutral' },
];

export const techBadges = FOOTER_TECH_BADGES;
