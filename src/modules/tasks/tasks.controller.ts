import {
  Controller,
  UseGuards,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
  UpdateTaskSchema,
  type UpdateTaskDto,
} from './schemas/update-task.schema';
import {
  FindTasksSchema,
  type FindTasksDto,
} from './schemas/find-tasks.schema';

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
  findAll(
    @CurrentUser('userId') userId: string,
    @Query(new ZodValidationPipe(FindTasksSchema)) query: FindTasksDto,
  ) {
    return this.tasksService.findAll(userId, query);
  }

  @Patch(':id')
  updateTask(
    @CurrentUser('userId')
    userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTaskSchema))
    body: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask(userId, id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.tasksService.remove(userId, id);
  }
}
