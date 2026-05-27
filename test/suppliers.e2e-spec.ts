import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { SuppliersModule } from '../src/suppliers/suppliers.module';
import { User } from '../src/users/user.entity';
import { Supplier } from '../src/suppliers/supplier.entity';

describe('Suppliers (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let supplierId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqljs',
          entities: [User, Supplier],
          synchronize: true,
          dropSchema: true,
        }),
        UsersModule,
        AuthModule,
        SuppliersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.setGlobalPrefix('api');
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'supply@test.com', password: 'secret123', name: 'Tester' });
    accessToken = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const baseSupplier = {
    name: 'Acme Corp',
    contactEmail: 'acme@corp.com',
    phone: '555-0001',
    address: '1 Main St',
  };

  describe('POST /api/suppliers', () => {
    it('creates a supplier when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(baseSupplier)
        .expect(201);

      expect(res.body.name).toBe(baseSupplier.name);
      expect(res.body.id).toBeDefined();
      supplierId = res.body.id;
    });

    it('returns 409 when name already exists', async () => {
      await request(app.getHttpServer())
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(baseSupplier)
        .expect(409);
    });

    it('returns 400 for invalid contact email', async () => {
      await request(app.getHttpServer())
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Valid Name', contactEmail: 'not-an-email' })
        .expect(400);
    });

    it('returns 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);
    });

    it('returns 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/api/suppliers')
        .send(baseSupplier)
        .expect(401);
    });

    it('ignores extra fields (whitelist)', async () => {
      await request(app.getHttpServer())
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Beta LLC', contactEmail: 'beta@corp.com', hackerField: 'injected' })
        .expect(400);
    });
  });

  describe('GET /api/suppliers', () => {
    it('returns list of suppliers', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('returns 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/suppliers')
        .expect(401);
    });
  });

  describe('GET /api/suppliers/:id', () => {
    it('returns a single supplier by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(supplierId);
      expect(res.body.name).toBe(baseSupplier.name);
    });

    it('returns 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/suppliers/99999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('returns 400 for non-numeric id', async () => {
      await request(app.getHttpServer())
        .get('/api/suppliers/abc')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('returns 401 without token', async () => {
      await request(app.getHttpServer())
        .get(`/api/suppliers/${supplierId}`)
        .expect(401);
    });
  });

  describe('PUT /api/suppliers/:id', () => {
    it('updates a supplier', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ phone: '555-9999' })
        .expect(200);

      expect(res.body.phone).toBe('555-9999');
      expect(res.body.name).toBe(baseSupplier.name);
    });

    it('returns 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .put('/api/suppliers/99999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ phone: '000' })
        .expect(404);
    });

    it('returns 400 for invalid email in update', async () => {
      await request(app.getHttpServer())
        .put(`/api/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ contactEmail: 'bad-email' })
        .expect(400);
    });

    it('returns 401 without token', async () => {
      await request(app.getHttpServer())
        .put(`/api/suppliers/${supplierId}`)
        .send({ phone: '000' })
        .expect(401);
    });
  });

  describe('DELETE /api/suppliers/:id', () => {
    it('deletes a supplier and returns 204', async () => {
      await request(app.getHttpServer())
        .delete(`/api/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('returns 404 after deletion', async () => {
      await request(app.getHttpServer())
        .get(`/api/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('returns 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .delete('/api/suppliers/99999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('returns 401 without token', async () => {
      await request(app.getHttpServer())
        .delete(`/api/suppliers/${supplierId}`)
        .expect(401);
    });
  });
});
