import { z } from 'zod';

const roleNameEnum = z.enum(['SYSTEM_ADMIN', 'ICT_TECHNICIAN', 'DEPARTMENT_REPRESENTATIVE', 'AUDITOR']);

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
    roleName: roleNameEnum,
    departmentId: z.string().cuid().optional(),
    temporaryPassword: z
      .string()
      .min(8)
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
    roleName: roleNameEnum.optional(),
    departmentId: z.string().cuid().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const resetPasswordSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    temporaryPassword: z
      .string()
      .min(8)
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
  }),
});

export const listUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(25),
    roleName: roleNameEnum.optional(),
    departmentId: z.string().cuid().optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().optional(), // matches name or email
  }),
});
