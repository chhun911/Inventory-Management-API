import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SuppliersService } from './suppliers.service';
import { Supplier } from './supplier.entity';

const makeSupplier = (overrides: Partial<Supplier> = {}): Supplier =>
  ({
    id: 1,
    name: 'Acme Corp',
    contactEmail: 'acme@example.com',
    phone: '555-1234',
    address: '123 Main St',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Supplier);

describe('SuppliersService', () => {
  let service: SuppliersService;
  let repo: jest.Mocked<Repository<Supplier>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SuppliersService);
    repo = module.get(getRepositoryToken(Supplier));
  });

  describe('create', () => {
    it('creates and returns a supplier', async () => {
      const dto = { name: 'Acme Corp', contactEmail: 'acme@example.com' };
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(makeSupplier() as any);
      repo.save.mockResolvedValue(makeSupplier());

      const result = await service.create(dto);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { name: dto.name } });
      expect(result.name).toBe('Acme Corp');
    });

    it('throws ConflictException when name is taken', async () => {
      repo.findOne.mockResolvedValue(makeSupplier());

      await expect(service.create({ name: 'Acme Corp', contactEmail: 'x@x.com' })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns all suppliers', async () => {
      const suppliers = [makeSupplier(), makeSupplier({ id: 2, name: 'Beta LLC' })];
      repo.find.mockResolvedValue(suppliers);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('returns the supplier when found', async () => {
      repo.findOne.mockResolvedValue(makeSupplier());

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
    });

    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates and returns the supplier', async () => {
      const existing = makeSupplier();
      const updated = makeSupplier({ phone: '999-9999' });
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockResolvedValue(updated);

      const result = await service.update(1, { phone: '999-9999' });

      expect(result.phone).toBe('999-9999');
    });

    it('throws NotFoundException when supplier does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update(999, { phone: '000' })).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when new name is already taken', async () => {
      const existing = makeSupplier({ id: 1, name: 'Acme' });
      const other = makeSupplier({ id: 2, name: 'Beta' });
      repo.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(other);

      await expect(service.update(1, { name: 'Beta' })).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('removes the supplier', async () => {
      repo.findOne.mockResolvedValue(makeSupplier());
      repo.remove.mockResolvedValue(makeSupplier() as any);

      await service.remove(1);

      expect(repo.remove).toHaveBeenCalled();
    });

    it('throws NotFoundException when supplier does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
