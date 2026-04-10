import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
  ) {}

  async create(userId: string, title: string, description?: string) {
    const newTask = this.taskRepository.create({
      title,
      description,
      user: { id: userId },
    });

    return this.taskRepository.save(newTask);
  }

  async findAll(userId: string) {
    return this.taskRepository.find({
      where: {
        user: { id: userId },
        is_deleted: false,
      },
    });
  }

  async updateStatus(userId: string, taskId: string, status: Task['status']) {
    const task = await this.taskRepository.findOne({
      where: {
        id: taskId,
        user: { id: userId },
      },
    });

    if (!task) throw new NotFoundException('Task not found');

    task.status = status;
    return this.taskRepository.save(task);
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
    return this.taskRepository.save(task);
  }
}
