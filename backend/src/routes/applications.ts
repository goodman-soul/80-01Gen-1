import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ApplicationStatus, UserRole, TestResult, SampleCondition } from '@prisma/client';
import { authenticate, requireRole, canViewApplication } from '../middleware/rbac.js';
import { generateApplicationNo, generateContractContent } from '../utils/applicationNo.js';

const createSchema = z.object({
  sampleId: z.string(),
  targetCountry: z.string().min(2),
  testPurpose: z.string().min(10),
  expectedReturnDate: z.coerce.date(),
});

const salesReviewSchema = z.object({
  approved: z.boolean(),
  comment: z.string().optional(),
});

const legalReviewSchema = z.object({
  approved: z.boolean(),
  comment: z.string().optional(),
});

const shipSchema = z.object({
  courier: z.string(),
  trackingNo: z.string(),
});

const feedbackSchema = z.object({
  content: z.string().min(20),
  testResult: z.enum(['pass', 'fail', 'partial']),
});

const returnShipSchema = z.object({
  courier: z.string(),
  trackingNo: z.string(),
});

const inspectSchema = z.object({
  condition: z.enum(['good', 'damaged', 'missing_parts']),
  description: z.string(),
  hasDamage: z.boolean(),
  damageDescription: z.string().optional(),
});

