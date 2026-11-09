import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

describe('autenticação', () => {
  const app = createApp();

  describe('POST /api/v1/auth/register', () => {
    it('cria o primeiro utilizador como ADMIN e devolve um token', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Dona da loja',
        email: 'Admin@Kitanda.AO',
        password: 'password123',
      });

      expect(res.status).toBe(201);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.user).toMatchObject({ email: 'admin@kitanda.ao', role: 'ADMIN' });
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('rejeita dados inválidos', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ email: 'não é email', password: '123' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('recusa registar um segundo utilizador', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Admin', email: 'admin@kitanda.ao', password: 'password123' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Outro', email: 'outro@kitanda.ao', password: 'password123' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('REGISTRATION_CLOSED');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('autentica com credenciais correctas', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Admin', email: 'admin@kitanda.ao', password: 'password123' });

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@kitanda.ao',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toEqual(expect.any(String));
    });

    it('recusa password errada', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Admin', email: 'admin@kitanda.ao', password: 'password123' });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@kitanda.ao', password: 'password-errada' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('recusa email que não existe', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'ninguem@kitanda.ao', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('devolve o utilizador autenticado', async () => {
      const register = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Admin', email: 'admin@kitanda.ao', password: 'password123' });

      const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${register.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('admin@kitanda.ao');
    });

    it('responde 401 sem token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('responde 401 com token inválido', async () => {
      const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer token-invalido');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('responde 401 com token expirado', async () => {
      const register = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Admin', email: 'admin@kitanda.ao', password: 'password123' });
      const userId = (await prisma.user.findFirstOrThrow()).id;
      expect(register.status).toBe(201);

      const jwt = await import('jsonwebtoken');
      const expiredToken = jwt.default.sign({ sub: userId, role: 'ADMIN' }, process.env.JWT_SECRET!, {
        expiresIn: -10,
      });

      const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
    });
  });
});
