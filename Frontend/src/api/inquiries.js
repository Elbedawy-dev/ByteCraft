import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from './client';

export const INQUIRY_PROJECT_TYPES = [
  'lms',
  'ecommerce',
  'custom_mern',
  'consulting',
  'other',
];

export const INQUIRY_BUDGET_RANGES = [
  '5k_10k',
  '10k_20k',
  '20k_plus',
  'undecided',
];

export const INQUIRY_TIMELINES = ['urgent', 'standard', 'flexible'];

export const MAX_INQUIRY_FILES = 3;
export const MAX_INQUIRY_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
export const ALLOWED_INQUIRY_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const inquiryKeys = {
  all: ['inquiries'],
  prefillPlan: (planId) => ['inquiries', 'prefill-plan', planId],
  prefillProject: (slug) => ['inquiries', 'prefill-project', slug],
};

/**
 * Submits a contact / start-a-project inquiry to POST /api/inquiries.
 * Sends multipart/form-data when attachments exist, otherwise JSON.
 */
export async function createInquiry(payload, files = []) {
  const cleanPayload = {
    name: payload.name?.trim() || '',
    email: payload.email?.trim() || '',
    phone: payload.phone?.trim() || '',
    projectType: payload.projectType || 'other',
    budgetRange: payload.budgetRange || 'undecided',
    timeline: payload.timeline || 'standard',
    message: payload.message?.trim() || '',
    locale: payload.locale === 'en' ? 'en' : 'ar',
    website: payload.website || '',
  };

  if (payload.subject?.trim()) {
    cleanPayload.subject = payload.subject.trim();
  }
  if (payload.projectSlug?.trim()) {
    cleanPayload.projectSlug = payload.projectSlug.trim();
  }
  if (payload.servicePlanId?.trim()) {
    cleanPayload.servicePlanId = payload.servicePlanId.trim();
  }

  if (Array.isArray(files) && files.length > 0) {
    const formData = new FormData();
    Object.entries(cleanPayload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    files.slice(0, MAX_INQUIRY_FILES).forEach((file) => {
      formData.append('attachments', file);
    });

    const { data } = await api.post('/inquiries', formData);
    return data?.inquiry;
  }

  const { data } = await api.post('/inquiries', cleanPayload);
  return data?.inquiry;
}

export function useCreateInquiry(options = {}) {
  return useMutation({
    mutationFn: ({ payload, files }) => createInquiry(payload, files),
    ...options,
  });
}

/**
 * Loads service plan details when ?plan=<id> is passed to /contact.
 */
export function usePrefillPlan(planId) {
  const isValidObjectId = typeof planId === 'string' && /^[0-9a-fA-F]{24}$/.test(planId.trim());

  return useQuery({
    queryKey: inquiryKeys.prefillPlan(planId),
    enabled: isValidObjectId,
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const { data } = await api.get('/service-plans', { signal });
      const plans = Array.isArray(data?.plans) ? data.plans : [];
      return plans.find((plan) => (plan.id || plan._id) === planId.trim()) || null;
    },
  });
}

/**
 * Loads project details when ?project=<slug> is passed to /contact.
 */
export function usePrefillProject(projectSlug) {
  const cleanSlug = typeof projectSlug === 'string' ? projectSlug.trim() : '';

  return useQuery({
    queryKey: inquiryKeys.prefillProject(cleanSlug),
    enabled: Boolean(cleanSlug),
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async ({ signal }) => {
      const { data } = await api.get(`/projects/${encodeURIComponent(cleanSlug)}`, { signal });
      return data?.project || null;
    },
  });
}
