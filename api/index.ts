// @ts-nocheck
import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDailyTip } from "./daily-tip";
import { uploadToOSS } from "./oss";

const prisma = new PrismaClient();
const storage = multer.memoryStorage();
const upload = multer({ storage });

const JWT_SECRET = process.env.JWT_SECRET || "xiangyang-secret-key";

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map(o => o.trim()) || [
  "http://localhost:5173", "http://localhost:5174",
  "http://127.0.0.1:5173", "http://127.0.0.1:5174",
];

app.use(cors({ origin: (o, c) => { if (!o) return c(null, true); c(null, allowedOrigins.includes(o)); }, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: "Invalid token" }); }
};

app.get("/api/version", (req, res) => res.json({ version: "2.0.0", updated: new Date().toISOString() }));
app.get("/api/admins/by-username/:username", async (req, res) => {
  try { const a = await prisma.admin.findUnique({ where: { username: req.params.username }, select: { id: true, username: true, nickname: true, avatar: true, title: true } }); res.json(a || { username: req.params.username, nickname: null, avatar: null, title: null }); }
  catch (e) { res.status(500).json({ error: "查询失败" }); }
});
app.get("/api/admins/by-name/:name", async (req, res) => {
  try { const a = await prisma.admin.findFirst({ where: { OR: [{ username: req.params.name }, { nickname: req.params.name }] }, select: { id: true, username: true, nickname: true, avatar: true, title: true } }); res.json(a || { username: null, nickname: null, avatar: null, title: null }); }
  catch (e) { res.status(500).json({ error: "查询失败" }); }
});
app.post("/api/auth/login", async (req, res) => {
  try { const a = await prisma.admin.findUnique({ where: { username: req.body.username } }); if (!a || !(await bcrypt.compare(req.body.password, a.password))) return res.status(401).json({ error: "Invalid credentials" }); const t = jwt.sign({ id: a.id, username: a.username }, JWT_SECRET, { expiresIn: "24h" }); res.json({ token: t, id: a.id, username: a.username, nickname: a.nickname, title: a.title, avatar: a.avatar }); }
  catch (e) { res.status(500).json({ error: "Login failed" }); }
});
app.post("/api/upload", authenticate, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try { res.json({ url: await uploadToOSS(req.file.buffer, req.file.originalname, req.query.type || "default") }); }
  catch (e) { res.status(500).json({ error: "Upload failed" }); }
});
app.get("/api/categories", async (req, res) => { res.json(await prisma.category.findMany({ where: req.query.type ? { type: req.query.type } : {}, orderBy: { createdAt: "desc" } })); });
app.post("/api/categories", authenticate, async (req, res) => { try { res.json(await prisma.category.create({ data: req.body })); } catch (e) { res.status(500).json({ error: "Failed to create" }); } });
app.put("/api/categories/:id", authenticate, async (req, res) => { try { res.json(await prisma.category.update({ where: { id: Number(req.params.id) }, data: req.body })); } catch (e) { res.status(500).json({ error: "Failed to update" }); } });
app.delete("/api/categories/:id", authenticate, async (req, res) => { try { await prisma.category.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: "Failed to delete" }); } });
app.get("/api/news", async (req, res) => { res.json(await prisma.news.findMany({ include: { category: true }, orderBy: { date: "desc" } })); });
app.get("/api/news/:id", async (req, res) => { const n = await prisma.news.findUnique({ where: { id: Number(req.params.id) }, include: { category: true } }); if (!n) return res.status(404).json({ error: "Not found" }); res.json(n); });
app.post("/api/news", authenticate, async (req, res) => { try { const { title, author, authorTitle, authorAvatar, cover, content, date, categoryId } = req.body; res.json(await prisma.news.create({ data: { title, author, authorTitle, authorAvatar, cover, content, date: date ? new Date(date) : undefined, categoryId } })); } catch (e) { res.status(500).json({ error: "Failed to create news" }); } });
app.put("/api/news/:id", authenticate, async (req, res) => { try { const d = req.body; res.json(await prisma.news.update({ where: { id: Number(req.params.id) }, data: { ...(d.title !== undefined && { title: d.title }), ...(d.author !== undefined && { author: d.author }), ...(d.authorTitle !== undefined && { authorTitle: d.authorTitle }), ...(d.authorAvatar !== undefined && { authorAvatar: d.authorAvatar }), ...(d.cover !== undefined && { cover: d.cover }), ...(d.content !== undefined && { content: d.content }), ...(d.date !== undefined && { date: new Date(d.date) }), ...(d.categoryId !== undefined && { categoryId: d.categoryId }) } })); } catch (e) { res.status(500).json({ error: "Failed to update news" }); } });
app.delete("/api/news/:id", authenticate, async (req, res) => { try { await prisma.news.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: "Failed to delete" }); } });
app.get("/api/experts", async (req, res) => { res.json(await prisma.expert.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } })); });
app.get("/api/experts/:id", async (req, res) => { try { const e = await prisma.expert.findUnique({ where: { id: Number(req.params.id) }, include: { category: true } }); if (!e) return res.status(404).json({ error: "Expert not found" }); res.json(e); } catch (e) { res.status(500).json({ error: "Failed to fetch expert" }); } });
app.post("/api/experts", authenticate, async (req, res) => { try { const { name, title, avatar, unit, achievements, introduction, categoryId } = req.body; res.json(await prisma.expert.create({ data: { name, title, avatar, unit, achievements, introduction, categoryId } })); } catch (e) { res.status(500).json({ error: "Failed to create expert" }); } });
app.put("/api/experts/:id", authenticate, async (req, res) => { try { const d = req.body; res.json(await prisma.expert.update({ where: { id: Number(req.params.id) }, data: { ...(d.name !== undefined && { name: d.name }), ...(d.title !== undefined && { title: d.title }), ...(d.avatar !== undefined && { avatar: d.avatar }), ...(d.unit !== undefined && { unit: d.unit }), ...(d.achievements !== undefined && { achievements: d.achievements }), ...(d.introduction !== undefined && { introduction: d.introduction }), ...(d.categoryId !== undefined && { categoryId: d.categoryId }) } })); } catch (e) { res.status(500).json({ error: "Failed to update expert" }); } });
app.delete("/api/experts/:id", authenticate, async (req, res) => { try { await prisma.expert.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: "Failed to delete" }); } });
app.get("/api/products", async (req, res) => { res.json(await prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } })); });
app.get("/api/products/:id", async (req, res) => { try { const p = await prisma.product.findUnique({ where: { id: Number(req.params.id) }, include: { category: true } }); if (!p) return res.status(404).json({ error: "Product not found" }); res.json(p); } catch (e) { res.status(500).json({ error: "Failed to fetch product" }); } });
app.post("/api/products", authenticate, async (req, res) => { try { const { name, rating, image, introduction, url, price, categoryId } = req.body; res.json(await prisma.product.create({ data: { name, rating, image, introduction, url, price, categoryId } })); } catch (e) { res.status(500).json({ error: "Failed to create product" }); } });
app.put("/api/products/:id", authenticate, async (req, res) => { try { const d = req.body; res.json(await prisma.product.update({ where: { id: Number(req.params.id) }, data: { ...(d.name !== undefined && { name: d.name }), ...(d.rating !== undefined && { rating: d.rating }), ...(d.image !== undefined && { image: d.image }), ...(d.introduction !== undefined && { introduction: d.introduction }), ...(d.url !== undefined && { url: d.url }), ...(d.price !== undefined && { price: d.price }), ...(d.categoryId !== undefined && { categoryId: d.categoryId }) } })); } catch (e) { res.status(500).json({ error: "Failed to update product" }); } });
app.delete("/api/products/:id", authenticate, async (req, res) => { try { await prisma.product.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: "Failed to delete" }); } });
app.get("/api/admins", authenticate, async (req, res) => { res.json(await prisma.admin.findMany({ select: { id: true, username: true, nickname: true, title: true, avatar: true, createdAt: true } })); });
app.post("/api/admins", authenticate, async (req, res) => { try { res.json(await prisma.admin.create({ data: { username: req.body.username, password: await bcrypt.hash(req.body.password, 10) } })); } catch (e) { res.status(500).json({ error: "Failed to create admin" }); } });
app.put("/api/admins/:id/password", authenticate, async (req, res) => { try { await prisma.admin.update({ where: { id: Number(req.params.id) }, data: { password: await bcrypt.hash(req.body.password, 10) } }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: "Failed to change password" }); } });
app.get("/api/admins/:id", authenticate, async (req, res) => { const a = await prisma.admin.findUnique({ where: { id: Number(req.params.id) }, select: { id: true, username: true, nickname: true, title: true, avatar: true, createdAt: true } }); if (!a) return res.status(404).json({ error: "Not found" }); res.json(a); });
app.put("/api/admins/:id", authenticate, async (req, res) => { try { const { nickname, title, avatar } = req.body; const a = await prisma.admin.update({ where: { id: Number(req.params.id) }, data: { nickname, title, avatar } }); res.json({ id: a.id, username: a.username, nickname: a.nickname, title: a.title, avatar: a.avatar }); } catch (e) { res.status(500).json({ error: "Failed to update" }); } });
app.get("/api/daily-tip", async (req, res) => { try { const today = new Date(); today.setHours(0, 0, 0, 0); const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1); const saved = await prisma.dailyTip.findFirst({ where: { date: { gte: today, lt: tomorrow }, isActive: true }, orderBy: { createdAt: "desc" } }); if (saved) return res.json({ content: saved.content, source: saved.source || "向阳健康", date: saved.date }); const tip = await getDailyTip(); const created = await prisma.dailyTip.create({ data: { content: tip.content, source: tip.source || "向阳健康", date: new Date() } }); res.json({ content: created.content, source: created.source, date: created.date }); } catch (e) { res.status(500).json({ error: "Failed to fetch" }); } });
app.post("/api/daily-tip", authenticate, async (req, res) => { try { res.json(await prisma.dailyTip.create({ data: { content: req.body.content, source: req.body.source || "向阳健康", date: new Date() } })); } catch (e) { res.status(500).json({ error: "Failed to create" }); } });
app.get("/api/daily-tips", authenticate, async (req, res) => { res.json(await prisma.dailyTip.findMany({ orderBy: { date: "desc" } })); });
app.delete("/api/daily-tips/:id", authenticate, async (req, res) => { try { await prisma.dailyTip.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: "Failed to delete" }); } });

export default app;