import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import OSS from "ali-oss";
import path from "path";
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
  const t: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp", ".mp4": "video/mp4" };
  return t[ext.toLowerCase()] || "application/octet-stream";
}

// ===== Daily Tip =====
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
      const r = await axios.get("http://api.tianapi.com/health/index", { params: { key: process.env.TIANAPI_KEY }, timeout: 5000 });
      if (r.data.code === 200 && r.data.result?.list?.length) return { content: r.data.result.list[0].brief || r.data.result.list[0].title, source: "天行数据" };
    } catch {}
  }
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return FALLBACK_TIPS[doy % FALLBACK_TIPS.length];
}

// ===== Express App =====
const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "xiangyang-secret-key";
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: (o, cb) => { if (!o) return cb(null, true); cb(null, true); }, credentials: true }));
app.use(express.json({ limit: "50mb" }));

// 缓存中间件：GET 请求缓存 60 秒（CDN），客户端缓存 10 秒
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api/auth")) {
    res.set("Cache-Control", "public, s-maxage=60, max-age=10");
  }
  next();
});

const auth = (req: any, res: any, next: any) => {
  try { req.user = jwt.verify(req.headers.authorization?.split(" ")[1] || "", JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "Unauthorized" }); }
};

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
  try { res.json({ url: await uploadToOSS(req.file.buffer, req.file.originalname, String(req.query.type || "default")) }); }
  catch { res.status(500).json({ error: "Upload failed" }); }
});
app.get("/api/categories", async (req, res) => { res.json(await prisma.category.findMany({ where: req.query.type ? { type: String(req.query.type) } : {}, orderBy: { createdAt: "desc" } })); });
app.post("/api/categories", auth, async (req, res) => { try { res.json(await prisma.category.create({ data: req.body })); } catch { res.status(500).json({ error: "Failed to create" }); } });
app.put("/api/categories/:id", auth, async (req, res) => { try { res.json(await prisma.category.update({ where: { id: Number(req.params.id) }, data: req.body })); } catch { res.status(500).json({ error: "Failed to update" }); } });
app.delete("/api/categories/:id", auth, async (req, res) => { try { await prisma.category.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); } catch { res.status(500).json({ error: "Failed to delete" }); } });
app.get("/api/news", async (req, res) => {
  const news = await prisma.news.findMany({
    select: { id: true, title: true, author: true, authorTitle: true, authorAvatar: true, cover: true, date: true, categoryId: true, category: true, createdAt: true },
    orderBy: { date: "desc" },
  });
  res.json(news);
});
app.get("/api/news/:id", async (req, res) => { const n = await prisma.news.findUnique({ where: { id: Number(req.params.id) }, include: { category: true } }); if (!n) return res.status(404).json({ error: "Not found" }); res.json(n); });
app.post("/api/news", auth, async (req, res) => { try { const { title, author, authorTitle, authorAvatar, cover, content, date, categoryId } = req.body; res.json(await prisma.news.create({ data: { title, author, authorTitle, authorAvatar, cover, content, date: date ? new Date(date) : undefined, categoryId } })); } catch { res.status(500).json({ error: "Failed to create" }); } });
app.put("/api/news/:id", auth, async (req, res) => { try { const d = req.body; res.json(await prisma.news.update({ where: { id: Number(req.params.id) }, data: { ...(d.title !== undefined && { title: d.title }), ...(d.author !== undefined && { author: d.author }), ...(d.authorTitle !== undefined && { authorTitle: d.authorTitle }), ...(d.authorAvatar !== undefined && { authorAvatar: d.authorAvatar }), ...(d.cover !== undefined && { cover: d.cover }), ...(d.content !== undefined && { content: d.content }), ...(d.date !== undefined && { date: new Date(d.date) }), ...(d.categoryId !== undefined && { categoryId: d.categoryId }) } })); } catch { res.status(500).json({ error: "Failed to update" }); } });
app.delete("/api/news/:id", auth, async (req, res) => { try { await prisma.news.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); } catch { res.status(500).json({ error: "Failed to delete" }); } });
app.get("/api/experts", async (req, res) => { res.json(await prisma.expert.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } })); });
app.get("/api/experts/:id", async (req, res) => { try { const e = await prisma.expert.findUnique({ where: { id: Number(req.params.id) }, include: { category: true } }); if (!e) return res.status(404).json({ error: "Expert not found" }); res.json(e); } catch { res.status(500).json({ error: "Failed to fetch" }); } });
app.post("/api/experts", auth, async (req, res) => { try { const { name, title, avatar, unit, achievements, introduction, categoryId } = req.body; res.json(await prisma.expert.create({ data: { name, title, avatar, unit, achievements, introduction, categoryId } })); } catch { res.status(500).json({ error: "Failed to create" }); } });
app.put("/api/experts/:id", auth, async (req, res) => { try { const d = req.body; res.json(await prisma.expert.update({ where: { id: Number(req.params.id) }, data: { ...(d.name !== undefined && { name: d.name }), ...(d.title !== undefined && { title: d.title }), ...(d.avatar !== undefined && { avatar: d.avatar }), ...(d.unit !== undefined && { unit: d.unit }), ...(d.achievements !== undefined && { achievements: d.achievements }), ...(d.introduction !== undefined && { introduction: d.introduction }), ...(d.categoryId !== undefined && { categoryId: d.categoryId }) } })); } catch { res.status(500).json({ error: "Failed to update" }); } });
app.delete("/api/experts/:id", auth, async (req, res) => { try { await prisma.expert.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); } catch { res.status(500).json({ error: "Failed to delete" }); } });
app.get("/api/products", async (req, res) => { res.json(await prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } })); });
app.get("/api/products/:id", async (req, res) => { try { const p = await prisma.product.findUnique({ where: { id: Number(req.params.id) }, include: { category: true } }); if (!p) return res.status(404).json({ error: "Product not found" }); res.json(p); } catch { res.status(500).json({ error: "Failed to fetch" }); } });
app.post("/api/products", auth, async (req, res) => { try { const { name, rating, image, introduction, url, price, categoryId } = req.body; res.json(await prisma.product.create({ data: { name, rating, image, introduction, url, price, categoryId } })); } catch { res.status(500).json({ error: "Failed to create" }); } });
app.put("/api/products/:id", auth, async (req, res) => { try { const d = req.body; res.json(await prisma.product.update({ where: { id: Number(req.params.id) }, data: { ...(d.name !== undefined && { name: d.name }), ...(d.rating !== undefined && { rating: d.rating }), ...(d.image !== undefined && { image: d.image }), ...(d.introduction !== undefined && { introduction: d.introduction }), ...(d.url !== undefined && { url: d.url }), ...(d.price !== undefined && { price: d.price }), ...(d.categoryId !== undefined && { categoryId: d.categoryId }) } })); } catch { res.status(500).json({ error: "Failed to update" }); } });
app.delete("/api/products/:id", auth, async (req, res) => { try { await prisma.product.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); } catch { res.status(500).json({ error: "Failed to delete" }); } });
app.get("/api/admins", auth, async (req, res) => { res.json(await prisma.admin.findMany({ select: { id: true, username: true, nickname: true, title: true, avatar: true, createdAt: true } })); });
app.post("/api/admins", auth, async (req, res) => { try { res.json(await prisma.admin.create({ data: { username: req.body.username, password: await bcrypt.hash(req.body.password, 10) } })); } catch { res.status(500).json({ error: "Failed to create" }); } });
app.put("/api/admins/:id/password", auth, async (req, res) => { try { await prisma.admin.update({ where: { id: Number(req.params.id) }, data: { password: await bcrypt.hash(req.body.password, 10) } }); res.json({ success: true }); } catch { res.status(500).json({ error: "Failed to change" }); } });
app.get("/api/admins/:id", auth, async (req, res) => { const a = await prisma.admin.findUnique({ where: { id: Number(req.params.id) }, select: { id: true, username: true, nickname: true, title: true, avatar: true, createdAt: true } }); if (!a) return res.status(404).json({ error: "Not found" }); res.json(a); });
app.put("/api/admins/:id", auth, async (req, res) => { try { const { nickname, title, avatar } = req.body; res.json(await prisma.admin.update({ where: { id: Number(req.params.id) }, data: { nickname, title, avatar } })); } catch { res.status(500).json({ error: "Failed to update" }); } });
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
app.delete("/api/daily-tips/:id", auth, async (req, res) => { try { await prisma.dailyTip.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); } catch { res.status(500).json({ error: "Failed to delete" }); } });

