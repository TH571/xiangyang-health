import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import OSS from "ali-oss";
import path from "path";
import sharp from "sharp";
import axios from "axios";

// ===== Prisma =====
const prisma = new PrismaClient();

// ===== OSS =====
let _ossClient: OSS | null = null;
function getOSS() {
  if (!_ossClient) _ossClient = new OSS({ region: "oss-cn-hangzhou", accessKeyId: process.env.OSS_ACCESS_KEY_ID || "", accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || "", bucket: process.env.OSS_BUCKET || "xyjk-data", secure: true });
  return _ossClient;
}
const OSS_DOMAIN = process.env.OSS_DOMAIN || "https://xyjk-data.oss-cn-hangzhou.aliyuncs.com";

async function uploadToOSS(file: Buffer, filename: string, type: string = "default"): Promise<string> {
  const ext = path.extname(filename);
  const key = `${type}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  await getOSS().put(key, file, { headers: { "Content-Type": getContentType(ext), "Cache-Control": "public, max-age=31536000, immutable" } });
  return `${OSS_DOMAIN}/${key}`;
}
function getContentType(ext: string): string {
  const t: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp", ".avif": "image/avif", ".heic": "image/heic", ".heif": "image/heif", ".bmp": "image/bmp", ".svg": "image/svg+xml", ".tiff": "image/tiff", ".tif": "image/tiff", ".ico": "image/x-icon", ".mp4": "video/mp4", ".webm": "video/webm", ".pdf": "application/pdf", ".doc": "application/msword", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".xls": "application/vnd.ms-excel", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".zip": "application/zip" };
  return t[ext.toLowerCase()] || "application/octet-stream";
}

// ===== Daily Tip（自包含：Vercel 函数只打包 api/index.ts，不能引用兄弟文件） =====
const FALLBACK_TIPS = [
  { content: "每天坚持运动 30 分钟，可以有效降低心血管疾病风险，增强免疫力。", source: "中国健康教育中心" },
  { content: "人体所需三大宏量为：碳水 脂肪 蛋白质", source: "向阳健康" },
  { content: "成年人每天应摄入 300-500 克蔬菜，深色蔬菜应占一半以上。", source: "中国居民膳食指南" },
  { content: "每天饮水 1500-1700 毫升，少量多次，不要等到口渴了再喝水。", source: "中国营养学会" },
  { content: "控制盐摄入量，每日不超过 5 克，有助于预防高血压。", source: "世界卫生组织" },
  { content: "定期体检是预防疾病的重要手段，建议每年进行一次全面体检。", source: "中国健康教育中心" },
  { content: "保持乐观心态，学会减压，对身心健康都有益处。", source: "国家卫健委" },
  { content: "戒烟限酒，远离二手烟，是保护自己和家人健康的重要措施。", source: "中国疾控中心" },
  { content: "饭前便后要洗手，养成良好的卫生习惯，预防疾病传播。", source: "中国疾控中心" },
  { content: "多吃全谷物、坚果和豆类，减少精制食品摄入，有助于控制血糖。", source: "中国营养学会" },
  { content: "久坐伤身，建议每工作 1 小时起身活动 5-10 分钟。", source: "世界卫生组织" },
  { content: "晒太阳可以促进维生素 D 合成，每天 15-30 分钟日照有益健康。", source: "中国健康教育中心" },
  { content: "控制体重在正常范围（BMI 18.5-23.9），可以降低多种慢性病风险。", source: "中国疾控中心" },
  { content: "多吃富含 Omega-3 的食物，如深海鱼类，有助于心脑血管健康。", source: "中国营养学会" },
  { content: "保持社交活动，与家人朋友多交流，有助于心理健康。", source: "国家卫健委" },
];
async function getDailyTip() {
  if (process.env.TIANAPI_KEY) {
    try {
      const r = await axios.get("https://api.tianapi.com/health/index", { params: { key: process.env.TIANAPI_KEY }, timeout: 5000 });
      if (r.data.code === 200 && r.data.result?.list?.length) return { content: r.data.result.list[0].brief || r.data.result.list[0].title, source: r.data.result.list[0].source || "天行数据" };
    } catch {}
  }
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return FALLBACK_TIPS[doy % FALLBACK_TIPS.length];
}

// ===== 图片压缩（与 server/app.ts 保持一致） =====
interface ImageConfig {
  width: number;
  height?: number;
  quality: number;
  fit: 'cover' | 'inside' | 'contain' | 'fill';
}

const IMAGE_CONFIG: Record<string, ImageConfig> = {
  avatar: { width: 200, height: 200, quality: 80, fit: 'cover' },
  news: { width: 1200, quality: 85, fit: 'inside' },
  product: { width: 800, quality: 85, fit: 'inside' },
  default: { width: 1200, quality: 85, fit: 'inside' },
};

async function compressImageBuffer(
  fileBuffer: Buffer,
  type: 'avatar' | 'news' | 'product' | 'default' = 'default'
): Promise<Buffer> {
  const config = IMAGE_CONFIG[type];
  let sharpInstance = sharp(fileBuffer);
  const metadata = await sharpInstance.metadata();

  if (type === 'avatar') {
    sharpInstance = sharpInstance.resize(config.width, config.height, { fit: config.fit, position: 'center' });
  } else {
    sharpInstance = sharpInstance.resize(config.width, undefined, { fit: config.fit, withoutEnlargement: true });
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

// ===== Express App =====
const app = express();

// JWT_SECRET 必须显式配置，拒绝使用默认值（防止用已知密钥伪造 token）
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("缺少 JWT_SECRET 环境变量，拒绝启动（安全要求）");
}
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",").map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.length === 0) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // 通配：xyjk.ren 及其子域名
    try {
      const u = new URL(origin);
      if (u.hostname === 'xyjk.ren' || u.hostname.endsWith('.xyjk.ren')) return callback(null, true);
    } catch {}
    console.warn("CORS blocked origin:", origin);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 缓存中间件：仅公开 GET 接口走 CDN 缓存（60 秒），鉴权接口一律不缓存
const PUBLIC_GET_PREFIXES = [
  "/api/version",
  "/api/categories",
  "/api/news",
  "/api/experts",
  "/api/products",
  "/api/daily-tip",
  "/api/admins/by-username",
  "/api/admins/by-name",
];
app.use((req, res, next) => {
  const isPublicGet = req.method === "GET" && PUBLIC_GET_PREFIXES.some(p => req.path === p || req.path.startsWith(`${p}/`));
  if (isPublicGet) {
    res.set("Cache-Control", "public, s-maxage=60, max-age=10");
  } else {
    res.set("Cache-Control", "no-store");
  }
  next();
});

const auth = (req: any, res: any, next: any) => {
  try { req.user = jwt.verify(req.headers.authorization?.split(" ")[1] || "", JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "Unauthorized" }); }
};

// 可选鉴权：成功返回用户信息，失败返回 null（用于"已登录可看草稿"类逻辑）
const tryAuth = (req: any) => {
  try { return jwt.verify(req.headers.authorization?.split(" ")[1] || "", JWT_SECRET); }
  catch { return null; }
};

// 幂等启动迁移：首次部署后第一个请求自动补列（IF NOT EXISTS 保证可重入）
let schemaMigrated = false;
const SCHEMA_MIGRATIONS = [
  `ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Expert" ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT false`,
];
app.use(async (req, res, next) => {
  if (!schemaMigrated) {
    try {
      for (const sql of SCHEMA_MIGRATIONS) {
        await prisma.$executeRawUnsafe(sql);
      }
      schemaMigrated = true;
    } catch (e: any) {
      console.error("Schema migration failed (will retry on next request):", e.message);
    }
  }
  next();
});

