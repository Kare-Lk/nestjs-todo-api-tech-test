import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  // Mock del service para verificar que el controller sólo delega la llamada.
  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates register to AuthService', async () => {
    authServiceMock.register.mockResolvedValue({ access_token: 'token' });

    // El controller no transforma la respuesta: pasa email/password al service.
    const result = await controller.register({
      email: 'user@test.com',
      password: 'secret123',
    });

    expect(authServiceMock.register).toHaveBeenCalledWith(
      'user@test.com',
      'secret123',
    );
    expect(result).toEqual({ access_token: 'token' });
  });

  it('delegates login to AuthService', async () => {
    authServiceMock.login.mockResolvedValue({ access_token: 'token' });

    // Login sigue el mismo patrón de delegación que register.
    const result = await controller.login({
      email: 'user@test.com',
      password: 'secret123',
    });

    expect(authServiceMock.login).toHaveBeenCalledWith(
      'user@test.com',
      'secret123',
    );
    expect(result).toEqual({ access_token: 'token' });
  });
});
