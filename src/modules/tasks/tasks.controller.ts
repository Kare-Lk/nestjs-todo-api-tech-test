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
import { CurrentUser } from '../users/decorator/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipelines/zod-validation.pipeline';
import {
  createTaskSchema,
  type CreateTaskDto,
} from './schemas/create-task.schema';
import {
  UpdateTaskStatusSchema,
  type UpdateTaskStatusDto,
} from './schemas/update-task.schema';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @CurrentUser('userId') userId: string,
    @Body(new ZodValidationPipe(createTaskSchema)) body: CreateTaskDto,
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
    @Body(new ZodValidationPipe(UpdateTaskStatusSchema))
    body: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateStatus(userId, id, body.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.tasksService.remove(userId, id);
  }
}
