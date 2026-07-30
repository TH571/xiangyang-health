import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { uploadToOSS, OSS_DOMAIN } from "../server/oss";
import { getDailyTip } from "../server/daily-tip";

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

const app = express();

app.use(cors());
app.use(express.json());

const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, "test-secret");
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

app.get("/api/test-app2", async (req, res) => {
  const count = await prisma.admin.count();
  res.json({ ok: true, adminCount: count, ossDomain: OSS_DOMAIN });
});

export default app;