import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  // Dependencias externas mockeadas para probar únicamente la lógica de AuthService.
  const usersServiceMock = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const jwtServiceMock = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('registers a user and returns an access token', async () => {
    const createdUser = {
      id: 'user-1',
      email: 'user@test.com',
      password: 'hashed-password',
    } as User;

    usersServiceMock.findByEmail.mockResolvedValue(null);
    usersServiceMock.create.mockResolvedValue(createdUser);
    jwtServiceMock.sign.mockReturnValue('signed-token');
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);

    // Register debe validar unicidad, hashear password, persistir y firmar JWT.
    const result = await service.register('user@test.com', 'secret123');

    expect(usersServiceMock.findByEmail).toHaveBeenCalledWith('user@test.com');
    expect(usersServiceMock.create).toHaveBeenCalledWith(
      'user@test.com',
      'hashed-password',
    );
    expect(jwtServiceMock.sign).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'user@test.com',
    });
    expect(result).toEqual({ access_token: 'signed-token' });
  });

  it('throws when registering an existing user', async () => {
    usersServiceMock.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      password: 'hashed-password',
    } as User);

    // Si el usuario ya existe, no debe intentar crear uno nuevo.
    await expect(
      service.register('user@test.com', 'secret123'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(usersServiceMock.create).not.toHaveBeenCalled();
  });

  it('logs in a user with valid credentials', async () => {
    usersServiceMock.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      password: 'hashed-password',
    } as User);
    jwtServiceMock.sign.mockReturnValue('signed-token');
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

    // Login compara el password hasheado y, si coincide, devuelve un nuevo JWT.
    const result = await service.login('user@test.com', 'secret123');

    expect(result).toEqual({ access_token: 'signed-token' });
    expect(jwtServiceMock.sign).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'user@test.com',
    });
  });

  it('throws UnauthorizedException when credentials are invalid', async () => {
    usersServiceMock.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      password: 'hashed-password',
    } as User);
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

    // Password inválido debe abortar el flujo con UnauthorizedException.
    await expect(
      service.login('user@test.com', 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
