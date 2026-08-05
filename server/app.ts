// @ts-nocheck
import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { uploadToOSS } from "./oss";
import { getDailyTip } from "../api/daily-tip";

// Initialize Prisma
export const prisma = new PrismaClient();

// Configure Multer with memory storage for OSS upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// JWT_SECRET 必须显式配置，拒绝使用默认值（防止用已知密钥伪造 token）
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("缺少 JWT_SECRET 环境变量，拒绝启动（安全要求）");
}

// 图片压缩配置
interface ImageConfig {
  width: number;
  height?: number;
  quality: number;
  fit: 'cover' | 'inside' | 'contain' | 'fill';
}

const IMAGE_CONFIG: Record<string, ImageConfig> = {
  avatar: {
    width: 200,
    height: 200,
    quality: 80,
    fit: 'cover',
  },
  news: {
    width: 1200,
    quality: 85,
    fit: 'inside',
  },
  product: {
    width: 800,
    quality: 85,
    fit: 'inside',
  },
  default: {
    width: 1200,
    quality: 85,
    fit: 'inside',
  },
};

// 图片压缩处理函数（返回 Buffer）
async function compressImageBuffer(
  fileBuffer: Buffer,
  type: 'avatar' | 'news' | 'product' | 'default' = 'default'
): Promise<Buffer> {
  const sharp = (await import('sharp')).default;
  const config = IMAGE_CONFIG[type];
  let sharpInstance = sharp(fileBuffer);
  const metadata = await sharpInstance.metadata();

  if (type === 'avatar') {
    sharpInstance = sharpInstance.resize(config.width, config.height, {
      fit: config.fit,
      position: 'center',
    });
  } else {
    sharpInstance = sharpInstance.resize(config.width, undefined, {
      fit: config.fit,
      withoutEnlargement: true,
    });
  }

  const format = metadata.format;
  if (format === 'jpeg' || format === 'jpg') {
    return await sharpInstance.jpeg({ quality: config.quality, progressive: true }).toBuffer();
  } else if (format === 'png') {
    return await sharpInstance.png({ compressionLevel: 9, progressive: true }).toBuffer();
  } else if (format === 'webp') {
    return await sharpInstance.webp({ quality: config.quality }).toBuffer();
  } else if (format === 'gif') {
    return fileBuffer;
  } else {
    return await sharpInstance.jpeg({ quality: config.quality, progressive: true }).toBuffer();
  }
}

function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff'].includes(ext);
}

function isVideoFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ['.mp4', '.webm', '.ogg', '.mov', '.avi'].includes(ext);
}

