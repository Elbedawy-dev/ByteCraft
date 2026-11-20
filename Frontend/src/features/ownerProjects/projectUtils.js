import { egpToPiasters, piastersToEgp } from '@/lib/money';

/**
 * Generates a URL-safe slug from an English title.
 */
export function suggestProjectSlug(titleEn) {
  if (!titleEn || typeof titleEn !== 'string') return '';
  return titleEn
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Computes the cheapest active package price in integer piasters.
 * Falls back to cheapest package overall if all packages are inactive.
 */
export function getCheapestPackagePrice(packages = []) {
  if (!Array.isArray(packages) || packages.length === 0) return null;
  const active = packages.filter((p) => p && p.isActive !== false && Number.isFinite(Number(p.price)));
  const pool = active.length > 0 ? active : packages.filter((p) => p && Number.isFinite(Number(p.price)));
  if (pool.length === 0) return null;
  return Math.min(...pool.map((p) => Number(p.price)));
}

export function createEmptyPackage(index = 0) {
  return {
    key: index === 0 ? 'standard' : `tier-${index + 1}`,
    name: { ar: '', en: '' },
    priceEgp: '',
    compareAtPriceEgp: '',
    licenseType: 'single',
    supportDays: 30,
    isPopular: index === 0,
    isActive: true,
    features: [],
  };
}

export function getDefaultProjectFormValues() {
  return {
    title: { ar: '', en: '' },
    tagline: { ar: '', en: '' },
    description: { ar: '', en: '' },
    category: '',
    slug: '',
    status: 'draft',
    isFeatured: false,
    sortOrder: 0,
    thumbnail: null,
    gallery: [],
    techStack: [],
    features: [],
    packages: [createEmptyPackage(0)],
    preview: {
      url: '',
      mode: 'iframe',
      demoNote: { ar: '', en: '' },
      demoCredentials: {
        label: 'Demo Account',
        email: '',
        password: '',
      },
    },
    privateRepo: {
      provider: 'github',
      owner: '',
      name: '',
      url: '',
    },
  };
}

export function projectToFormValues(project) {
  if (!project) return getDefaultProjectFormValues();

  const categoryId =
    typeof project.category === 'string'
      ? project.category
      : project.category?.id || project.category?._id || '';

  const packages =
    Array.isArray(project.packages) && project.packages.length > 0
      ? project.packages.map((pkg) => ({
          key: pkg.key || '',
          name: {
            ar: pkg.name?.ar || '',
            en: pkg.name?.en || '',
          },
          priceEgp:
            pkg.price !== undefined && pkg.price !== null ? String(piastersToEgp(pkg.price)) : '',
          compareAtPriceEgp:
            pkg.compareAtPrice !== undefined && pkg.compareAtPrice !== null
              ? String(piastersToEgp(pkg.compareAtPrice))
              : '',
          licenseType: pkg.licenseType === 'multi' ? 'multi' : 'single',
          supportDays: pkg.supportDays ?? 30,
          isPopular: Boolean(pkg.isPopular),
          isActive: pkg.isActive !== false,
          features: Array.isArray(pkg.features)
            ? pkg.features.map((f) => ({ ar: f.ar || '', en: f.en || '' }))
            : [],
        }))
      : [createEmptyPackage(0)];

  return {
    title: {
      ar: project.title?.ar || '',
      en: project.title?.en || '',
    },
    tagline: {
      ar: project.tagline?.ar || '',
      en: project.tagline?.en || '',
    },
    description: {
      ar: project.description?.ar || '',
      en: project.description?.en || '',
    },
    category: categoryId,
    slug: project.slug || '',
    status: project.status || 'draft',
    isFeatured: Boolean(project.isFeatured),
    sortOrder: project.sortOrder ?? 0,
    thumbnail: project.thumbnail?.url
      ? { url: project.thumbnail.url, publicId: project.thumbnail.publicId }
      : null,
    gallery: Array.isArray(project.gallery)
      ? project.gallery
          .filter((img) => img?.url && img?.publicId)
          .map((img) => ({ url: img.url, publicId: img.publicId }))
      : [],
    techStack: Array.isArray(project.techStack) ? [...project.techStack] : [],
    features: Array.isArray(project.features)
      ? project.features.map((f) => ({ ar: f.ar || '', en: f.en || '' }))
      : [],
    packages,
    preview: {
      url: project.preview?.url || '',
      mode: project.preview?.mode === 'external' ? 'external' : 'iframe',
      demoNote: {
        ar: project.preview?.demoNote?.ar || '',
        en: project.preview?.demoNote?.en || '',
      },
      demoCredentials: {
        label: project.preview?.demoCredentials?.label || 'Demo Account',
        email: project.preview?.demoCredentials?.email || '',
        password: project.preview?.demoCredentials?.password || '',
      },
    },
    privateRepo: {
      provider: ['github', 'gitlab', 'other'].includes(project.privateRepo?.provider)
        ? project.privateRepo.provider
        : 'github',
      owner: project.privateRepo?.owner || '',
      name: project.privateRepo?.name || '',
      url: project.privateRepo?.url || '',
    },
  };
}

export function formValuesToProjectPayload(values, targetStatus) {
  const status = targetStatus || values.status || 'draft';

  const payload = {
    title: {
      ar: values.title.ar.trim(),
      en: values.title.en.trim(),
    },
    tagline: {
      ar: values.tagline.ar.trim(),
      en: values.tagline.en.trim(),
    },
    description: {
      ar: values.description.ar.trim(),
      en: values.description.en.trim(),
    },
    category: values.category,
    techStack: (values.techStack || []).map((t) => t.trim()).filter(Boolean),
    features: (values.features || []).map((f) => ({
      ar: f.ar.trim(),
      en: f.en.trim(),
    })),
    thumbnail: values.thumbnail
      ? {
          url: values.thumbnail.url.trim(),
          publicId: values.thumbnail.publicId.trim(),
        }
      : null,
    gallery: (values.gallery || []).map((img) => ({
      url: img.url.trim(),
      publicId: img.publicId.trim(),
    })),
    preview: {
      url: values.preview?.url?.trim() || '',
      mode: values.preview?.mode === 'external' ? 'external' : 'iframe',
      demoNote: {
        ar: values.preview?.demoNote?.ar?.trim() || '',
        en: values.preview?.demoNote?.en?.trim() || '',
      },
      demoCredentials: {
        label: values.preview?.demoCredentials?.label?.trim() || 'Demo Account',
        email: values.preview?.demoCredentials?.email?.trim() || '',
        password: values.preview?.demoCredentials?.password?.trim() || '',
      },
    },
    packages: (values.packages || []).map((pkg) => {
      const compareRaw = String(pkg.compareAtPriceEgp ?? '').trim();
      return {
        key: pkg.key.trim().toLowerCase(),
        name: {
          ar: pkg.name.ar.trim(),
          en: pkg.name.en.trim(),
        },
        price: egpToPiasters(pkg.priceEgp),
        compareAtPrice: compareRaw !== '' ? egpToPiasters(compareRaw) : null,
        features: (pkg.features || []).map((f) => ({
          ar: f.ar.trim(),
          en: f.en.trim(),
        })),
        licenseType: pkg.licenseType === 'multi' ? 'multi' : 'single',
        supportDays: Math.max(0, Math.trunc(Number(pkg.supportDays) || 0)),
        isPopular: Boolean(pkg.isPopular),
        isActive: pkg.isActive !== false,
      };
    }),
    privateRepo: {
      provider: ['github', 'gitlab', 'other'].includes(values.privateRepo?.provider)
        ? values.privateRepo.provider
        : 'github',
      owner: values.privateRepo?.owner?.trim() || '',
      name: values.privateRepo?.name?.trim() || '',
      url: values.privateRepo?.url?.trim() || '',
    },
    status,
    isFeatured: Boolean(values.isFeatured),
    sortOrder: Math.trunc(Number(values.sortOrder) || 0),
  };

  const trimmedSlug = values.slug?.trim();
  if (trimmedSlug) {
    payload.slug = trimmedSlug.toLowerCase();
  }

  return payload;
}
