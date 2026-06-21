import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { prismaPlugin } from './plugins/prisma.js';
import { authRoutes } from './routes/auth.js';
import { applicationRoutes } from './routes/applications.js';
import { sampleRoutes } from './routes/samples.js';
import { depositRoutes } from './routes/deposits.js';
import { contractRoutes } from './routes/contracts.js';
import { logisticsRoutes } from './routes/logistics.js';

const server = fastify({
  logger: true,
});

await server.register(cors, {
  origin: ['http://localhost:3000'],
  credentials: true,
});

await server.register(cookie, {
  secret: process.env.COOKIE_SECRET || 'cookie-secret-change-me',
  parseOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  },
});

await server.register(jwt, {
  secret: process.env.JWT_SECRET || 'dev-secret-change-me',
  cookie: {
    cookieName: 'token',
    signed: false,
  },
});

await server.register(prismaPlugin);

await server.register(authRoutes, { prefix: '/api/auth' });
await server.register(applicationRoutes, { prefix: '/api/applications' });
await server.register(sampleRoutes, { prefix: '/api/samples' });
await server.register(depositRoutes, { prefix: '/api/deposits' });
await server.register(contractRoutes, { prefix: '/api/contracts' });
await server.register(logisticsRoutes, { prefix: '/api/logistics' });

server.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || '0.0.0.0';

try {
  await server.listen({ port, host });
  console.log(`Server running on http://${host}:${port}`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
