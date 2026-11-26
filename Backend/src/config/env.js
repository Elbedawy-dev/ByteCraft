const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

/**
 * Environment Variables Configuration & Validation
 * 
 * WHY:
 * "Fail-fast" pattern: If any required configuration is missing or malformed
 * (e.g. wrong PORT, invalid MONGODB_URI, missing JWT_SECRET), the application
 * halts immediately at startup with an explicit explanation rather than failing
 * silently or crashing in the middle of a user request.
 */

// Load the .env file located at the server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PAYMOB_CORE_KEYS = [
  'PAYMOB_API_KEY',
  'PAYMOB_HMAC_SECRET',
  'PAYMOB_CARD_INTEGRATION_ID',
  'PAYMOB_IFRAME_ID',
];

function isPaymobKeySet(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && !trimmed.toLowerCase().includes('placeholder');
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(5000),
    CLIENT_URL: z
      .string()
      .default('http://localhost:5173')
      .refine((val) => {
        const origins = val.split(',').map((s) => s.trim()).filter(Boolean);
        if (origins.length === 0) return false;
        return origins.every((origin) => {
          try {
            new URL(origin);
            return true;
          } catch {
            return false;
          }
        });
      }, 'CLIENT_URL must be a valid URL or comma-separated list of valid URLs'),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters for security'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    COOKIE_SAMESITE: z.enum(['lax', 'none', 'strict']).default('lax'),
    TRUST_PROXY: z
      .preprocess((val) => {
        if (val === undefined || val === null || val === '') return 1;
        if (val === 'false' || val === false) return 0;
        if (val === 'true' || val === true) return 1;
        const num = Number(val);
        return Number.isInteger(num) && num >= 0 ? num : 1;
      }, z.number().int().min(0))
      .default(1),

    // Cron execution secret (required in production)
    CRON_SECRET: z.string().optional().default(''),

    // Owner Seed Credentials (Required when running seed:owner)
    OWNER_NAME: z.string().optional().default('Nexus Owner'),
    OWNER_EMAIL: z.string().email().optional(),
    OWNER_PASSWORD: z.string().min(8, 'OWNER_PASSWORD must be at least 8 characters').optional(),

    // Cloudinary Assets Storage
    CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
    CLOUDINARY_API_KEY: z.string().optional().default(''),
    CLOUDINARY_API_SECRET: z.string().optional().default(''),

    // Mail / SMTP Notifications
    SMTP_HOST: z.string().optional().default(''),
    SMTP_PORT: z.coerce.number().optional().default(587),
    SMTP_USER: z.string().optional().default(''),
    SMTP_PASS: z.string().optional().default(''),
    MAIL_FROM: z.string().optional().default(''),
    OWNER_NOTIFY_EMAIL: z.string().optional().default(''),

    // Paymob Gateway
    PAYMOB_MODE: z.enum(['sandbox', 'live']).default('sandbox'),
    PAYMOB_API_KEY: z.string().optional().default(''),
    PAYMOB_HMAC_SECRET: z.string().optional().default(''),
    PAYMOB_CARD_INTEGRATION_ID: z.string().optional().default(''),
    PAYMOB_FAWRY_INTEGRATION_ID: z.string().optional().default(''),
    PAYMOB_IFRAME_ID: z.string().optional().default(''),

    // GitHub Automation
    AUTO_GITHUB_INVITE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
    GITHUB_TOKEN: z.string().optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.CRON_SECRET || data.CRON_SECRET.trim().length < 16) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CRON_SECRET'],
          message: 'CRON_SECRET is required and must be at least 16 characters in production mode.',
        });
      }
    }

    // Paymob is optional, but the 4 core keys are all-or-nothing:
    // if any is set (non-empty and not containing "placeholder"), all 4 must be set.
    const setPaymobKeys = PAYMOB_CORE_KEYS.filter((key) => isPaymobKeySet(data[key]));
    if (setPaymobKeys.length > 0 && setPaymobKeys.length < PAYMOB_CORE_KEYS.length) {
      const missingPaymobKeys = PAYMOB_CORE_KEYS.filter((key) => !isPaymobKeySet(data[key]));
      missingPaymobKeys.forEach((key) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `Partial Paymob configuration detected (${setPaymobKeys.join(', ')} set, missing: ${missingPaymobKeys.join(', ')}). Either provide all four core Paymob keys (${PAYMOB_CORE_KEYS.join(', ')}) or leave all of them empty to disable Paymob.`,
        });
      });
    }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('\n❌ [FATAL] Environment Configuration Validation Failed:');
  parsedEnv.error.issues.forEach((issue) => {
    console.error(`   - Field "${issue.path.join('.')}": ${issue.message}`);
  });
  console.error('\nPlease check your Backend/.env file against .env.example before restarting.\n');
  process.exit(1);
}

const PAYMOB_CONFIGURED = PAYMOB_CORE_KEYS.every((key) => isPaymobKeySet(parsedEnv.data[key]));
const PAYMOB_FAWRY_READY = PAYMOB_CONFIGURED && isPaymobKeySet(parsedEnv.data.PAYMOB_FAWRY_INTEGRATION_ID);

module.exports = {
  ...parsedEnv.data,
  PAYMOB_CONFIGURED,
  PAYMOB_FAWRY_READY,
};
