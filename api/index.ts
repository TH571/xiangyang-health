import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";

const prisma = new PrismaClient();
const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "xiangyang-secret-key";

app.use(cors());
app.use(express.json());

const auth = (req: any, res: any, next: any) => {
  try { req.user = jwt.verify(req.headers.authorization?.split(" ")[1] || "", JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "Unauthorized" }); }
};

app.get("/api/version", (req, res) => res.json({ version: "2.0.0" }));

app.get("/api/categories", async (req, res) => {
  const where = req.query.type ? { type: String(req.query.type) } : {};
  res.json(await prisma.category.findMany({ where, orderBy: { createdAt: "desc" } }));
});

app.get("/api/news", async (req, res) => {
  res.json(await prisma.news.findMany({ include: { category: true }, orderBy: { date: "desc" } }));
});

app.get("/api/experts", async (req, res) => {
  res.json(await prisma.expert.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } }));
});

app.get("/api/products", async (req, res) => {
  res.json(await prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } }));
});

app.get("/api/daily-tip", async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const saved = await prisma.dailyTip.findFirst({ where: { date: { gte: today, lt: tomorrow }, isActive: true }, orderBy: { createdAt: "desc" } });
  if (saved) return res.json({ content: saved.content, source: saved.source || "向阳健康", date: saved.date });
  res.json({ content: "人体所需三大宏量为：碳水 脂肪 蛋白质", source: "向阳健康", date: new Date() });
});

app.post("/api/auth/login", async (req, res) => {
  const admin = await prisma.admin.findUnique({ where: { username: req.body.username } });
  if (!admin || !(await bcrypt.compare(req.body.password, admin.password))) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: "24h" });
  res.json({ token, id: admin.id, username: admin.username, nickname: admin.nickname, title: admin.title, avatar: admin.avatar });
});

export default app;