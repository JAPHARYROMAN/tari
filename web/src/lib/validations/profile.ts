import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .max(100, 'Display name must be under 100 characters')
    .optional()
    .or(z.literal('')),
  bio: z
    .string()
    .max(280, 'Bio must be under 280 characters')
    .optional()
    .or(z.literal('')),
  statusText: z
    .string()
    .max(100, 'Status must be under 100 characters')
    .optional()
    .or(z.literal('')),
  avatarUrl: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
