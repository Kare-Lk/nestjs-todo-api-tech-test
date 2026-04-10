import { z } from 'zod';
import { TaskStatus } from '../entities/task.entity';

export const TaskStatusEnum = z.enum(TaskStatus);

export const UpdateTaskStatusSchema = z.object({
  status: TaskStatusEnum,
});

export type UpdateTaskStatusDto = z.infer<typeof UpdateTaskStatusSchema>;
