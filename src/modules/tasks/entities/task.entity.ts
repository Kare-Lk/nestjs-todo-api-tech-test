import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

@Entity('tasks')
export class Task {
  @ApiProperty({ example: '550cc81e-9654-43cc-8b49-b51391124769' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'Preparar prueba tecnica' })
  @Column()
  title!: string;

  @ApiPropertyOptional({ example: 'Agregar Swagger y tests' })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.PENDING })
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status!: TaskStatus;

  @ApiProperty({ example: false })
  @Column({ default: false })
  is_deleted!: boolean;

  @ManyToOne(() => User, (user) => user.tasks, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user!: User;

  @ApiProperty({ example: '2026-04-10T20:06:08.382Z' })
  @CreateDateColumn()
  created_at!: Date;

  @ApiProperty({ example: '2026-04-10T20:06:08.382Z' })
  @UpdateDateColumn()
  updated_at!: Date;
}
