import { z } from 'zod';
import { BRAND } from '../../config/brand';

export function mapSettingsToFormValues(settings) {
  const s = settings || {};
  const contact = s.contact || {};
  const socials = contact.socials || {};
  const location = contact.location || {};
  const pm = s.paymentMethods || {};
  const vf = pm.vodafone_cash || {};
  const ip = pm.instapay || {};
  const fawry = pm.fawry || {};
  const card = pm.card || {};

  return {
    siteName: s.siteName ?? BRAND.name,
    guaranteeDays:
      typeof s.guaranteeDays === 'number' ? s.guaranteeDays : 30,
    registrationEnabled: s.registrationEnabled !== false,
    contact: {
      email: contact.email ?? '',
      whatsapp: contact.whatsapp ?? '',
      phone: contact.phone ?? '',
      location: {
        ar: location.ar ?? '',
        en: location.en ?? '',
      },
      socials: {
        github: socials.github ?? '',
        linkedin: socials.linkedin ?? '',
        twitter: socials.twitter ?? '',
        facebook: socials.facebook ?? '',
      },
    },
    paymentMethods: {
      vodafone_cash: {
        enabled: Boolean(vf.enabled),
        walletNumber: vf.walletNumber ?? '',
        accountName: vf.accountName ?? '',
        instructions: {
          ar: vf.instructions?.ar ?? '',
          en: vf.instructions?.en ?? '',
        },
      },
      instapay: {
        enabled: Boolean(ip.enabled),
        ipa: ip.ipa ?? '',
        accountName: ip.accountName ?? '',
        instructions: {
          ar: ip.instructions?.ar ?? '',
          en: ip.instructions?.en ?? '',
        },
      },
      fawry: {
        enabled: Boolean(fawry.enabled),
      },
      card: {
        enabled: Boolean(card.enabled),
      },
    },
  };
}

export function createSettingsSchema(t) {
  const optionalUrl = z
    .string()
    .trim()
    .url(t('validation.invalidUrl'))
    .or(z.literal(''));

  const bilingualString = z.object({
    ar: z.string().trim(),
    en: z.string().trim(),
  });

  return z.object({
    siteName: z
      .string()
      .trim()
      .min(1, t('validation.siteNameRequired')),
    guaranteeDays: z.preprocess(
      (val) => {
        if (val === '' || val === null || val === undefined) return NaN;
        return Number(val);
      },
      z
        .number({ invalid_type_error: t('validation.guaranteeDaysInteger') })
        .int(t('validation.guaranteeDaysInteger'))
        .min(0, t('validation.guaranteeDaysMin'))
    ),
    registrationEnabled: z.boolean().default(true),
    contact: z.object({
      email: z
        .string()
        .trim()
        .email(t('validation.invalidEmail'))
        .or(z.literal('')),
      whatsapp: z.string().trim(),
      phone: z.string().trim(),
      location: bilingualString,
      socials: z.object({
        github: optionalUrl,
        linkedin: optionalUrl,
        twitter: optionalUrl,
        facebook: optionalUrl,
      }),
    }),
    paymentMethods: z.object({
      vodafone_cash: z.object({
        enabled: z.boolean(),
        walletNumber: z.string().trim(),
        accountName: z.string().trim(),
        instructions: bilingualString,
      }),
      instapay: z.object({
        enabled: z.boolean(),
        ipa: z.string().trim(),
        accountName: z.string().trim(),
        instructions: bilingualString,
      }),
      fawry: z.object({
        enabled: z.boolean(),
      }),
      card: z.object({
        enabled: z.boolean(),
      }),
    }),
  });
}

export function createChangePasswordSchema(t) {
  return z.object({
    currentPassword: z
      .string()
      .min(1, t('validation.currentPasswordRequired')),
    newPassword: z
      .string()
      .min(8, t('validation.newPasswordMin')),
  });
}
