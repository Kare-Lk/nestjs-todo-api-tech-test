import { join } from 'node:path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { User } from '../modules/users/entities/user.entity';
import { Task } from '../modules/tasks/entities/task.entity';

export const typeOrmConfig = (
  overrides: Partial<PostgresConnectionOptions> = {},
): PostgresConnectionOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME ?? 'postgres',
  password: String(process.env.DB_PASSWORD ?? 'postgres'),
  database: process.env.DB_NAME ?? 'nestjs_todo_api',
  entities: [User, Task],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  ...overrides,
});

export const typeOrmModuleConfig = (): TypeOrmModuleOptions => ({
  ...typeOrmConfig(),
  autoLoadEntities: true,
  migrationsRun: true,
});

export default new DataSource(typeOrmConfig());