export function createApp() {
  const app = express();

  // CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Auth middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };

  // ===== Routes =====

  // Version
  app.get("/api/version", (req, res) => res.json({ version: "2.0.0", updated: new Date().toISOString() }));

  // Admin by username
  app.get("/api/admins/by-username/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const admin = await prisma.admin.findUnique({
        where: { username },
        select: { id: true, username: true, nickname: true, avatar: true, title: true }
      });
      if (!admin) return res.json({ username, nickname: null, avatar: null, title: null });
      res.json(admin);
    } catch (e) {
      res.status(500).json({ error: "查询失败" });
    }
  });

  // Admin by name (legacy)
  app.get("/api/admins/by-name/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const admin = await prisma.admin.findFirst({
        where: { OR: [{ username: name }, { nickname: name }] },
        select: { id: true, username: true, nickname: true, avatar: true, title: true }
      });
      if (!admin) return res.json({ username: null, nickname: null, avatar: null, title: null });
      res.json(admin);
    } catch (e) {
      res.status(500).json({ error: "查询失败" });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      const admin = await prisma.admin.findUnique({ where: { username } });
      if (!admin) return res.status(401).json({ error: "Invalid credentials" });
      const isValid = await bcrypt.compare(password, admin.password);
      if (!isValid) return res.status(401).json({ error: "Invalid credentials" });
      const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: "24h" });
      res.json({ token, id: admin.id, username: admin.username, nickname: admin.nickname, title: admin.title, avatar: admin.avatar });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Upload
  app.post("/api/upload", authenticate, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const fileBuffer = req.file.buffer;
    const originalFilename = req.file.originalname;
    const fileType = (req.query.type as string) || 'default';
    const isVideo = isVideoFile(originalFilename);

    if (isVideo || fileType === 'video') {
      try {
        const url = await uploadToOSS(fileBuffer, originalFilename, 'video');
        return res.json({ url });
      } catch (error) {
        return res.status(500).json({ error: "Failed to upload video" });
      }
    }

    if (!isImageFile(originalFilename)) {
      try {
        const url = await uploadToOSS(fileBuffer, originalFilename, fileType);
        return res.json({ url });
      } catch (error) {
        return res.status(500).json({ error: "Failed to upload file" });
      }
    }

    try {
      let uploadBuffer = fileBuffer;
      try {
        const compressedBuffer = await compressImageBuffer(fileBuffer, fileType);
        if (compressedBuffer.length < fileBuffer.length) {
          uploadBuffer = compressedBuffer;
        }
      } catch (compressionError) {
        uploadBuffer = fileBuffer;
      }
      const url = await uploadToOSS(uploadBuffer, originalFilename, fileType);
      res.json({ url });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    const { type } = req.query;
    const where = type ? { type: type as string } : {};
    const categories = await prisma.category.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(categories);
  });

  app.post("/api/categories", authenticate, async (req, res) => {
    try {
      const category = await prisma.category.create({ data: req.body });
      res.json(category);
    } catch (e) { res.status(500).json({ error: "Failed to create category" }); }
  });

  app.put("/api/categories/:id", authenticate, async (req, res) => {
    try {
      const category = await prisma.category.update({
        where: { id: Number(req.params.id) },
        data: req.body,
      });
      res.json(category);
    } catch (e) { res.status(500).json({ error: "Failed to update" }); }
  });

  app.delete("/api/categories/:id", authenticate, async (req, res) => {
    try {
      await prisma.category.delete({ where: { id: Number(req.params.id) } });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Failed to delete" }); }
  });

  // News
  app.get("/api/news", async (req, res) => {
    const news = await prisma.news.findMany({ include: { category: true }, orderBy: { date: 'desc' } });
    res.json(news);
  });

  app.get("/api/news/:id", async (req, res) => {
    const item = await prisma.news.findUnique({ where: { id: Number(req.params.id) }, include: { category: true } });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  });

  app.post("/api/news", authenticate, async (req, res) => {
    try {
      const { title, author, authorTitle, authorAvatar, cover, content, date, categoryId } = req.body;
      const news = await prisma.news.create({
        data: { title, author, authorTitle, authorAvatar, cover, content, date: date ? new Date(date) : undefined, categoryId },
      });
      res.json(news);
    } catch (e) { res.status(500).json({ error: "Failed to create news", details: (e as Error).message }); }
  });

  app.put("/api/news/:id", authenticate, async (req, res) => {
    try {
      const { title, author, authorTitle, authorAvatar, cover, content, date, categoryId } = req.body;
      const news = await prisma.news.update({
        where: { id: Number(req.params.id) },
        data: {
          ...(title !== undefined && { title }),
          ...(author !== undefined && { author }),
          ...(authorTitle !== undefined && { authorTitle }),
          ...(authorAvatar !== undefined && { authorAvatar }),
          ...(cover !== undefined && { cover }),
          ...(content !== undefined && { content }),
          ...(date !== undefined && { date: date ? new Date(date) : undefined }),
          ...(categoryId !== undefined && { categoryId }),
        },
      });
      res.json(news);
    } catch (e) { res.status(500).json({ error: "Failed to update news", details: (e as Error).message }); }
  });

  app.delete("/api/news/:id", authenticate, async (req, res) => {
    try {
      await prisma.news.delete({ where: { id: Number(req.params.id) } });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Failed to delete" }); }
  });

  // Experts
  app.get("/api/experts", async (req, res) => {
    const experts = await prisma.expert.findMany({ include: { category: true }, orderBy: { createdAt: 'desc' } });
    res.json(experts);
  });

  app.get("/api/experts/:id", async (req, res) => {
    try {
      const expert = await prisma.expert.findUnique({ where: { id: Number(req.params.id) }, include: { category: true } });
      if (!expert) return res.status(404).json({ error: "Expert not found" });
      res.json(expert);
    } catch (e) { res.status(500).json({ error: "Failed to fetch expert" }); }
  });

  app.post("/api/experts", authenticate, async (req, res) => {
    try {
      const { name, title, avatar, unit, achievements, introduction, categoryId } = req.body;
      const expert = await prisma.expert.create({ data: { name, title, avatar, unit, achievements, introduction, categoryId } });
      res.json(expert);
    } catch (e) { res.status(500).json({ error: "Failed to create expert", details: (e as Error).message }); }
  });

  app.put("/api/experts/:id", authenticate, async (req, res) => {
    try {
      const { name, title, avatar, unit, achievements, introduction, categoryId } = req.body;
      const expert = await prisma.expert.update({
        where: { id: Number(req.params.id) },
        data: { ...(name !== undefined && { name }), ...(title !== undefined && { title }), ...(avatar !== undefined && { avatar }), ...(unit !== undefined && { unit }), ...(achievements !== undefined && { achievements }), ...(introduction !== undefined && { introduction }), ...(categoryId !== undefined && { categoryId }) },
      });
      res.json(expert);
    } catch (e) { res.status(500).json({ error: "Failed to update expert", details: (e as Error).message }); }
  });

  app.delete("/api/experts/:id", authenticate, async (req, res) => {
    try {
      await prisma.expert.delete({ where: { id: Number(req.params.id) } });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Failed to delete" }); }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    const products = await prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: 'desc' } });
    res.json(products);
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) }, include: { category: true } });
      if (!product) return res.status(404).json({ error: "Product not found" });
      res.json(product);
    } catch (e) { res.status(500).json({ error: "Failed to fetch product" }); }
  });

  app.post("/api/products", authenticate, async (req, res) => {
    try {
      const { name, rating, image, introduction, url, price, categoryId } = req.body;
      const product = await prisma.product.create({ data: { name, rating, image, introduction, url, price, categoryId } });
      res.json(product);
    } catch (e) { res.status(500).json({ error: "Failed to create product", details: (e as Error).message }); }
  });

  app.put("/api/products/:id", authenticate, async (req, res) => {
    try {
      const { name, rating, image, introduction, url, price, categoryId } = req.body;
      const product = await prisma.product.update({
        where: { id: Number(req.params.id) },
        data: { ...(name !== undefined && { name }), ...(rating !== undefined && { rating }), ...(image !== undefined && { image }), ...(introduction !== undefined && { introduction }), ...(url !== undefined && { url }), ...(price !== undefined && { price }), ...(categoryId !== undefined && { categoryId }) },
      });
      res.json(product);
    } catch (e) { res.status(500).json({ error: "Failed to update product", details: (e as Error).message }); }
  });

  app.delete("/api/products/:id", authenticate, async (req, res) => {
    try {
      await prisma.product.delete({ where: { id: Number(req.params.id) } });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Failed to delete" }); }
  });

  // Admins
  app.get("/api/admins", authenticate, async (req, res) => {
    const admins = await prisma.admin.findMany({ select: { id: true, username: true, nickname: true, title: true, avatar: true, createdAt: true } });
    res.json(admins);
  });

  app.post("/api/admins", authenticate, async (req, res) => {
    try {
      const { username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = await prisma.admin.create({ data: { username, password: hashedPassword } });
      res.json({ id: admin.id, username: admin.username });
    } catch (e) { res.status(500).json({ error: "Failed to create admin" }); }
  });

  app.put("/api/admins/:id/password", authenticate, async (req, res) => {
    try {
      const { password, oldPassword } = req.body;
      if (!password || password.length < 6) return res.status(400).json({ error: "密码长度至少6位" });
      const admin = await prisma.admin.findUnique({ where: { id: Number(req.params.id) } });
      if (!admin) return res.status(404).json({ error: "用户不存在" });
      if (oldPassword && !(await bcrypt.compare(oldPassword, admin.password))) {
        return res.status(403).json({ error: "旧密码不正确" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.admin.update({ where: { id: admin.id }, data: { password: hashedPassword } });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Failed to change password" }); }
  });

  app.get("/api/admins/:id", authenticate, async (req, res) => {
    const admin = await prisma.admin.findUnique({ where: { id: Number(req.params.id) }, select: { id: true, username: true, nickname: true, title: true, avatar: true, createdAt: true } });
    if (!admin) return res.status(404).json({ error: "Not found" });
    res.json(admin);
  });

  app.put("/api/admins/:id", authenticate, async (req, res) => {
    try {
      const { nickname, title, avatar } = req.body;
      const admin = await prisma.admin.update({ where: { id: Number(req.params.id) }, data: { nickname, title, avatar } });
      res.json({ id: admin.id, username: admin.username, nickname: admin.nickname, title: admin.title, avatar: admin.avatar });
    } catch (e) { res.status(500).json({ error: "Failed to update profile" }); }
  });

  // Daily Tip
  app.get("/api/daily-tip", async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const savedTip = await prisma.dailyTip.findFirst({
        where: { date: { gte: today, lt: tomorrow }, isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      if (savedTip) {
        return res.json({ content: savedTip.content, source: savedTip.source || "向阳健康", date: savedTip.date });
      }

      const tip = await getDailyTip();
      const newTip = await prisma.dailyTip.create({
        data: { content: tip.content, source: tip.source || "向阳健康", date: new Date() }
      });
      res.json({ content: newTip.content, source: newTip.source, date: newTip.date });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch daily tip" });
    }
  });

  app.post("/api/daily-tip", authenticate, async (req, res) => {
    try {
      const tip = await prisma.dailyTip.create({ data: { content: req.body.content, source: req.body.source || "向阳健康", date: new Date() } });
      res.json(tip);
    } catch (e) { res.status(500).json({ error: "Failed to create daily tip" }); }
  });

  app.get("/api/daily-tips", authenticate, async (req, res) => {
    try {
      const tips = await prisma.dailyTip.findMany({ orderBy: { date: 'desc' } });
      res.json(tips);
    } catch (e) { res.status(500).json({ error: "Failed to fetch daily tips" }); }
  });

  app.delete("/api/daily-tips/:id", authenticate, async (req, res) => {
    try {
      await prisma.dailyTip.delete({ where: { id: Number(req.params.id) } });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Failed to delete daily tip" }); }
  });

  return app;
}