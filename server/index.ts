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

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(cors());
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
  app.get("/api/version", (req, res) => res.json({ version: "1.1", updated: new Date().toISOString() }));

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

  // Upload
  app.post("/api/upload", authenticate, upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    // Return relative URL
    res.json({ url: `/uploads/${req.file.filename}` });
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
      const news = await prisma.news.create({ data: req.body });
      res.json(news);
    } catch (e) { res.status(500).json({ error: "Failed to create news" }); }
  });

  app.put("/api/news/:id", authenticate, async (req, res) => {
    try {
      const news = await prisma.news.update({
        where: { id: Number(req.params.id) },
        data: req.body,
      });
      res.json(news);
    } catch (e) { res.status(500).json({ error: "Failed to update news" }); }
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
      const expert = await prisma.expert.create({ data: req.body });
      res.json(expert);
    } catch (e) { res.status(500).json({ error: "Failed to create expert" }); }
  });

  app.put("/api/experts/:id", authenticate, async (req, res) => {
    try {
      const expert = await prisma.expert.update({
        where: { id: Number(req.params.id) },
        data: req.body,
      });
      res.json(expert);
    } catch (e) { res.status(500).json({ error: "Failed to update expert" }); }
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
      const product = await prisma.product.create({ data: req.body });
      res.json(product);
    } catch (e) { res.status(500).json({ error: "Failed to create product" }); }
  });

  app.put("/api/products/:id", authenticate, async (req, res) => {
    try {
      const product = await prisma.product.update({
        where: { id: Number(req.params.id) },
        data: req.body,
      });
      res.json(product);
    } catch (e) { res.status(500).json({ error: "Failed to update product" }); }
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
