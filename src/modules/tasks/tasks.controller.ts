import {
  Controller,
  UseGuards,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { CurrentUser } from '../users/decorator/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @CurrentUser('userId') userId: string,
    @Body()
    body: {
      title: string;
      description?: string;
    },
  ) {
    return this.tasksService.create(userId, body.title, body?.description);
  }

  @Get()
  findAll(@CurrentUser('userId') userId: string) {
    return this.tasksService.findAll(userId);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser('userId')
    userId: string,
    @Param('id') id: string,
    @Body()
    body: {
      status: Task['status'];
    },
  ) {
    return this.tasksService.updateStatus(userId, id, body.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.tasksService.remove(userId, id);
  }
}
