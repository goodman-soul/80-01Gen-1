import type { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticate } from '../middleware/rbac.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/login', async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body);

    const user = await fastify.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    reply.setCookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
      },
    };
  });

  fastify.post('/logout', { preHandler: [authenticate] }, async (_, reply) => {
    reply.clearCookie('token');
    return { message: 'Logged out successfully' };
  });

  fastify.get('/me', { preHandler: [authenticate] }, async (request) => {
    const userPayload = request.user as { userId: string };
    const user = await fastify.prisma.user.findUnique({
      where: { id: userPayload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company: true,
        phone: true,
        createdAt: true,
      },
    });
    return user;
  });
};
