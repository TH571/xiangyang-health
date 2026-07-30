import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/api/full-test2", async (req, res) => {
  const categories = await prisma.category.findMany();
  res.json({ ok: true, categories: categories.length });
});

export default app;