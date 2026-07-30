import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

export default async function handler(req: any, res: any) {
  try {
    const result = await prisma.admin.count();
    res.json({ dbConnected: true, adminCount: result });
  } catch (e: any) {
    res.status(500).json({ error: e.message, stack: e.stack?.split('\n').slice(0, 3) });
  }
}