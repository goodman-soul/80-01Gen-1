import type { FastifyPluginAsync } from 'fastify';
import { UserRole, DepositStatus } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/rbac.js';

export const depositRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: [authenticate] }, async (request) => {
    const user = request.user as { userId: string; role: UserRole };
    const where = user.role === UserRole.customer
      ? { application: { customerId: user.userId } }
      : {};

    const deposits = await fastify.prisma.deposit.findMany({
      where,
      include: {
        application: {
          select: {
            id: true,
            applicationNo: true,
            customer: { select: { name: true } },
            sample: { select: { name: true } },
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    return deposits;
  });

  fastify.post('/:id/pay', { preHandler: [requireRole(UserRole.customer)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { userId: string };

    const deposit = await fastify.prisma.deposit.findUnique({
      where: { id },
      include: { application: true },
    });

    if (!deposit || deposit.application.customerId !== user.userId) {
      return reply.status(404).send({ error: 'Deposit not found' });
    }

    if (deposit.status !== DepositStatus.pending) {
      return reply.status(400).send({ error: 'Invalid deposit status' });
    }

    const updated = await fastify.prisma.deposit.update({
      where: { id },
      data: {
        status: DepositStatus.paid,
        paidAt: new Date(),
      },
    });

    return updated;
  });

  fastify.post('/:id/refund', { preHandler: [requireRole(UserRole.sales)] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const deposit = await fastify.prisma.deposit.findUnique({ where: { id } });

    if (!deposit) {
      return reply.status(404).send({ error: 'Deposit not found' });
    }

    if (deposit.status !== DepositStatus.refunding) {
      return reply.status(400).send({ error: 'Invalid deposit status' });
    }

    const updated = await fastify.prisma.deposit.update({
      where: { id },
      data: {
        status: DepositStatus.refunded,
        refundedAt: new Date(),
      },
    });

    return updated;
  });
};
