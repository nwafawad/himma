import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const idParamSchema = z.object({
  id: uuidSchema,
});

export const paginationSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export const paginatedResponseSchema = <ItemSchema extends z.ZodTypeAny>(itemSchema: ItemSchema) =>
  z.object({
    data: z.array(itemSchema),
    pagination: paginationSchema,
  });

export const dataResponseSchema = <ItemSchema extends z.ZodTypeAny>(itemSchema: ItemSchema) =>
  z.object({ data: itemSchema });

export type Pagination = z.infer<typeof paginationSchema>;
