import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
  // Strip pgbouncer params and add short timeouts so blocked ports fail fast
  const base = (process.env.DATABASE_URL ?? '')
    .replace('?pgbouncer=true&connection_limit=1', '');
  const connectionString =
    base + (base.includes('?') ? '&' : '?') +
    'connect_timeout=5&pool_timeout=5';

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;