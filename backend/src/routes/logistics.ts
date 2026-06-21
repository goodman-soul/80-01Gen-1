import type { FastifyPluginAsync } from 'fastify';
import { UserRole } from '@prisma/client';
import { authenticate, canViewApplication } from '../middleware/rbac.js';

const mockTrackingEvents = [
  { time: '2024-01-15 09:00', location: '深圳仓库', status: '快件已揽收' },
  { time: '2024-01-15 18:00', location: '深圳转运中心', status: '快件已发出' },
  { time: '2024-01-16 10:00', location: '广州白云机场', status: '快件已出关' },
  { time: '2024-01-17 08:00', location: '新加坡樟宜机场', status: '快件已入关' },
  { time: '2024-01-17 14:00', location: '新加坡配送中心', status: '快件正在派送' },
  { time: '2024-01-18 10:30', location: '客户地址', status: '快件已签收' },
];

export const logisticsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/:id/track', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { userId: string; role: UserRole };

    const logistics = await fastify.prisma.logistics.findUnique({
      where: { id },
      include: {
        application: {
          select: {
            id: true,
            customerId: true,
            applicationNo: true,
          },
        },
      },
    });

    if (!logistics) {
      return reply.status(404).send({ error: 'Logistics record not found' });
    }

    if (!canViewApplication(user.userId, user.role, logistics.application)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    return {
      ...logistics,
      trackingEvents: mockTrackingEvents,
    };
  });
};
