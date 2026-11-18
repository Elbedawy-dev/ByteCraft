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

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters for security'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SAMESITE: z.enum(['lax', 'none', 'strict']).default('lax'),
  TRUST_PROXY: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),

  // Owner Seed Credentials (Required when running seed:owner)
  OWNER_NAME: z.string().optional().default('ByteCraft Owner'),
  OWNER_EMAIL: z.string().email().optional(),
  OWNER_PASSWORD: z.string().min(8, 'OWNER_PASSWORD must be at least 8 characters').optional(),

  // Optional keys for upcoming phases (Cloudinary, SMTP, Paymob, GitHub)
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  MAIL_FROM: z.string().optional().default(''),
  OWNER_NOTIFY_EMAIL: z.string().optional().default(''),

  PAYMOB_MODE: z.enum(['sandbox', 'live']).default('sandbox'),
  PAYMOB_API_KEY: z.string().optional().default(''),
  PAYMOB_HMAC_SECRET: z.string().optional().default(''),
  PAYMOB_CARD_INTEGRATION_ID: z.string().optional().default(''),
  PAYMOB_FAWRY_INTEGRATION_ID: z.string().optional().default(''),
  PAYMOB_IFRAME_ID: z.string().optional().default(''),

  AUTO_GITHUB_INVITE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  GITHUB_TOKEN: z.string().optional().default(''),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production') {
    if (!data.PAYMOB_API_KEY || data.PAYMOB_API_KEY.includes('placeholder')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['PAYMOB_API_KEY'],
        message: 'PAYMOB_API_KEY is required and cannot be a placeholder in production mode.',
      });
    }
    if (!data.PAYMOB_HMAC_SECRET || data.PAYMOB_HMAC_SECRET.includes('placeholder')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['PAYMOB_HMAC_SECRET'],
        message: 'PAYMOB_HMAC_SECRET is required and cannot be a placeholder in production mode.',
      });
    }
    if (!data.PAYMOB_CARD_INTEGRATION_ID || data.PAYMOB_CARD_INTEGRATION_ID.includes('placeholder')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['PAYMOB_CARD_INTEGRATION_ID'],
        message: 'PAYMOB_CARD_INTEGRATION_ID is required in production mode.',
      });
    }
    if (!data.PAYMOB_IFRAME_ID || data.PAYMOB_IFRAME_ID.includes('placeholder')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['PAYMOB_IFRAME_ID'],
        message: 'PAYMOB_IFRAME_ID is required in production mode.',
      });
    }
  }
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('\n❌ [FATAL] Environment Configuration Validation Failed:');
  parsedEnv.error.issues.forEach((issue) => {
    console.error(`   - Field "${issue.path.join('.')}": ${issue.message}`);
  });
  console.error('\nPlease check your server/.env file against .env.example before restarting.\n');
  process.exit(1);
}

module.exports = parsedEnv.data;