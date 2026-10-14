const { z } = require('zod');

/**
 * Authentication Zod Validation Schemas
 * 
 * WHY:
 * Validating inputs strictly at the boundary of the HTTP layer ensures that
 * invalid data never penetrates into services, models, or database queries.
 */

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('A valid email address is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
  }),
});

module.exports = {
  loginSchema,
  changePasswordSchema,
};
