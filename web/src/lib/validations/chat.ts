import { z } from 'zod';

export const createDirectChatSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Invalid username format'),
});

export type CreateDirectChatFormData = z.infer<typeof createDirectChatSchema>;

export const createGroupChatSchema = z.object({
  name: z
    .string()
    .min(1, 'Group name is required')
    .max(100, 'Group name must be under 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be under 500 characters')
    .optional()
    .or(z.literal('')),
  participantUsernames: z
    .string()
    .min(1, 'Add at least one participant'),
});

export type CreateGroupChatFormData = z.infer<typeof createGroupChatSchema>;
