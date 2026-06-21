import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { requireRole } from '../middleware/rbac.js';

const createSchema = z.object({
  name: z.string().min(2),
  model: z.string().min(2),
  serialNumber: z.string().min(2),
  description: z.string().optional(),
  value: z.coerce.number().positive(),
  depositAmount: z.coerce.number().positive(),
});

export const sampleRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: [requireRole(UserRole.sales, UserRole.warehouse)] }, async () => {
    const samples = await fastify.prisma.sample.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });
    return samples;
  });

  fastify.get('/available', async () => {
    const samples = await fastify.prisma.sample.findMany({
      where: { status: 'available' },
      orderBy: { name: 'asc' },
    });
    return samples;
  });

  fastify.get('/:id', { preHandler: [requireRole(UserRole.sales, UserRole.warehouse)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const sample = await fastify.prisma.sample.findUnique({
      where: { id },
      include: {
        applications: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { name: true, company: true } },
          },
        },
      },
    });

    if (!sample) {
      return reply.status(404).send({ error: 'Sample not found' });
    }

    return sample;
  });

  fastify.post('/', { preHandler: [requireRole(UserRole.sales)] }, async (request) => {
    const data = createSchema.parse(request.body);
    const sample = await fastify.prisma.sample.create({ data });
    return sample;
  });

  fastify.put('/:id', { preHandler: [requireRole(UserRole.sales)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = createSchema.partial().parse(request.body);
    
    const sample = await fastify.prisma.sample.update({
      where: { id },
      data,
    });

    return sample;
  });
};
