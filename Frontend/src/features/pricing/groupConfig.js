export const GROUP_PRIORITY = [
  'lms',
  'ecommerce',
  'custom',
  'saas',
  'web',
  'mobile',
  'consulting',
];

export function formatFallbackGroupName(groupKey) {
  const cleaned = String(groupKey || 'custom')
    .trim()
    .replace(/[-_]+/g, ' ');
  return cleaned.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function getGroupMeta(groupKey, t) {
  const normalized = String(groupKey || 'custom').trim().toLowerCase();
  const knownTabLabel = t(`groups.${normalized}.tabLabel`, { defaultValue: '' });
  const knownTitle = t(`groups.${normalized}.title`, { defaultValue: '' });
  const knownEyebrow = t(`groups.${normalized}.eyebrow`, { defaultValue: '' });
  const knownDescription = t(`groups.${normalized}.description`, { defaultValue: '' });
  const knownIcon = t(`groups.${normalized}.icon`, { defaultValue: '' });
  const knownAccent = t(`groups.${normalized}.accent`, { defaultValue: '' });

  const fallbackName = formatFallbackGroupName(normalized);

  return {
    key: normalized,
    tabLabel: knownTabLabel || fallbackName,
    title: knownTitle || fallbackName,
    eyebrow: knownEyebrow || t('groups.default.eyebrow'),
    description: knownDescription || t('groups.default.description'),
    icon: knownIcon || t('groups.default.icon') || 'layers',
    accent: knownAccent || t('groups.default.accent') || 'primary',
  };
}

export function groupServicePlans(plans = []) {
  if (!Array.isArray(plans) || plans.length === 0) return [];

  const buckets = new Map();

  for (const plan of plans) {
    if (!plan) continue;
    const key = String(plan.group || 'custom').trim().toLowerCase() || 'custom';
    if (!buckets.has(key)) {
      buckets.set(key, []);
    }
    buckets.get(key).push(plan);
  }

  const sortedEntries = Array.from(buckets.entries()).sort(([a], [b]) => {
    const idxA = GROUP_PRIORITY.indexOf(a);
    const idxB = GROUP_PRIORITY.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  return sortedEntries.map(([group, items]) => ({
    group,
    plans: [...items].sort((a, b) => {
      const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
    }),
  }));
}
