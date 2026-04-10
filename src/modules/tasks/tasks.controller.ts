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
import {
  ApiBody,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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
import {
  CreateTaskSwaggerDto,
  TasksPaginationResponseSwaggerDto,
  UpdateTaskSwaggerDto,
} from './dto/swagger-task.dto';
import { Task } from './entities/task.entity';

@UseGuards(JwtAuthGuard)
@ApiTags('tasks')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token JWT invalido o ausente' })
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiOperation({ summary: 'Crear una nueva tarea' })
  @ApiBody({ type: CreateTaskSwaggerDto })
  @ApiCreatedResponse({
    description: 'Tarea creada correctamente',
    type: Task,
  })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @Post()
  create(
    @CurrentUser('userId') userId: string,
    @Body(new ZodValidationPipe(createTaskSchema)) body: CreateTaskDto,
  ) {
    return this.tasksService.create(userId, body.title, body?.description);
  }

  @ApiOperation({ summary: 'Obtener tareas paginadas del usuario autenticado' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiOkResponse({
    description: 'Listado paginado de tareas',
    type: TasksPaginationResponseSwaggerDto,
  })
  @Get()
  findAll(
    @CurrentUser('userId') userId: string,
    @Query(new ZodValidationPipe(FindTasksSchema)) query: FindTasksDto,
  ) {
    return this.tasksService.findAll(userId, query);
  }

  @ApiOperation({ summary: 'Actualizar una tarea existente' })
  @ApiParam({ name: 'id', example: '550cc81e-9654-43cc-8b49-b51391124769' })
  @ApiBody({ type: UpdateTaskSwaggerDto })
  @ApiOkResponse({
    description: 'Tarea actualizada correctamente',
    type: Task,
  })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiNotFoundResponse({ description: 'Task not found' })
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

  @ApiOperation({ summary: 'Eliminar logicamente una tarea' })
  @ApiParam({ name: 'id', example: '550cc81e-9654-43cc-8b49-b51391124769' })
  @ApiOkResponse({
    description: 'Tarea eliminada correctamente',
    type: Task,
  })
  @ApiNotFoundResponse({ description: 'Task not found' })
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.tasksService.remove(userId, id);
  }
}
