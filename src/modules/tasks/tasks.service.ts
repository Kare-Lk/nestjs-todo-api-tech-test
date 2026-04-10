import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Repository } from 'typeorm';
import { UpdateTaskDto } from './schemas/update-task.schema';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/redis/redis.module';
import { FindTasksDto } from './schemas/find-tasks.schema';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly cacheTtlInSeconds = 60;

  constructor(
    @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  private getUserTasksCacheKey(userId: string, page: number, limit: number) {
    return `tasks:user:${userId}:page:${page}:limit:${limit}`;
  }

  private async invalidateUserTasksCache(userId: string) {
    try {
      const cacheKeys = await this.redisClient.keys(`tasks:user:${userId}:*`);

      if (cacheKeys.length > 0) {
        await this.redisClient.del(cacheKeys);
      }
    } catch {
      this.logger.warn(`Failed to invalidate tasks cache for user ${userId}`);
    }
  }

  async create(userId: string, title: string, description?: string) {
    const newTask = this.taskRepository.create({
      title,
      description,
      user: { id: userId },
    });

    const task = await this.taskRepository.save(newTask);
    await this.invalidateUserTasksCache(userId);

    return task;
  }

  async findAll(userId: string, pagination: FindTasksDto) {
    const { page, limit } = pagination;
    const cacheKey = this.getUserTasksCacheKey(userId, page, limit);

    try {
      const cachedTasks = await this.redisClient.get(cacheKey);

      if (cachedTasks) {
        return JSON.parse(cachedTasks) as {
          data: Task[];
          meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        };
      }
    } catch {
      this.logger.warn(`Failed to read tasks cache for user ${userId}`);
    }

    const [tasks, total] = await this.taskRepository.findAndCount({
      where: {
        user: { id: userId },
        is_deleted: false,
      },
      order: {
        created_at: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const response = {
      data: tasks,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    try {
      await this.redisClient.set(
        cacheKey,
        JSON.stringify(response),
        'EX',
        this.cacheTtlInSeconds,
      );
    } catch {
      this.logger.warn(`Failed to write tasks cache for user ${userId}`);
    }

    return response;
  }

  async updateTask(userId: string, taskId: string, updates: UpdateTaskDto) {
    const task = await this.taskRepository.findOne({
      where: {
        id: taskId,
        user: { id: userId },
      },
    });

    if (!task) throw new NotFoundException('Task not found');

    if (updates.title !== undefined) {
      task.title = updates.title;
    }

    if (updates.description !== undefined) {
      task.description = updates.description;
    }

    if (updates.status !== undefined) {
      task.status = updates.status;
    }

    const updatedTask = await this.taskRepository.save(task);
    await this.invalidateUserTasksCache(userId);

    return updatedTask;
  }

  async remove(userId: string, taskId: string) {
    const task = await this.taskRepository.findOne({
      where: {
        id: taskId,
        user: { id: userId },
      },
    });

    if (!task) throw new NotFoundException('Task not found');

    task.is_deleted = true;
    const deletedTask = await this.taskRepository.save(task);
    await this.invalidateUserTasksCache(userId);

    return deletedTask;
  }
}
