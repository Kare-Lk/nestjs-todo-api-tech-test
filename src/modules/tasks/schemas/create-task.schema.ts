import z from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().optional(),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;
