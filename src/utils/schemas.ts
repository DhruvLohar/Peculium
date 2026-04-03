import { z } from 'zod';

export const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only digits'),
});

export const displayNameSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name is too long'),
});

export type EmailFormValues = z.infer<typeof emailSchema>;
export type OTPFormValues = z.infer<typeof otpSchema>;
export type DisplayNameFormValues = z.infer<typeof displayNameSchema>;
