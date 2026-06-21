import type { FastifyPluginAsync } from 'fastify';
import { UserRole, ContractStatus } from '@prisma/client';
import { authenticate, requireRole, canViewApplication } from '../middleware/rbac.js';

export const contractRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: [requireRole(UserRole.legal, UserRole.sales)] }, async (request) => {
    const user = request.user as { userId: string; role: UserRole };
    const where = user.role === UserRole.customer
      ? { application: { customerId: user.userId } }
      : {};

    const contracts = await fastify.prisma.contract.findMany({
      where,
      include: {
        application: {
          select: {
            id: true,
            applicationNo: true,
            customer: { select: { name: true, company: true } },
            sample: { select: { name: true } },
            targetCountry: true,
          },
        },
        legalReviewer: { select: { name: true } },
      },
      orderBy: { id: 'desc' },
    });

    return contracts;
  });

  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { userId: string; role: UserRole };

    const contract = await fastify.prisma.contract.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            customer: { select: { name: true, company: true } },
            sample: true,
          },
        },
        legalReviewer: { select: { name: true } },
      },
    });

    if (!contract) {
      return reply.status(404).send({ error: 'Contract not found' });
    }

    if (!canViewApplication(user.userId, user.role, contract.application)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    return contract;
  });

  fastify.post('/:id/approve', { preHandler: [requireRole(UserRole.legal)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { userId: string };

    const contract = await fastify.prisma.contract.findUnique({ where: { id } });

    if (!contract || contract.status !== ContractStatus.pending) {
      return reply.status(400).send({ error: 'Invalid contract status' });
    }

    const updated = await fastify.prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.approved,
        legalReviewerId: user.userId,
        signedAt: new Date(),
      },
    });

    return updated;
  });

  fastify.post('/:id/reject', { preHandler: [requireRole(UserRole.legal)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { userId: string };

    const contract = await fastify.prisma.contract.findUnique({ where: { id } });

    if (!contract || contract.status !== ContractStatus.pending) {
      return reply.status(400).send({ error: 'Invalid contract status' });
    }

    const updated = await fastify.prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.rejected,
        legalReviewerId: user.userId,
      },
    });

    return updated;
  });
};
