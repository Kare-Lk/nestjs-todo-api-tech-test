import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import express from 'express';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from '../src/modules/users/users.service';
import { TasksController } from '../src/modules/tasks/tasks.controller';
import { TasksService } from '../src/modules/tasks/tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/modules/users/entities/user.entity';
import { Task, TaskStatus } from '../src/modules/tasks/entities/task.entity';
import { REDIS_CLIENT } from '../src/common/redis/redis.module';
import { randomUUID } from 'node:crypto';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Express } from 'express';
import { JwtStrategy } from '../src/modules/auth/strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

type UserRecord = User;
type TaskRecord = Task;
type AuthResponseBody = {
  access_token: string;
};

type TaskResponseBody = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
};

type TaskListResponseBody = {
  data: TaskResponseBody[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

describe('Auth + Tasks (e2e)', () => {
  let app: INestApplication;
  let expressApp: Express;
  let users: UserRecord[];
  let tasks: TaskRecord[];

  beforeEach(async () => {
    users = [];
    tasks = [];

    // Repositorio en memoria para usuarios: evita depender de Postgres en e2e.
    const userRepository = {
      findOne: jest.fn(({ where }: { where: Partial<UserRecord> }) => {
        if (where.email) {
          return users.find((user) => user.email === where.email) ?? null;
        }

        if (where.id) {
          return users.find((user) => user.id === where.id) ?? null;
        }

        return null;
      }),
      create: jest.fn((user: Partial<UserRecord>) => ({
        id: randomUUID(),
        tasks: [],
        ...user,
      })),
      save: jest.fn((user: UserRecord) => {
        const existingIndex = users.findIndex(
          (existingUser) => existingUser.id === user.id,
        );

        if (existingIndex >= 0) {
          users[existingIndex] = user;
        } else {
          users.push(user);
        }

        return user;
      }),
    };

    // Repositorio en memoria para tareas: replica lo necesario del flujo HTTP real.
    const taskRepository = {
      findOne: jest.fn(
        ({ where }: { where: { id?: string; user?: { id?: string } } }) =>
          tasks.find(
            (task) =>
              task.id === where.id &&
              task.user.id === where.user?.id &&
              task.is_deleted === false,
          ) ?? null,
      ),
      create: jest.fn(
        (task: {
          title: string;
          description?: string;
          user: { id: string };
        }): TaskRecord => ({
          id: randomUUID(),
          title: task.title,
          description: task.description,
          status: TaskStatus.PENDING,
          is_deleted: false,
          user: {
            id: task.user.id,
            email: '',
            password: '',
            tasks: [],
          },
          created_at: new Date(),
          updated_at: new Date(),
        }),
      ),
      save: jest.fn((task: TaskRecord) => {
        const existingIndex = tasks.findIndex(
          (existingTask) => existingTask.id === task.id,
        );
        task.updated_at = new Date();

        if (existingIndex >= 0) {
          tasks[existingIndex] = task;
        } else {
          tasks.push(task);
        }

        return task;
      }),
      findAndCount: jest.fn(
        ({
          where,
          skip,
          take,
        }: {
          where: { user: { id: string }; is_deleted: boolean };
          skip: number;
          take: number;
        }) => {
          const filteredTasks = tasks.filter(
            (task) =>
              task.user.id === where.user.id &&
              task.is_deleted === where.is_deleted,
          );

          return [
            filteredTasks.slice(skip, skip + take),
            filteredTasks.length,
          ] as const;
        },
      ),
    };

    // Redis falso en memoria para probar cache e invalidación sin infraestructura externa.
    const redisStore = new Map<string, string>();
    const redisClient = {
      get: jest.fn((key: string) =>
        Promise.resolve(redisStore.get(key) ?? null),
      ),
      set: jest.fn((key: string, value: string) => {
        redisStore.set(key, value);
        return Promise.resolve('OK');
      }),
      del: jest.fn((...keys: string[]) => {
        keys.forEach((key) => redisStore.delete(key));
        return Promise.resolve(keys.length);
      }),
      keys: jest.fn((pattern: string) => {
        const prefix = pattern.replace('*', '');
        return Promise.resolve(
          [...redisStore.keys()].filter((key) => key.startsWith(prefix)),
        );
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // JWT y Passport reales para cubrir autenticación en el flujo e2e.
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: 3600 },
        }),
      ],
      controllers: [AuthController, TasksController],
      providers: [
        AuthService,
        UsersService,
        TasksService,
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              if (key === 'JWT_EXPIRES_IN') return '3600';
              return undefined;
            }),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Task),
          useValue: taskRepository,
        },
        {
          provide: REDIS_CLIENT,
          useValue: redisClient,
        },
      ],
    }).compile();

    expressApp = express();
    app = moduleFixture.createNestApplication(new ExpressAdapter(expressApp));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('registers, logs in, and manages paginated tasks', async () => {
    const httpServer = expressApp;

    // 1. Registro inicial del usuario.
    const registerResponse = await request(httpServer)
      .post('/auth/register')
      .send({
        email: 'user@test.com',
        password: 'secret123',
      })
      .expect(201);
    const registerBody = registerResponse.body as AuthResponseBody;

    expect(registerBody.access_token).toEqual(expect.any(String));

    // 2. Login con el mismo usuario para obtener un token utilizable.
    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .send({
        email: 'user@test.com',
        password: 'secret123',
      })
      .expect(201);
    const loginBody = loginResponse.body as AuthResponseBody;

    expect(loginBody.access_token).toEqual(expect.any(String));

    const accessToken = loginBody.access_token;

    // 3. Crear una tarea autenticado.
    const createResponse = await request(httpServer)
      .post('/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Task 1',
        description: 'First task',
      })
      .expect(201);
    const createBody = createResponse.body as TaskResponseBody;

    expect(createBody.id).toEqual(expect.any(String));
    expect(createBody.title).toBe('Task 1');

    // 4. Leer tareas paginadas y comprobar estructura + contenido.
    const findAllResponse = await request(httpServer)
      .get('/tasks?page=1&limit=10')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const findAllBody = findAllResponse.body as TaskListResponseBody;

    expect(findAllBody).toEqual({
      data: [
        expect.objectContaining({
          id: createBody.id,
          title: 'Task 1',
          description: 'First task',
          status: TaskStatus.PENDING,
        }),
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });

    // 5. Actualizar la misma tarea por id.
    const updateResponse = await request(httpServer)
      .patch(`/tasks/${createBody.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Task 1 updated',
        status: TaskStatus.DONE,
      })
      .expect(200);
    const updateBody = updateResponse.body as TaskResponseBody;

    expect(updateBody).toEqual(
      expect.objectContaining({
        id: createBody.id,
        title: 'Task 1 updated',
        status: TaskStatus.DONE,
      }),
    );

    // 6. Eliminar la tarea y confirmar que ya no aparece en el listado.
    await request(httpServer)
      .delete(`/tasks/${createBody.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const emptyTasksResponse = await request(httpServer)
      .get('/tasks?page=1&limit=10')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const emptyTasksBody = emptyTasksResponse.body as TaskListResponseBody;

    expect(emptyTasksBody).toEqual({
      data: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });
  });
});
