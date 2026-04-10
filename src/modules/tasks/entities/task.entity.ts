import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status!: TaskStatus;

  @Column({ default: false })
  is_deleted!: boolean;

  @ManyToOne(() => User, (user) => user.tasks, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user!: User;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
