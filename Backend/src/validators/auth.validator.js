const { z } = require('zod');
const { getPasswordValidationErrors } = require('../utils/password');

/**
 * Authentication Zod Validation Schemas
 */

function applyPasswordPolicy(schema, emailPath = null) {
  return schema.superRefine((data, ctx) => {
    const password = data.password ?? data.newPassword;
    const email = emailPath ? data[emailPath] : '';
    const fieldName = data.newPassword !== undefined ? 'newPassword' : 'password';

    const errors = getPasswordValidationErrors(password, email);
    for (const msg of errors) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [fieldName],
        message: msg,
      });
    }
  });
}

const registerSchema = z.object({
  body: applyPasswordPolicy(
    z.object({
      name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
      email: z.string().trim().email('A valid email address is required').transform((v) => v.toLowerCase()),
      password: z.string().min(1, 'Password is required'),
      phone: z.string().trim().max(30).optional().default(''),
      locale: z.enum(['ar', 'en']).optional().default('ar'),
    }),
    'email'
  ),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('A valid email address is required').transform((v) => v.toLowerCase()),
    password: z.string().min(1, 'Password is required'),
  }),
});

const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().trim().min(1, 'Verification token is required'),
  }),
});

const resendVerificationSchema = z.object({
  body: z
    .object({
      email: z
        .string()
        .trim()
        .email('A valid email address is required')
        .transform((v) => v.toLowerCase())
        .optional(),
    })
    .optional()
    .default({}),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email('A valid email address is required').transform((v) => v.toLowerCase()),
  }),
});

const resetPasswordSchema = z.object({
  body: applyPasswordPolicy(
    z.object({
      token: z.string().trim().min(1, 'Reset token is required'),
      password: z.string().min(1, 'Password is required'),
    })
  ),
});

const changePasswordSchema = z.object({
  body: applyPasswordPolicy(
    z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(1, 'New password is required'),
    })
  ),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