export const applicationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: [authenticate] }, async (request) => {
    const user = request.user as { userId: string; role: UserRole };
    const where = user.role === UserRole.customer 
      ? { customerId: user.userId } 
      : {};

    const applications = await fastify.prisma.application.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, company: true } },
        sample: { select: { id: true, name: true, model: true, serialNumber: true } },
        deposit: { select: { id: true, amount: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return applications;
  });

  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { userId: string; role: UserRole };

    const application = await fastify.prisma.application.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, company: true, email: true } },
        sample: true,
        salesReviewer: { select: { id: true, name: true } },
        legalReviewer: { select: { id: true, name: true } },
        deposit: true,
        logistics: { orderBy: { createdAt: 'desc' } },
        feedback: true,
        returnInspection: { include: { inspector: { select: { name: true } } } },
        contract: true,
      },
    });

    if (!application) {
      return reply.status(404).send({ error: 'Application not found' });
    }

    if (!canViewApplication(user.userId, user.role, application)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    return application;
  });

  fastify.post('/', { preHandler: [requireRole(UserRole.customer)] }, async (request) => {
    const user = request.user as { userId: string };
    const { sampleId, targetCountry, testPurpose, expectedReturnDate } = createSchema.parse(request.body);

    const sample = await fastify.prisma.sample.findUnique({ where: { id: sampleId } });
    if (!sample || sample.status !== 'available') {
      return { error: 'Sample not available' };
    }

    const applicationNo = generateApplicationNo();

    const application = await fastify.prisma.application.create({
      data: {
        applicationNo,
        customerId: user.userId,
        sampleId,
        targetCountry,
        testPurpose,
        expectedReturnDate,
        status: ApplicationStatus.draft,
      },
    });

    return application;
  });

  fastify.post('/:id/submit', { preHandler: [requireRole(UserRole.customer)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { userId: string };

    const application = await fastify.prisma.application.findUnique({ where: { id } });
    
    if (!application || application.customerId !== user.userId || application.status !== ApplicationStatus.draft) {
      return reply.status(400).send({ error: 'Invalid application' });
    }

    const customerData = await fastify.prisma.user.findUnique({ where: { id: user.userId }, select: { name: true, company: true } });
    const sampleData = await fastify.prisma.sample.findUnique({ where: { id: application.sampleId }, select: { name: true, model: true, value: true } });
    
    const contractContent = generateContractContent({
      applicationNo: application.applicationNo,
      customer: { name: customerData!.name, company: customerData!.company ?? undefined },
      sample: { name: sampleData!.name, model: sampleData!.model, value: Number(sampleData!.value) },
      targetCountry: application.targetCountry,
      expectedReturnDate: application.expectedReturnDate,
    });

    const updated = await fastify.prisma.application.update({
      where: { id },
      data: {
        status: ApplicationStatus.pending_sales_review,
        deposit: {
          create: {
            amount: (await fastify.prisma.sample.findUnique({ where: { id: application.sampleId } }))!.depositAmount,
          },
        },
        contract: {
          create: {
            content: contractContent,
          },
        },
      },
      include: { deposit: true, contract: true },
    });

    return updated;
  });

  fastify.post('/:id/sales-review', { preHandler: [requireRole(UserRole.sales)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { userId: string };
    const { approved, comment } = salesReviewSchema.parse(request.body);

    const application = await fastify.prisma.application.findUnique({ where: { id } });
    
    if (!application || application.status !== ApplicationStatus.pending_sales_review) {
      return reply.status(400).send({ error: 'Invalid application status' });
    }

    const newStatus = approved 
      ? ApplicationStatus.pending_legal_review 
      : ApplicationStatus.sales_rejected;

    const updated = await fastify.prisma.application.update({
      where: { id },
      data: {
        status: newStatus,
        salesReviewComment: comment,
        salesReviewerId: user.userId,
      },
    });

    return updated;
  });

  fastify.post('/:id/legal-review', { preHandler: [requireRole(UserRole.legal)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { userId: string };
    const { approved, comment } = legalReviewSchema.parse(request.body);

    const application = await fastify.prisma.application.findUnique({ where: { id } });
    
    if (!application || application.status !== ApplicationStatus.pending_legal_review) {
      return reply.status(400).send({ error: 'Invalid application status' });
    }

    const newStatus = approved 
      ? ApplicationStatus.pending_shipment 
      : ApplicationStatus.legal_rejected;

    const updated = await fastify.prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id },
        data: {
          status: newStatus,
          legalReviewComment: comment,
          legalReviewerId: user.userId,
        },
      });

      await tx.contract.update({
        where: { applicationId: id },
        data: {
          status: approved ? 'approved' : 'rejected',
          legalReviewerId: user.userId,
          signedAt: approved ? new Date() : null,
        },
      });

      return app;
    });

    return updated;
  });

  fastify.post('/:id/ship', { preHandler: [requireRole(UserRole.warehouse)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { courier, trackingNo } = shipSchema.parse(request.body);

    const application = await fastify.prisma.application.findUnique({ where: { id } });
    
    if (!application || application.status !== ApplicationStatus.pending_shipment) {
      return reply.status(400).send({ error: 'Invalid application status' });
    }

    const updated = await fastify.prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id },
        data: { status: ApplicationStatus.shipped },
      });

      await tx.logistics.create({
        data: {
          applicationId: id,
          type: 'outbound',
          courier,
          trackingNo,
          status: 'shipped',
          shippedAt: new Date(),
        },
      });

      await tx.sample.update({
        where: { id: application.sampleId },
        data: { status: 'borrowed' },
      });

      return app;
    });

    return updated;
  });

  fastify.post('/:id/confirm-delivery', { preHandler: [requireRole(UserRole.customer)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { userId: string };

    const application = await fastify.prisma.application.findUnique({ where: { id } });
    
    if (!application || application.customerId !== user.userId || application.status !== ApplicationStatus.shipped) {
      return reply.status(400).send({ error: 'Invalid application status' });
    }

    const updated = await fastify.prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id },
        data: { status: ApplicationStatus.in_testing },
      });

      const logistics = await tx.logistics.findFirst({
        where: { applicationId: id, type: 'outbound' },
        orderBy: { createdAt: 'desc' },
      });

      if (logistics) {
        await tx.logistics.update({
          where: { id: logistics.id },
          data: { status: 'delivered', deliveredAt: new Date() },
        });
      }

      return app;
    });

    return updated;
  });

  fastify.post('/:id/feedback', { preHandler: [requireRole(UserRole.customer)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { userId: string };
    const { content, testResult } = feedbackSchema.parse(request.body);

    const application = await fastify.prisma.application.findUnique({ where: { id } });
    
    if (!application || application.customerId !== user.userId || application.status !== ApplicationStatus.in_testing) {
      return reply.status(400).send({ error: 'Invalid application status' });
    }

    const feedback = await fastify.prisma.feedback.create({
      data: {
        applicationId: id,
        content,
        testResult: testResult as TestResult,
      },
    });

    return feedback;
  });

  fastify.post('/:id/initiate-return', { preHandler: [requireRole(UserRole.customer)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { userId: string };

    const application = await fastify.prisma.application.findUnique({ where: { id } });
    
    if (!application || application.customerId !== user.userId || application.status !== ApplicationStatus.in_testing) {
      return reply.status(400).send({ error: 'Invalid application status' });
    }

    const updated = await fastify.prisma.application.update({
      where: { id },
      data: { status: ApplicationStatus.pending_return },
    });

    return updated;
  });

  fastify.post('/:id/confirm-return-ship', { preHandler: [requireRole(UserRole.customer)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { userId: string };
    const { courier, trackingNo } = returnShipSchema.parse(request.body);

    const application = await fastify.prisma.application.findUnique({ where: { id } });
    
    if (!application || application.customerId !== user.userId || application.status !== ApplicationStatus.pending_return) {
      return reply.status(400).send({ error: 'Invalid application status' });
    }

    const updated = await fastify.prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id },
        data: { status: ApplicationStatus.returning },
      });

      await tx.logistics.create({
        data: {
          applicationId: id,
          type: 'return',
          courier,
          trackingNo,
          status: 'shipped',
          shippedAt: new Date(),
        },
      });

      return app;
    });

    return updated;
  });

  fastify.post('/:id/inspect-return', { preHandler: [requireRole(UserRole.warehouse)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { userId: string };
    const { condition, description, hasDamage, damageDescription } = inspectSchema.parse(request.body);

    const application = await fastify.prisma.application.findUnique({ where: { id } });
    
    if (!application || application.status !== ApplicationStatus.returning) {
      return reply.status(400).send({ error: 'Invalid application status' });
    }

    const updated = await fastify.prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id },
        data: { 
          status: ApplicationStatus.completed,
          actualReturnDate: new Date(),
        },
      });

      await tx.returnInspection.create({
        data: {
          applicationId: id,
          condition: condition as SampleCondition,
          description,
          hasDamage,
          damageDescription,
          inspectorId: user.userId,
        },
      });

      await tx.sample.update({
        where: { id: application.sampleId },
        data: { status: hasDamage ? 'maintenance' : 'available' },
      });

      const deposit = await tx.deposit.findUnique({ where: { applicationId: id } });
      if (deposit && !hasDamage && deposit.status === 'paid') {
        await tx.deposit.update({
          where: { id: deposit.id },
          data: { status: 'refunding' },
        });
      } else if (deposit && hasDamage) {
        await tx.deposit.update({
          where: { id: deposit.id },
          data: { 
            status: 'deducted',
            deductionReason: damageDescription || '设备损坏',
          },
        });
      }

      const returnLogistics = await tx.logistics.findFirst({
        where: { applicationId: id, type: 'return' },
        orderBy: { createdAt: 'desc' },
      });

      if (returnLogistics) {
        await tx.logistics.update({
          where: { id: returnLogistics.id },
          data: { status: 'delivered', deliveredAt: new Date() },
        });
      }

      return app;
    });

    return updated;
  });
};