// ===== Routes =====
app.get("/api/version", (req, res) => res.json({ version: "2.0.0", updated: new Date().toISOString() }));
app.get("/api/admins/by-username/:username", async (req, res) => {
  try { const a = await prisma.admin.findUnique({ where: { username: req.params.username }, select: { id: true, username: true, nickname: true, avatar: true, title: true } }); res.json(a || { username: req.params.username, nickname: null, avatar: null, title: null }); }
  catch { res.status(500).json({ error: "查询失败" }); }
});
app.get("/api/admins/by-name/:name", async (req, res) => {
  try { const a = await prisma.admin.findFirst({ where: { OR: [{ username: req.params.name }, { nickname: req.params.name }] }, select: { id: true, username: true, nickname: true, avatar: true, title: true } }); res.json(a || { username: null, nickname: null, avatar: null, title: null }); }
  catch { res.status(500).json({ error: "查询失败" }); }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const a = await prisma.admin.findUnique({ where: { username: req.body.username } });
    if (!a || !(await bcrypt.compare(req.body.password, a.password))) return res.status(401).json({ error: "Invalid credentials" });
    const t = jwt.sign({ id: a.id, username: a.username }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token: t, id: a.id, username: a.username, nickname: a.nickname, title: a.title, avatar: a.avatar });
  } catch { res.status(500).json({ error: "Login failed" }); }
});
app.post("/api/upload", auth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const fileBuffer = req.file.buffer;
  const originalFilename = req.file.originalname;
  const fileType = String(req.query.type || "default");

  // 视频：原样上传到 video/ 目录
  if (isVideoFile(originalFilename) || fileType === "video") {
    try { res.json({ url: await uploadToOSS(fileBuffer, originalFilename, "video") }); }
    catch (e: any) { console.error("Video upload failed:", e.message); res.status(500).json({ error: "Failed to upload video" }); }
    return;
  }

  // 非图片文件：原样上传
  if (!isImageFile(originalFilename)) {
    try { res.json({ url: await uploadToOSS(fileBuffer, originalFilename, fileType) }); }
    catch (e: any) { console.error("File upload failed:", e.message); res.status(500).json({ error: "Failed to upload file" }); }
    return;
  }

  // 图片：压缩后再上传
  try {
    let uploadBuffer = fileBuffer;
    let uploadName = originalFilename;
    try {
      const compressed = await compressImageBuffer(fileBuffer, fileType as any);
      if (compressed.length < fileBuffer.length) {
        uploadBuffer = compressed;
        // 压缩后格式可能变化（PNG/BMP/TIFF → JPEG），修正扩展名避免 MIME 错配
        const base = originalFilename.replace(/\.[^.]+$/, "");
        const srcExt = path.extname(originalFilename).toLowerCase();
        uploadName = srcExt === ".webp" ? `${base}.webp` : `${base}.jpg`;
      }
    } catch (e: any) { console.error("Image compress failed, upload original:", e.message); uploadBuffer = fileBuffer; }
    res.json({ url: await uploadToOSS(uploadBuffer, uploadName, fileType) });
  } catch (e: any) { console.error("Image upload failed:", e.message); res.status(500).json({ error: "Upload failed" }); }
});
// 浏览器直传 OSS：生成签名 URL
app.post("/api/upload-url", auth, async (req, res) => {
  try {
    const { filename, type, mimeType } = req.body;
    if (!filename) return res.status(400).json({ error: "Filename required" });
    const ext = path.extname(filename);
    const key = `${type || "default"}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    // 用前端传来的 mimeType 签名（浏览器 file.type），保证签名与请求头一致
    const contentType = mimeType || getContentType(ext) || "application/octet-stream";
    const signedUrl = getOSS().signatureUrl(key, { expires: 3600, method: "PUT", "content-type": contentType });
    res.json({ uploadUrl: signedUrl, publicUrl: `${OSS_DOMAIN}/${key}`, contentType });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
app.get("/api/categories", async (req, res) => { res.json(await prisma.category.findMany({ where: req.query.type ? { type: String(req.query.type) } : {}, orderBy: { createdAt: "desc" } })); });
app.post("/api/categories", auth, async (req, res) => { try { res.json(await prisma.category.create({ data: req.body })); } catch { res.status(500).json({ error: "Failed to create" }); } });
app.put("/api/categories/:id", auth, async (req, res) => { try { res.json(await prisma.category.update({ where: { id: Number(req.params.id) }, data: req.body })); } catch { res.status(500).json({ error: "Failed to update" }); } });
app.delete("/api/categories/:id", auth, async (req, res) => { try { await prisma.category.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); } catch { res.status(500).json({ error: "Failed to delete" }); } });
app.get("/api/news", async (req, res) => {
  // 后台管理列表（?all=1 + 有效 token）返回全部（含草稿）；公开接口只返回已发布
  const isAdminList = req.query.all === "1" && tryAuth(req);
  const news = await prisma.news.findMany({
    where: isAdminList ? undefined : { isPublished: true },
    select: { id: true, title: true, author: true, authorTitle: true, authorAvatar: true, cover: true, date: true, categoryId: true, category: true, createdAt: true, isPublished: true, isPinned: true },
    orderBy: isAdminList ? { date: "desc" } : [{ isPinned: "desc" }, { date: "desc" }],
  });
  res.json(news);
});
app.get("/api/news/:id", async (req, res) => {
  try {
    const n = await prisma.news.findUnique({ where: { id: Number(req.params.id) }, include: { category: true } });
    if (!n) return res.status(404).json({ error: "Not found" });
    // 未发布的文章仅管理员可见
    if (!n.isPublished && !tryAuth(req)) return res.status(404).json({ error: "Not found" });
    res.json(n);
  } catch { res.status(500).json({ error: "Failed to fetch" }); }
});
app.post("/api/news", auth, async (req, res) => {
  try {
    const { title, author, authorTitle, authorAvatar, cover, content, date, categoryId, isPublished, isPinned } = req.body;
    res.json(await prisma.news.create({ data: { title, author, authorTitle, authorAvatar, cover, content, date: date ? new Date(date) : undefined, categoryId, isPublished: isPublished ?? true, isPinned: isPinned ?? false } }));
  } catch { res.status(500).json({ error: "Failed to create" }); }
});
app.put("/api/news/:id", auth, async (req, res) => { try { const d = req.body; res.json(await prisma.news.update({ where: { id: Number(req.params.id) }, data: { ...(d.title !== undefined && { title: d.title }), ...(d.author !== undefined && { author: d.author }), ...(d.authorTitle !== undefined && { authorTitle: d.authorTitle }), ...(d.authorAvatar !== undefined && { authorAvatar: d.authorAvatar }), ...(d.cover !== undefined && { cover: d.cover }), ...(d.content !== undefined && { content: d.content }), ...(d.date !== undefined && { date: new Date(d.date) }), ...(d.categoryId !== undefined && { categoryId: d.categoryId }), ...(d.isPublished !== undefined && { isPublished: Boolean(d.isPublished) }), ...(d.isPinned !== undefined && { isPinned: Boolean(d.isPinned) }) } })); } catch { res.status(500).json({ error: "Failed to update" }); } });
app.delete("/api/news/:id", auth, async (req, res) => { try { await prisma.news.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); } catch { res.status(500).json({ error: "Failed to delete" }); } });
app.get("/api/experts", async (req, res) => { res.json(await prisma.expert.findMany({ include: { category: true }, orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }] })); });
app.get("/api/experts/:id", async (req, res) => { try { const e = await prisma.expert.findUnique({ where: { id: Number(req.params.id) }, include: { category: true } }); if (!e) return res.status(404).json({ error: "Expert not found" }); res.json(e); } catch { res.status(500).json({ error: "Failed to fetch" }); } });
app.post("/api/experts", auth, async (req, res) => { try { const { name, title, avatar, unit, achievements, introduction, categoryId, isPinned } = req.body; res.json(await prisma.expert.create({ data: { name, title, avatar, unit, achievements, introduction, categoryId, isPinned: isPinned ?? false } })); } catch { res.status(500).json({ error: "Failed to create" }); } });
app.put("/api/experts/:id", auth, async (req, res) => { try { const d = req.body; res.json(await prisma.expert.update({ where: { id: Number(req.params.id) }, data: { ...(d.name !== undefined && { name: d.name }), ...(d.title !== undefined && { title: d.title }), ...(d.avatar !== undefined && { avatar: d.avatar }), ...(d.unit !== undefined && { unit: d.unit }), ...(d.achievements !== undefined && { achievements: d.achievements }), ...(d.introduction !== undefined && { introduction: d.introduction }), ...(d.categoryId !== undefined && { categoryId: d.categoryId }), ...(d.isPinned !== undefined && { isPinned: Boolean(d.isPinned) }) } })); } catch { res.status(500).json({ error: "Failed to update" }); } });
app.delete("/api/experts/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.expert.findUnique({ where: { id } });
    if (!existing) return res.json({ success: true, note: "not_found" });
    await prisma.expert.delete({ where: { id } });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to delete" }); }
});
app.get("/api/products", async (req, res) => { res.json(await prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } })); });
app.get("/api/products/:id", async (req, res) => { try { const p = await prisma.product.findUnique({ where: { id: Number(req.params.id) }, include: { category: true } }); if (!p) return res.status(404).json({ error: "Product not found" }); res.json(p); } catch { res.status(500).json({ error: "Failed to fetch" }); } });
app.post("/api/products", auth, async (req, res) => { try { const { name, rating, image, introduction, url, price, categoryId } = req.body; res.json(await prisma.product.create({ data: { name, rating, image, introduction, url, price, categoryId } })); } catch { res.status(500).json({ error: "Failed to create" }); } });
app.put("/api/products/:id", auth, async (req, res) => { try { const d = req.body; res.json(await prisma.product.update({ where: { id: Number(req.params.id) }, data: { ...(d.name !== undefined && { name: d.name }), ...(d.rating !== undefined && { rating: d.rating }), ...(d.image !== undefined && { image: d.image }), ...(d.introduction !== undefined && { introduction: d.introduction }), ...(d.url !== undefined && { url: d.url }), ...(d.price !== undefined && { price: d.price }), ...(d.categoryId !== undefined && { categoryId: d.categoryId }) } })); } catch { res.status(500).json({ error: "Failed to update" }); } });
app.delete("/api/products/:id", auth, async (req, res) => { try { await prisma.product.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); } catch { res.status(500).json({ error: "Failed to delete" }); } });
app.get("/api/admins", auth, async (req, res) => { res.json(await prisma.admin.findMany({ select: { id: true, username: true, nickname: true, title: true, avatar: true, createdAt: true } })); });
app.post("/api/admins", auth, async (req, res) => {
  try {
    const admin = await prisma.admin.create({ data: { username: req.body.username, password: await bcrypt.hash(req.body.password, 10) } });
    res.json({ id: admin.id, username: admin.username });
  } catch { res.status(500).json({ error: "Failed to create" }); }
});
app.put("/api/admins/:id/password", auth, async (req, res) => {
  try {
    const { password, oldPassword } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: "密码长度至少6位" });
    const admin = await prisma.admin.findUnique({ where: { id: Number(req.params.id) } });
    if (!admin) return res.status(404).json({ error: "用户不存在" });
    // 校验旧密码，防止已登录会话被劫持后直接改密
    if (oldPassword && !(await bcrypt.compare(oldPassword, admin.password))) {
      return res.status(403).json({ error: "旧密码不正确" });
    }
    await prisma.admin.update({ where: { id: admin.id }, data: { password: await bcrypt.hash(password, 10) } });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to change" }); }
});
app.get("/api/admins/:id", auth, async (req, res) => { const a = await prisma.admin.findUnique({ where: { id: Number(req.params.id) }, select: { id: true, username: true, nickname: true, title: true, avatar: true, createdAt: true } }); if (!a) return res.status(404).json({ error: "Not found" }); res.json(a); });
app.put("/api/admins/:id", auth, async (req, res) => {
  try {
    const { nickname, title, avatar } = req.body;
    // 只返回安全字段，绝不回传 password 哈希
    const admin = await prisma.admin.update({
      where: { id: Number(req.params.id) },
      data: { nickname, title, avatar },
      select: { id: true, username: true, nickname: true, title: true, avatar: true, createdAt: true },
    });
    res.json(admin);
  } catch { res.status(500).json({ error: "Failed to update" }); }
});
app.get("/api/daily-tip", async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const saved = await prisma.dailyTip.findFirst({ where: { date: { gte: today, lt: tomorrow }, isActive: true }, orderBy: { createdAt: "desc" } });
    if (saved) return res.json({ content: saved.content, source: saved.source || "向阳健康", date: saved.date });
    const tip = await getDailyTip();
    const created = await prisma.dailyTip.create({ data: { content: tip.content, source: tip.source || "向阳健康", date: new Date() } });
    res.json({ content: created.content, source: created.source, date: created.date });
  } catch (e: any) { res.status(500).json({ error: "Daily tip error", detail: e.message }); }
});
app.post("/api/daily-tip", auth, async (req, res) => { try { res.json(await prisma.dailyTip.create({ data: { content: req.body.content, source: req.body.source || "向阳健康", date: new Date() } })); } catch { res.status(500).json({ error: "Failed to create" }); } });
app.get("/api/daily-tips", auth, async (req, res) => { res.json(await prisma.dailyTip.findMany({ orderBy: { date: "desc" } })); });
app.put("/api/daily-tips/:id", auth, async (req, res) => { try { const d = req.body; res.json(await prisma.dailyTip.update({ where: { id: Number(req.params.id) }, data: { ...(d.content !== undefined && { content: d.content }), ...(d.source !== undefined && { source: d.source }), ...(d.isActive !== undefined && { isActive: Boolean(d.isActive) }) } })); } catch { res.status(500).json({ error: "Failed to update" }); } });
app.delete("/api/daily-tips/:id", auth, async (req, res) => { try { await prisma.dailyTip.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); } catch { res.status(500).json({ error: "Failed to delete" }); } });

// OSS 文件列表
app.get("/api/media", auth, async (req, res) => {
  try {
    const prefix = (req.query.prefix as string) || "";
    const marker = (req.query.marker as string) || "";
    const maxKeys = Math.min(Number(req.query.maxKeys) || 50, 200);
    const result = await getOSS().list({ prefix, marker, "max-keys": maxKeys }, {});
    res.json({
      objects: (result.objects || []).map((o: any) => ({
        key: o.name,
        url: `${OSS_DOMAIN}/${o.name}`,
        size: o.size,
        lastModified: o.lastModified,
        type: o.name.match(/\.(\w+)$/)?.[1]?.toLowerCase() || "",
      })),
      prefixes: result.prefixes || [],
      nextMarker: result.nextMarker || null,
      isTruncated: result.isTruncated,
    });
  } catch (e: any) { res.status(500).json({ error: "Failed to list media", detail: e.message }); }
});

// 删除 OSS 文件（支持单个或批量）——先检查引用，被文章/专家/产品引用的文件不删除
app.post("/api/media/delete", auth, async (req, res) => {
  try {
    const keys = req.body.keys;
    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ error: "keys 必须是非空数组" });
    }
    if (keys.length > 100) {
      return res.status(400).json({ error: "一次最多删除 100 个文件" });
    }

    // 收集所有可能引用图片的字段
    const [news, experts, products] = await Promise.all([
      prisma.news.findMany({ select: { id: true, title: true, cover: true, content: true } }),
      prisma.expert.findMany({ select: { id: true, name: true, avatar: true, introduction: true } }),
      prisma.product.findMany({ select: { id: true, name: true, image: true } }),
    ]);

    const blocked: { key: string; refs: string[] }[] = [];
    const deletable: string[] = [];

    for (const key of keys) {
      const publicUrl = `${OSS_DOMAIN}/${key}`;
      const refs: string[] = [];
      for (const n of news) {
        if (n.cover === publicUrl || (n.content && n.content.includes(publicUrl))) {
          refs.push(`文章「${n.title || n.id}」`);
        }
      }
      for (const e of experts) {
        if (e.avatar === publicUrl || (e.introduction && e.introduction.includes(publicUrl))) {
          refs.push(`专家「${e.name || e.id}」`);
        }
      }
      for (const p of products) {
        if (p.image === publicUrl) {
          refs.push(`产品「${p.name || p.id}」`);
        }
      }
      if (refs.length > 0) {
        blocked.push({ key, refs });
      } else {
        deletable.push(key);
      }
    }

    let deleted = 0;
    if (deletable.length > 0) {
      await getOSS().deleteMulti(deletable);
      deleted = deletable.length;
    }
    res.json({ success: true, deleted, blocked });
  } catch (e: any) { res.status(500).json({ error: "Failed to delete media", detail: e.message }); }
});

export default app;