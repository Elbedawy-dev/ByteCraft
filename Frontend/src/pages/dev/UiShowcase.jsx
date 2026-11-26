import React, { useState } from 'react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  RadioCard,
  Switch,
  FormField,
  Badge,
  Card,
  Modal,
  Drawer,
  ConfirmDialog,
  Tabs,
  Pagination,
  Skeleton,
  Spinner,
  Tooltip,
  FileDropzone,
  TagInput,
  CopyButton,
  Table,
} from '../../components/ui';
import {
  BrandLogo,
  HeroCubes,
  ProjectCard,
  Rating,
  PriceTag,
  SectionHeader,
  Breadcrumbs,
  Accordion,
  CtaBanner,
  StatusBadge,
  EmptyState,
  ErrorState,
} from '../../components/shared';
import { BRAND } from '../../config/brand';
import { useToast, useLang, useTheme } from '../../app/providers';

export default function UiShowcase() {
  const toast = useToast();
  const { lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();

  // Dialog & drawer states
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Form states
  const [switchVal, setSwitchVal] = useState(true);
  const [checkboxVal, setCheckboxVal] = useState(true);
  const [radioVal, setRadioVal] = useState('pro');
  const [tags, setTags] = useState(['React', 'Node.js', 'TailwindCSS', 'Express']);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(3);

  // Mock project object for visual inspection
  const sampleProject = {
    id: 'proj_sample_1',
    slug: 'storecraft-elite',
    title: {
      ar: 'متجر نيكسوس المتقدم',
      en: 'Nexus Commerce Elite',
    },
    tagline: {
      ar: 'متجر إلكتروني فائق السرعة، تحكم مرن في المخزون، وعربة تسوق فورية دون مغادرة الصفحة مع دعم Paymob.',
      en: 'High-speed e-commerce platform with flexible inventory management and seamless instant cart checkout.',
    },
    category: {
      id: 'cat_ecom',
      name: {
        ar: 'متجر إلكتروني',
        en: 'E-Commerce',
      },
    },
    techStack: ['React 18', 'Node.js', 'MongoDB', 'TailwindCSS', 'Paymob'],
    startingPrice: 580000, // 5,800 EGP in piasters
    reviewsSummary: {
      averageRating: 4.9,
      totalReviews: 28,
    },
    demoUrl: 'https://example.com/demo',
    packages: [
      { key: 'starter', name: 'Starter', price: 580000, isActive: true },
      { key: 'pro', name: 'Pro', price: 950000, isActive: true },
    ],
  };

  return (
    <div className="w-full max-w-container mx-auto px-4 sm:px-6 py-10 space-y-16">
      {/* Dev Controls Bar */}
      <div className="p-4 rounded-2xl bg-card/90 border border-card-border flex flex-wrap items-center justify-between gap-4 sticky top-24 z-30 backdrop-blur-md shadow-card">
        <div className="flex items-center gap-4">
          <BrandLogo tone="auto" size="sm" />
          <Badge variant="primary" size="lg">
            UI Test Bench
          </Badge>
          <span className="text-xs text-on-surface-variant font-mono">
            Lang: <strong className="text-primary">{lang.toUpperCase()}</strong> | Theme: <strong className="text-primary">{theme}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          >
            Switch to {lang === 'ar' ? 'English' : 'العربية'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={toggleTheme}
            iconLeading={
              <span className="material-symbols-rounded text-[18px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            }
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </Button>
        </div>
      </div>

      {/* 0. BRAND & DECORATION */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold border-b border-outline-variant pb-2 font-mono text-primary">
          00. Brand Identity, Gradient Icons & 3D Cubes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="md" className="flex flex-col items-start justify-center gap-3">
            <span className="text-xs font-mono text-on-surface-variant">Auto Tone Surface</span>
            <BrandLogo tone="auto" size="lg" />
          </Card>

          <div className="rounded-xl bg-navy p-6 flex flex-col items-start justify-center gap-3">
            <span className="text-xs font-mono text-navy-text">Light Tone on Navy</span>
            <BrandLogo tone="light" size="lg" />
          </div>

          <Card variant="soft" padding="md" className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center">
                <span className="material-symbols-rounded icon-gradient text-[24px]">
                  deployed_code
                </span>
              </div>
              <p className="text-xs font-semibold text-on-surface">48px Gradient Icon Chip</p>
            </div>
            <HeroCubes className="w-28 h-auto rtl:-scale-x-100" />
          </Card>
        </div>
      </section>

      {/* 1. SECTION HEADERS & BREADCRUMBS */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold border-b border-outline-variant pb-2 font-mono text-primary">
          01. Typography, Section Header & Breadcrumbs
        </h2>

        <Breadcrumbs
          items={[
            { label: 'الرئيسية', href: '/' },
            { label: 'المشاريع الجاهزة', href: '/projects' },
            { label: 'متجر نيكسوس' },
          ]}
        />

        <SectionHeader
          badge="نظام التصميم الموحد"
          title={`معاينة كافة مكونات واجهة ${BRAND.name}`}
          subtitle="تتيح هذه الصفحة للمطورين والمصممين فحص دقة المسافات، وحالات الإدخال، والتوجيه LTR/RTL، ووضع الألوان الداكن والفاتح."
          action={
            <Button variant="outline" size="sm">
              توثيق المكونات
            </Button>
          }
        />
      </section>

      {/* 2. BUTTONS & SIZES */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold border-b border-outline-variant pb-2 font-mono text-primary">
          02. Button Variants & States
        </h2>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-on-surface-variant">Variants (at default md size - 48px)</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary-gradient">Primary Gradient</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-on-surface-variant">Sizes (sm 40px, md 48px, lg 56px)</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small (40px)</Button>
            <Button size="md">Medium (48px)</Button>
            <Button size="lg">Large (56px)</Button>
            <Button size="icon" aria-label="Icon only">
              <span className="material-symbols-rounded text-[22px]">rocket_launch</span>
            </Button>
            <Button size="icon-sm" aria-label="Icon small">
              <span className="material-symbols-rounded text-[18px]">code_blocks</span>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-on-surface-variant">States (Icons, Loading, Disabled)</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button
              iconLeading={<span className="material-symbols-rounded text-[20px]">shopping_cart</span>}
            >
              Leading Icon
            </Button>
            <Button
              iconTrailing={<span className="material-symbols-rounded text-[20px] rtl:-scale-x-100">arrow_forward</span>}
            >
              Trailing Icon
            </Button>
            <Button loading>Loading State</Button>
            <Button disabled>Disabled Button</Button>
            <div className="flex items-center gap-2 ms-4">
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. FORM CONTROLS & SPACING */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold border-b border-outline-variant pb-2 font-mono text-primary">
          03. Form Controls (48px height, 12px radius, 3px focus ring)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 rounded-2xl bg-card border border-card-border shadow-card">
          {/* Default Input */}
          <FormField
            id="test-name"
            label="اسم العميل الكامل"
            required
            hint="يظهر الاسم في ملخص الطلب والفواتير"
          >
            <Input placeholder="مثال: معاذ أحمد" />
          </FormField>

          {/* Input with leading icon */}
          <FormField
            id="test-email"
            label="البريد الإلكتروني"
            required
          >
            <Input
              type="email"
              dir="ltr"
              placeholder="client@example.com"
              iconLeading={<span className="material-symbols-rounded text-[20px]">mail</span>}
            />
          </FormField>

          {/* Input with Error State */}
          <FormField
            id="test-phone"
            label="رقم الهاتف / واتساب"
            required
            error="رقم الهاتف غير صالح، يرجى كتابة 11 رقماً"
          >
            <Input
              dir="ltr"
              defaultValue="+20 10 1234 5678"
              iconLeading={<span className="material-symbols-rounded text-[20px]">call</span>}
            />
          </FormField>

          {/* Select with custom end-side chevron */}
          <FormField
            id="test-select"
            label="نوع المشروع البرمجي"
            required
            hint="اختر طبيعة المنظومة البرمجية"
          >
            <Select defaultValue="ecom">
              <option value="ecom">متجر إلكتروني متكامل (E-Commerce)</option>
              <option value="lms">منصة تعليمية (LMS)</option>
              <option value="saas">بوابة برمجية كخدمة (SaaS)</option>
              <option value="custom">تطبيق مخصص (Custom Build)</option>
            </Select>
          </FormField>

          {/* Disabled Input */}
          <FormField
            id="test-disabled"
            label="كود المشروع (مغلق للتعديل)"
          >
            <Input
              disabled
              defaultValue="PROJ-NX-8942"
              dir="ltr"
            />
          </FormField>

          {/* Tag Input */}
          <FormField
            label="التقنيات المطلوبة (اضغط Enter)"
            hint="اكتب التقنية ثم اضغط زر الإدخال"
          >
            <TagInput value={tags} onChange={setTags} />
          </FormField>

          {/* Textarea */}
          <div className="md:col-span-2">
            <FormField
              id="test-notes"
              label="تفاصيل ومواصفات المشروع"
              required
              hint="صف المشكلة والحل المطلوب بدقة (الحد الأدنى 140px)"
            >
              <Textarea placeholder="اشرح المتطلبات التقنية والمميزات الرئيسية..." />
            </FormField>
          </div>

          {/* File Dropzone */}
          <div className="md:col-span-2">
            <FormField label="ملفات إضافية أو تصاميم أولية">
              <FileDropzone hint="ملفات PNG, JPG, ZIP أو PDF بحد أقصى 10 ميجابايت" />
            </FormField>
          </div>
        </div>

        {/* Checkbox, Radio, RadioCards, Switch */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-card border border-card-border shadow-card">
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-on-surface">Toggles & Checks</h4>
            <div className="space-y-2">
              <Checkbox
                label="أوافق على الشروط والأحكام وسياسة الضمان"
                description="يضمن كوداً نظيفاً بنسبة 100% مع شهر صيانة مجانية"
                checked={checkboxVal}
                onChange={(e) => setCheckboxVal(e.target.checked)}
              />

              <Checkbox
                label="خيار معطل (Disabled Checkbox)"
                disabled
                checked
              />

              <Radio
                name="single-radio-sample"
                label="خيار راديو بسيط (Radio Item)"
                checked
                onChange={() => {}}
              />

              <Switch
                label="تفعيل إشعارات واتساب الفورية"
                description="ستصلك تحديثات حالة المشروع مباشرة على هاتفك"
                checked={switchVal}
                onChange={(e) => setSwitchVal(e.target.checked)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-on-surface">Radio Cards (Packages)</h4>
            <div className="space-y-2.5">
              <RadioCard
                name="plan"
                value="standard"
                checked={radioVal === 'standard'}
                onChange={() => setRadioVal('standard')}
                header="الباقة القياسية (Standard)"
                description="مناسبة للشركات الناشئة والمتاجر ذات الحجم المتوسط."
                price="5,800 ج.م"
              />

              <RadioCard
                name="plan"
                value="pro"
                checked={radioVal === 'pro'}
                onChange={() => setRadioVal('pro')}
                header="الباقة المتقدمة (Pro Enterprise)"
                badge={<Badge variant="primary" size="sm">الأكثر طلباً</Badge>}
                description="تشمل الكود المصدري بالكامل، وتكامل Paymob، وربط الشحن، وصيانة شهرين."
                price="9,500 ج.م"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEEDBACK & STATES */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold border-b border-outline-variant pb-2 font-mono text-primary">
          04. Feedback, Badges, Ratings & Prices
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="primary" dot>Primary Dot</Badge>
          <Badge variant="success" dot>Success Dot</Badge>
          <Badge variant="warning" dot>Warning Dot</Badge>
          <Badge variant="error" dot>Error Dot</Badge>
          <Badge variant="outline">Outline</Badge>

          <Tooltip content="تلميح سريع يوضح معنى العنصر">
            <Badge variant="primary">حوم هنا لمعاينة التلميح (Tooltip)</Badge>
          </Tooltip>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge type="order" status="pending" />
          <StatusBadge type="order" status="confirmed" />
          <StatusBadge type="order" status="in_progress" />
          <StatusBadge type="order" status="completed" />
          <StatusBadge type="order" status="cancelled" />
          <StatusBadge type="inquiry" status="new" />
        </div>

        <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl bg-section-band border border-card-border">
          <Rating rating={5.0} count={32} />
          <Rating rating={4.8} count={19} />
          <Rating rating={3.5} count={4} />

          <PriceTag piasters={580000} size="lg" />
          <PriceTag piasters={750000} originalPiasters={950000} size="lg" prefix="خصم خاص:" />
          <CopyButton text="ORDER-NX-2026-X89" label="نسخ رقم الطلب" />
        </div>

        {/* Interactive Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card variant="interactive" padding="md">
            <h4 className="font-bold text-on-surface mb-1">بطاقة تفاعلية (Interactive Card)</h4>
            <p className="text-xs text-on-surface-variant">تتفاعل هذه البطاقة مع حركة المؤشر بظل أنيق وتأثير hover سلس.</p>
          </Card>
          <Card variant="soft" padding="md">
            <h4 className="font-bold text-on-surface mb-1">بطاقة ناعمة (Soft Card)</h4>
            <p className="text-xs text-on-surface-variant">خلفية هادئة مع حدود دقيقة لعرض البيانات المنظمة.</p>
          </Card>
        </div>

        {/* Toast triggers */}
        <div className="p-6 rounded-2xl bg-card border border-card-border space-y-4">
          <h4 className="font-semibold text-sm text-on-surface">Interactive Toast System</h4>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => toast.success('تم إنشاء طلبك بنجاح! رقم الطلب: NX-9942')}
            >
              Show Success Toast
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => toast.error('فشل حفظ التغييرات، يرجى المحاولة مرة أخرى')}
            >
              Show Error Toast
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => toast.warning('جلسة الدخول أوشكت على الانتهاء')}
            >
              Show Warning Toast
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => toast.info('تم تحديث قائمة المشاريع')}
            >
              Show Info Toast
            </Button>
          </div>
        </div>

        {/* Modal & Drawer triggers */}
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline" onClick={() => setModalOpen(true)}>
            Open Test Modal
          </Button>
          <Button variant="outline" onClick={() => setDrawerOpen(true)}>
            Open Test Drawer
          </Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Open Confirm Dialog
          </Button>
        </div>
      </section>

      {/* 5. TABS, PAGINATION, ACCORDION & TABLE */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold border-b border-outline-variant pb-2 font-mono text-primary">
          05. Tabs, Pagination, Accordion & Table
        </h2>

        <div className="space-y-4">
          <Tabs
            tabs={[
              { id: 'all', label: 'جميع المشاريع', badge: 18 },
              { id: 'ecom', label: 'المتاجر الإلكترونية', badge: 8 },
              { id: 'lms', label: 'المنصات التعليمية', badge: 6 },
              { id: 'saas', label: 'حلول SaaS', badge: 4 },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <Pagination
            page={currentPage}
            totalPages={8}
            onPageChange={setCurrentPage}
          />
        </div>

        <Accordion
          items={[
            {
              id: 'faq-1',
              title: 'ما الذي تشمله المنظومة الجاهزة بعد الشراء؟',
              content: 'تشمل الكود المصدري بالكامل بتقنيات MERN Stack، توثيقاً برمجياً تفصيلياً، ودليلاً لرفع النظام وتشغيله على الخادم، بالإضافة إلى دعم فني وضمان لمدة شهر.',
            },
            {
              id: 'faq-2',
              title: 'هل يمكن تخصيص تصميم المنصة أو إضافة ميزات جديدة؟',
              content: 'نعم، كود المنظومة مكتوب بمعايير معمارية قياسية ونظيفة بنسبة 100%، ويمكنك طلب باقة التخصيص أو إضافة ميزات حصرية تلائم هويتك التجارية.',
            },
          ]}
        />

        <Table
          columns={[
            { key: 'orderNumber', header: 'رقم الطلب' },
            { key: 'client', header: 'العميل' },
            { key: 'project', header: 'المشروع' },
            { key: 'total', header: 'المبلغ' },
            {
              key: 'status',
              header: 'الحالة',
              render: (row) => <StatusBadge status={row.status} type="order" />,
            },
          ]}
          data={[
            {
              id: '1',
              orderNumber: 'NX-10024',
              client: 'أحمد محمود',
              project: 'Nexus Commerce',
              total: '5,800 ج.م',
              status: 'confirmed',
            },
            {
              id: '2',
              orderNumber: 'NX-10025',
              client: 'سارة إبراهيم',
              project: 'EduWave LMS',
              total: '6,200 ج.م',
              status: 'pending',
            },
            {
              id: '3',
              orderNumber: 'NX-10026',
              client: 'خالد عبد الله',
              project: 'SaaSKit Pro',
              total: '9,500 ج.م',
              status: 'in_progress',
            },
          ]}
        />
      </section>

      {/* 6. SKELETON & EMPTY / ERROR STATES */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold border-b border-outline-variant pb-2 font-mono text-primary">
          06. Skeletons, Empty & Error States
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton.Card />
          <div className="p-6 rounded-xl border border-card-border bg-card space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton.Text lines={4} />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-10 w-28 rounded-full" />
              <Skeleton className="h-10 w-28 rounded-full" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EmptyState
            icon="folder_open"
            title="لا توجد مشاريع مطابقة"
            description="جرب البحث بكلمات مفتاحية أخرى أو إعادة تعيين الفلاتر."
            action={<Button variant="outline" size="sm">إعادة التعيين</Button>}
          />

          <ErrorState
            title="تعذر تحميل المشاريع"
            message="حدث خطأ غير متوقع أثناء الاتصال بالخادم. يرجى إعادة المحاولة."
            onRetry={() => toast.info('جاري إعادة المحاولة...')}
          />
        </div>
      </section>

      {/* 7. SHARED PROJECT CARD */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold border-b border-outline-variant pb-2 font-mono text-primary">
          07. Shared ProjectCard
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProjectCard project={sampleProject} />
          <ProjectCard
            project={{
              ...sampleProject,
              slug: 'eduwave-lms',
              title: {
                ar: 'منصة إديو ويف التعليمية',
                en: 'EduWave LMS Platform',
              },
              tagline: {
                ar: 'منصة تعليمية للمراكز والمدارس مع حماية وتشفير الفيديو DRM وبنك أسئلة ذكي.',
                en: 'Educational platform with DRM video protection, student telemetry and gradebook.',
              },
              startingPrice: 620000,
              techStack: ['React', 'Express', 'Node.js', 'Socket.io'],
              reviewsSummary: { averageRating: 5.0, totalReviews: 14 },
            }}
          />
          <ProjectCard
            project={{
              ...sampleProject,
              slug: 'saaskit-cloud',
              title: {
                ar: 'بوابة ساس كيت السحابية',
                en: 'SaaSKit Cloud Engine',
              },
              tagline: {
                ar: 'قالب اشتراكات ودفع دوري مع لوحة تحكم وإدارة صلاحيات وفواتير جاهزة للاستخدام.',
                en: 'Multi-tenant subscription portal with Stripe/Paymob billing and auth.',
              },
              startingPrice: 850000,
              techStack: ['Next.js', 'MongoDB', 'Docker', 'Tailwind'],
              reviewsSummary: { averageRating: 4.7, totalReviews: 9 },
            }}
          />
        </div>
      </section>

      {/* 8. CTA BANNER */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold border-b border-outline-variant pb-2 font-mono text-primary">
          08. Shared CtaBanner
        </h2>

        <CtaBanner
          icon="auto_awesome"
          title="هل أنت جاهز لإطلاق منصتك القادمة وتنمية مبيعاتك؟"
          description="تواصل معنا الآن عبر الواتساب أو اطلب عرض سعر تفصيلي لمشروعك، وسيقوم مهندس برمجيات بمراجعة فكرتك والرد خلال ساعة واحدة."
          primaryAction={{
            label: 'ابدأ الآن واطلب مشروعك',
            to: '/contact',
            icon: 'arrow_forward',
          }}
          secondaryAction={{
            label: 'محادثة واتساب سريعة',
            href: 'https://wa.me/201000000000',
            icon: 'chat',
          }}
          features={[
            'بدون أي مصاريف مستترة',
            'استشارة تقنية مجانية',
            'ضمان صيانة برمجية شهر كامل',
          ]}
        />
      </section>

      {/* Modal & Drawer Elements */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="نافذة منبثقة تجريبية (Modal Dialog)"
        description="هذا المكون يدعم التجاوب الكامل والشاشات الصغيرة مع زر الإغلاق وESC."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary-gradient" onClick={() => setModalOpen(false)}>
              تأكيد العملية
            </Button>
          </>
        }
      >
        <p className="text-sm text-on-surface-variant leading-relaxed">
          تم تصميم النافذة لتتحول تلقائياً على الشاشات المحمولة الصغيرة إلى ورقة كاملة من الأسفل (Bottom Sheet / Fullscreen) مع تثبيت أزرار الإجراءات بالأسفل.
        </p>
      </Modal>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="قائمة جانبية تجريبية (Drawer)"
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            تنزلق هذه القائمة من الجانب المخصص (end side) مع تظليل الخلفية وقفل التمرير التلقائي.
          </p>
          <Button
            variant="primary-gradient"
            size="md"
            className="w-full"
            onClick={() => setDrawerOpen(false)}
          >
            إغلاق القائمة
          </Button>
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          toast.success('تمت العملية بنجاح');
        }}
        title="تأكيد حذف العنصر؟"
        message="هل أنت متأكد من رغبتك في حذف هذا العنصر نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="نعم، احذف نهائياً"
        cancelText="إلغاء"
      />
    </div>
  );
}
