import {
  Controller,
  UseGuards,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @Body()
    body: {
      title: string;
      description?: string;
    },
    @Req()
    req: {
      user: {
        userId: string;
      };
    },
  ) {
    return this.tasksService.create(
      req.user.userId,
      body.title,
      body?.description,
    );
  }

  @Get()
  findAll(
    @Req()
    req: {
      user: {
        userId: string;
      };
    },
  ) {
    return this.tasksService.findAll(req.user.userId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body()
    body: {
      status: Task['status'];
    },
    @Req()
    req: {
      user: {
        userId: string;
      };
    },
  ) {
    return this.tasksService.updateStatus(req.user.userId, id, body.status);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req()
    req: {
      user: {
        userId: string;
      };
    },
  ) {
    return this.tasksService.remove(req.user.userId, id);
  }
}
