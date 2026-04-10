import { z } from 'zod';
import { TaskStatus } from '../entities/task.entity';

export const TaskStatusEnum = z.enum(TaskStatus);

export const UpdateTaskSchema = z
  .object({
    title: z.string().min(1, { message: 'Title is required' }).optional(),
    description: z.string().optional(),
    status: TaskStatusEnum.optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.status !== undefined,
    {
      message: 'At least one field must be provided',
    },
  );

export type UpdateTaskDto = z.infer<typeof UpdateTaskSchema>;
