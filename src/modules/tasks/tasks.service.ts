import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Repository } from 'typeorm';
import { UpdateTaskDto } from './schemas/update-task.schema';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/redis/redis.module';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly cacheTtlInSeconds = 60;

  constructor(
    @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  private getUserTasksCacheKey(userId: string) {
    return `tasks:user:${userId}`;
  }

  private async invalidateUserTasksCache(userId: string) {
    try {
      await this.redisClient.del(this.getUserTasksCacheKey(userId));
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

  async findAll(userId: string) {
    const cacheKey = this.getUserTasksCacheKey(userId);

    try {
      const cachedTasks = await this.redisClient.get(cacheKey);

      if (cachedTasks) {
        return JSON.parse(cachedTasks) as Task[];
      }
    } catch {
      this.logger.warn(`Failed to read tasks cache for user ${userId}`);
    }

    const tasks = await this.taskRepository.find({
      where: {
        user: { id: userId },
        is_deleted: false,
      },
    });

    try {
      await this.redisClient.set(
        cacheKey,
        JSON.stringify(tasks),
        'EX',
        this.cacheTtlInSeconds,
      );
    } catch {
      this.logger.warn(`Failed to write tasks cache for user ${userId}`);
    }

    return tasks;
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
