import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  describe('create', () => {
    it('creates a user with hashed password', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue({ email: 'u@x.com', name: 'U', password: 'hashed' });
      repo.save.mockResolvedValue({ id: 1, email: 'u@x.com', name: 'U', password: 'hashed' });

      const user = await service.create('u@x.com', 'plain', 'U');

      expect(repo.save).toHaveBeenCalled();
      expect(user.id).toBe(1);
    });

    it('throws ConflictException when email exists', async () => {
      repo.findOne.mockResolvedValue({ id: 1, email: 'u@x.com' });

      await expect(service.create('u@x.com', 'pass', 'U')).rejects.toThrow(ConflictException);
    });
  });

  describe('findByEmail', () => {
    it('returns user when found', async () => {
      repo.findOne.mockResolvedValue({ id: 1, email: 'u@x.com' });

      const user = await service.findByEmail('u@x.com');

      expect(user?.id).toBe(1);
    });

    it('returns null when not found', async () => {
      repo.findOne.mockResolvedValue(null);

      const user = await service.findByEmail('none@x.com');

      expect(user).toBeNull();
    });
  });
});
