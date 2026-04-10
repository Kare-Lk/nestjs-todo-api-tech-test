import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Task, TaskStatus } from '../entities/task.entity';

export class CreateTaskSwaggerDto {
  @ApiProperty({ example: 'Preparar entrega' })
  title!: string;

  @ApiPropertyOptional({ example: 'Documentar endpoints con Swagger' })
  description?: string;
}

export class UpdateTaskSwaggerDto {
  @ApiPropertyOptional({ example: 'Preparar entrega final' })
  title?: string;

  @ApiPropertyOptional({ example: 'Agregar README y Docker' })
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS })
  status?: TaskStatus;
}

export class FindTasksQuerySwaggerDto {
  @ApiProperty({ example: 1, default: 1 })
  page!: number;

  @ApiProperty({ example: 10, default: 10 })
  limit!: number;
}

export class TasksPaginationMetaSwaggerDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 25 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

export class TasksPaginationResponseSwaggerDto {
  @ApiProperty({ type: [Task] })
  data!: Task[];

  @ApiProperty({ type: TasksPaginationMetaSwaggerDto })
  meta!: TasksPaginationMetaSwaggerDto;
}
