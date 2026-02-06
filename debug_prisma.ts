import { PrismaClient } from '@prisma/client';

console.log('Available keys in constructor options assumption:');
try {
    const prisma = new PrismaClient({ foo: 'bar' } as any);
} catch (e: any) {
    console.log(e.message);
}
