import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('admin123', 10);
    const admin = await prisma.admin.upsert({
        where: { username: 'admin' },
        update: {
            password,
        },
        create: {
            username: 'admin',
            password,
        },
    });
    console.log({ admin });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