// == 临时发布端点 ==
app.get("/api/publish-article", auth, async (req, res) => {
  try {
    const existing = await prisma.news.findFirst({ where: { title: "聚力大健康，共探新赛道" } });
    if (existing) return res.json({ success: true, id: existing.id, message: "文章已存在" });

    const cats = await prisma.category.findMany({ where: { type: "news" } });

    const content = `<p>5月24日，一场主题为"健康领航 校友同心，共绘浙工大美好生活新图景"为主题的浙工大大健康校友首次交流沙龙在浙江省知联会顺利举行。来自不同专业、不同区域、不同年级的浙工大校友齐聚一堂，围绕中医药创新、精准健康管理、产业落地等核心议题展开深度交流。本次"大健康领域校友经验分享交流会"聚焦大健康产业前沿的思想，不仅搭建了跨界的对话平台，更为后续校友资源的协同与整合拉开了序幕。</p>
<p>活动伊始，浙工大生态工业创新研究院院长孙培龙校友首先介绍了大健康校友分会的规划蓝图与愿景。他强调，组织的成立旨在从"大健康"视角出发，一方面为全体校友的身心健康提供专业服务，另一方面也为从事大健康行业的校友企业提供更广阔的交流与展示平台。</p>
<p>原浙工大杭州校友会秘书长刘国平与丁志宏在致辞中高度肯定了这一举措。他们表示，健康是美好生活的基石，组建大健康分会不仅是响应国家号召，更是连接校友、服务社会的必要桥梁。</p>
<p>交流会上，思想火花不断迸发，呈现出三大鲜明亮点：</p>
<h2>理念升级：从"被动治疗"到"主动健康"</h2>
<p>有校友在会上率先提出"主动健康"理念，引发了在场嘉宾的强烈共鸣。这一理念倡导将健康管理的关口前移，标志着校友们在健康管理认知上实现了重要突破。</p>
<h2>模式创新：揭秘"无药式"中医调理</h2>
<p>针对特色中医项目的分享成为全场焦点。依托资深专家25年临床经验打造的"137治愈体系"，提出了以激发人体自愈力为核心的新模式。该体系从物质、能量、信息三个维度发力，融合中医理疗、音疗、营养干预等七大技术，致力于打造无药式中医调理的新路径。</p>
<h2>科技赋能：前沿技术聚焦"精准干预"</h2>
<p>在技术层面，多位校友展示了大健康领域的科创实力。从食品营养、医药法务到生物检测，分享内容涵盖了慢病干预、抗衰科研等热门方向。特别是关于端粒长度与生物年龄监测、健康检测设备研发以及慢病与减重产品的开发，展现了校友企业在精准健康领域的深厚积淀。</p>
<p>与会校友达成共识，一致认为，在国家大力扶持中医药传承创新、全民健康意识觉醒的背景下，中医调理、主动健康及精准健康管理将迎来高质量发展机遇。后续，大健康校友分会将充分发挥平台优势，链接母校丰富的科研资源，整合行业资源，搭建起"产学研用"的高效对接桥梁。通过助力校友企业协同发展，以专业力量守护大众身心健康，共同推动大健康产业稳步前行，在"健康中国"的宏伟目标中，发出浙工大的声音。</p>
<p>此次交流会也是浙工大"美好生活"板块中"健"板块的重要探索，充分表达了校友们对构建美好生活的热切愿望与责任担当。</p>`;

    const news = await prisma.news.create({
      data: { title: "聚力大健康，共探新赛道", author: "向阳健康", authorTitle: "健康科普", content, date: new Date("2026-05-24"), categoryId: cats[0]?.id || 1 }
    });
    res.json({ success: true, id: news.id, url: "https://xyjk.ren/article/" + news.id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default app;