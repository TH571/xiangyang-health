import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Prisma
const prisma = new PrismaClient();

// Ensure upload directory exists at project root (one level up from server or dist)
const uploadDir = path.resolve(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

const JWT_SECRET = process.env.JWT_SECRET || "xiangyang-secret-key";

// Get the base URL for constructing full URLs (for production/CDN)
function getBaseUrl(req: any): string {
  // In production, use APP_BASE_URL env var or construct from request
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL;
  }
  // Fallback: construct from request headers
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}`;
}

// Helper to get full image URL
function getImageUrl(relativePath: string, req: any): string {
  // In development, return relative path (frontend will proxy)
  if (process.env.NODE_ENV !== 'production') {
    return relativePath;
  }
  // In production, return full URL
  return `${getBaseUrl(req)}${relativePath}`;
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

// 图片压缩处理函数
async function compressImage(
  inputPath: string,
  outputPath: string,
  type: 'avatar' | 'news' | 'product' | 'default' = 'default'
): Promise<void> {
  const config = IMAGE_CONFIG[type];

  let sharpInstance = sharp(inputPath);

  // 获取图片元数据
  const metadata = await sharpInstance.metadata();

  // 根据类型处理
  if (type === 'avatar') {
    // 头像：固定尺寸，裁剪为正方形
    sharpInstance = sharpInstance.resize(config.width, config.height, {
      fit: config.fit,
      position: 'center',
    });
  } else {
    // 其他：按宽度等比缩放
    sharpInstance = sharpInstance.resize(config.width, undefined, {
      fit: config.fit,
      withoutEnlargement: true, // 不放大小图片
    });
  }

  // 根据格式选择输出
  const format = metadata.format;
  if (format === 'jpeg' || format === 'jpg') {
    await sharpInstance.jpeg({ quality: config.quality, progressive: true }).toFile(outputPath);
  } else if (format === 'png') {
    // PNG使用压缩级别而非quality
    await sharpInstance.png({ compressionLevel: 9, progressive: true }).toFile(outputPath);
  } else if (format === 'webp') {
    await sharpInstance.webp({ quality: config.quality }).toFile(outputPath);
  } else if (format === 'gif') {
    // GIF不压缩，直接复制
    fs.copyFileSync(inputPath, outputPath);
  } else {
    // 其他格式转为jpeg
    await sharpInstance.jpeg({ quality: config.quality, progressive: true }).toFile(outputPath);
  }
}

// 判断是否为图片文件
function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff'].includes(ext);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // CORS configuration for frontend-backend separation
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow requests from allowed origins
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

  // Serve static files from the stable uploads directory
  app.use("/uploads", express.static(uploadDir));

  // Serve frontend static files in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  // API Routes
  app.get("/api/version", (req, res) => res.json({ version: "2.0.0", updated: new Date().toISOString() }));

  // Get admin by username (for dynamic author info lookup in articles)
  app.get("/api/admins/by-username/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const admin = await prisma.admin.findUnique({
        where: { username },
        select: { id: true, username: true, nickname: true, avatar: true, title: true }
      });

      if (!admin) {
        return res.json({ username, nickname: null, avatar: null, title: null });
      }

      res.json(admin);
    } catch (e) {
      res.status(500).json({ error: "查询失败" });
    }
  });

  // Legacy: Get admin by name (supports both username and nickname for backward compatibility)
  app.get("/api/admins/by-name/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const admin = await prisma.admin.findFirst({
        where: {
          OR: [
            { username: name },
            { nickname: name }
          ]
        },
        select: { id: true, username: true, nickname: true, avatar: true, title: true }
      });

      if (!admin) {
        return res.json({ username: null, nickname: null, avatar: null, title: null });
      }

      res.json(admin);
    } catch (e) {
      res.status(500).json({ error: "查询失败" });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt for username: ${username}`);
    try {
      const admin = await prisma.admin.findUnique({ where: { username } });
      if (!admin) {
        console.log("User not found");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, admin.password);
      if (!isValid) {
        console.log("Invalid password");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, {
        expiresIn: "24h",
      });
      console.log("Login successful");
      res.json({ token, id: admin.id, username: admin.username, nickname: admin.nickname, title: admin.title, avatar: admin.avatar });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Auth: Middleware
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

  // Upload with image compression
  app.post("/api/upload", authenticate, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path;
    const originalFilename = req.file.filename;
    const fileExt = path.extname(originalFilename).toLowerCase();

    // 如果不是图片文件，直接返回原文件
    if (!isImageFile(originalFilename)) {
      // 返回相对路径，让前端根据 VITE_API_BASE_URL 构建完整URL
      return res.json({ url: `/uploads/${originalFilename}` });
    }

    // 获取图片类型参数 (avatar, news, product, default)
    const imageType = (req.query.type as 'avatar' | 'news' | 'product' | 'default') || 'default';

    try {
      // 创建临时压缩文件路径
      const tempPath = path.join(uploadDir, `temp-${originalFilename}`);

      // 压缩图片到临时文件
      await compressImage(filePath, tempPath, imageType);

      // 获取文件大小对比
      const originalSize = fs.statSync(filePath).size;
      const compressedSize = fs.statSync(tempPath).size;

      // 如果压缩后更小，替换原文件
      if (compressedSize < originalSize) {
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);
        console.log(`Image compressed: ${originalFilename} (${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB)`);
      } else {
        // 压缩后更大，删除临时文件，保留原图
        fs.unlinkSync(tempPath);
        console.log(`Image kept original (compression not beneficial): ${originalFilename}`);
      }

      // 返回相对路径，让前端根据 VITE_API_BASE_URL 构建完整URL
      res.json({ url: `/uploads/${originalFilename}` });
    } catch (error) {
      console.error('Image compression error:', error);
      // 压缩失败也返回相对路径
      res.json({ url: `/uploads/${originalFilename}` });
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
    } catch (e) {
      res.status(500).json({ error: "Failed to create category" });
    }
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
    const news = await prisma.news.findMany({
      include: { category: true },
      orderBy: { date: 'desc' }
    });
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
        data: {
          title,
          author,
          authorTitle,
          authorAvatar,
          cover,
          content,
          date: date ? new Date(date) : undefined,
          categoryId,
        },
      });
      res.json(news);
    } catch (e) {
      console.error("Failed to create news:", e);
      res.status(500).json({ error: "Failed to create news", details: (e as Error).message });
    }
  });

  app.put("/api/news/:id", authenticate, async (req, res) => {
    try {
      // 只提取 Prisma schema 中存在的字段
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
    } catch (e) {
      console.error("Failed to update news:", e);
      res.status(500).json({ error: "Failed to update news", details: (e as Error).message });
    }
  });

  app.delete("/api/news/:id", authenticate, async (req, res) => {
    try {
      await prisma.news.delete({ where: { id: Number(req.params.id) } });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Failed to delete" }); }
  });

  // Health Experts
  app.get("/api/experts", async (req, res) => {
    const experts = await prisma.expert.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(experts);
  });

  app.get("/api/experts/:id", async (req, res) => {
    try {
      const expert = await prisma.expert.findUnique({
        where: { id: Number(req.params.id) },
        include: { category: true }
      });
      if (!expert) return res.status(404).json({ error: "Expert not found" });
      res.json(expert);
    } catch (e) { res.status(500).json({ error: "Failed to fetch expert" }); }
  });

  app.post("/api/experts", authenticate, async (req, res) => {
    try {
      const { name, title, avatar, unit, achievements, introduction, categoryId } = req.body;
      const expert = await prisma.expert.create({
        data: { name, title, avatar, unit, achievements, introduction, categoryId },
      });
      res.json(expert);
    } catch (e) {
      console.error("Failed to create expert:", e);
      res.status(500).json({ error: "Failed to create expert", details: (e as Error).message });
    }
  });

  app.put("/api/experts/:id", authenticate, async (req, res) => {
    try {
      const { name, title, avatar, unit, achievements, introduction, categoryId } = req.body;
      const expert = await prisma.expert.update({
        where: { id: Number(req.params.id) },
        data: {
          ...(name !== undefined && { name }),
          ...(title !== undefined && { title }),
          ...(avatar !== undefined && { avatar }),
          ...(unit !== undefined && { unit }),
          ...(achievements !== undefined && { achievements }),
          ...(introduction !== undefined && { introduction }),
          ...(categoryId !== undefined && { categoryId }),
        },
      });
      res.json(expert);
    } catch (e) {
      console.error("Failed to update expert:", e);
      res.status(500).json({ error: "Failed to update expert", details: (e as Error).message });
    }
  });

  app.delete("/api/experts/:id", authenticate, async (req, res) => {
    try {
      await prisma.expert.delete({ where: { id: Number(req.params.id) } });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Failed to delete" }); }
  });

  // Selection Products
  app.get("/api/products", async (req, res) => {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: Number(req.params.id) },
        include: { category: true }
      });
      if (!product) return res.status(404).json({ error: "Product not found" });
      res.json(product);
    } catch (e) { res.status(500).json({ error: "Failed to fetch product" }); }
  });

  app.post("/api/products", authenticate, async (req, res) => {
    try {
      const { name, rating, image, introduction, url, price, categoryId } = req.body;
      const product = await prisma.product.create({
        data: { name, rating, image, introduction, url, price, categoryId },
      });
      res.json(product);
    } catch (e) {
      console.error("Failed to create product:", e);
      res.status(500).json({ error: "Failed to create product", details: (e as Error).message });
    }
  });

  app.put("/api/products/:id", authenticate, async (req, res) => {
    try {
      const { name, rating, image, introduction, url, price, categoryId } = req.body;
      const product = await prisma.product.update({
        where: { id: Number(req.params.id) },
        data: {
          ...(name !== undefined && { name }),
          ...(rating !== undefined && { rating }),
          ...(image !== undefined && { image }),
          ...(introduction !== undefined && { introduction }),
          ...(url !== undefined && { url }),
          ...(price !== undefined && { price }),
          ...(categoryId !== undefined && { categoryId }),
        },
      });
      res.json(product);
    } catch (e) {
      console.error("Failed to update product:", e);
      res.status(500).json({ error: "Failed to update product", details: (e as Error).message });
    }
  });

  app.delete("/api/products/:id", authenticate, async (req, res) => {
    try {
      await prisma.product.delete({ where: { id: Number(req.params.id) } });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Failed to delete" }); }
  });

  // Admins
  app.get("/api/admins", authenticate, async (req, res) => {
    // Return all profile fields
    const admins = await prisma.admin.findMany({ select: { id: true, username: true, nickname: true, title: true, avatar: true, createdAt: true } });
    res.json(admins);
  });

  app.post("/api/admins", authenticate, async (req, res) => {
    try {
      const { username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = await prisma.admin.create({
        data: { username, password: hashedPassword },
      });
      res.json({ id: admin.id, username: admin.username });
    } catch (e) { res.status(500).json({ error: "Failed to create admin" }); }
  });

  app.put("/api/admins/:id/password", authenticate, async (req, res) => {
    try {
      const { password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.admin.update({
        where: { id: Number(req.params.id) },
        data: { password: hashedPassword }
      });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Failed to change password" }); }
  });

  app.get("/api/admins/:id", authenticate, async (req, res) => {
    const admin = await prisma.admin.findUnique({
      where: { id: Number(req.params.id) },
      select: { id: true, username: true, nickname: true, title: true, avatar: true, createdAt: true }
    });
    if (!admin) return res.status(404).json({ error: "Not found" });
    res.json(admin);
  });

  app.put("/api/admins/:id", authenticate, async (req, res) => {
    try {
      const { nickname, title, avatar } = req.body;
      const admin = await prisma.admin.update({
        where: { id: Number(req.params.id) },
        data: { nickname, title, avatar }
      });
      res.json({ id: admin.id, username: admin.username, nickname: admin.nickname, title: admin.title, avatar: admin.avatar });
    } catch (e) { res.status(500).json({ error: "Failed to update profile" }); }
  });

  // Frontend Routing (SPA)
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(staticPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
