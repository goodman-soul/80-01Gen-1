import type { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    await authenticate(request, reply);
    
    const user = request.user as { role: UserRole };
    if (!roles.includes(user.role)) {
      reply.status(403).send({ error: 'Forbidden - Insufficient permissions' });
    }
  };
}

export function canViewApplication(
  userId: string,
  userRole: UserRole,
  application: { customerId: string }
): boolean {
  if (userRole === UserRole.customer) {
    return application.customerId === userId;
  }
  return true;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string;
      email: string;
      role: UserRole;
      name: string;
    };
  }
}
