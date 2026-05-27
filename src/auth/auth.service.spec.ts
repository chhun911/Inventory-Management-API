import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

const mockUser = {
  id: 1,
  email: 'test@example.com',
  password: '',
  name: 'Test User',
  createdAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock.jwt.token') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('creates a user and returns a token', async () => {
      usersService.create.mockResolvedValue(mockUser as any);

      const result = await service.register('test@example.com', 'password123', 'Test User');

      expect(usersService.create).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: mockUser.id, email: mockUser.email });
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user).toEqual({ id: 1, email: 'test@example.com', name: 'Test User' });
    });

    it('propagates ConflictException from UsersService', async () => {
      usersService.create.mockRejectedValue(new ConflictException('Email already registered'));

      await expect(service.register('dup@example.com', 'pass', 'Name')).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns a token for valid credentials', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      usersService.findByEmail.mockResolvedValue({ ...mockUser, password: hashed } as any);

      const result = await service.login('test@example.com', 'password123');

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('throws UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login('nobody@example.com', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      usersService.findByEmail.mockResolvedValue({ ...mockUser, password: hashed } as any);

      await expect(service.login('test@example.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });
  });
});
