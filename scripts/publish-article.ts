/**
 * 发布文章脚本
 *
 * 用法：
 *   # 方式一：直接传 HTML 内容
 *   DATABASE_URL="..." OSS_ACCESS_KEY_ID="..." OSS_ACCESS_KEY_SECRET="..." \
 *   pnpm exec tsx scripts/publish-article.ts \
 *     --title "文章标题" \
 *     --category 1 \
 *     --content "<p>HTML内容</p>" \
 *     --cover /path/to/cover.jpg \
 *     --pdf /path/to/file.pdf
 *
 *   # 方式二：从 Markdown 文件读取
 *   DATABASE_URL="..." OSS_ACCESS_KEY_ID="..." OSS_ACCESS_KEY_SECRET="..." \
 *   pnpm exec tsx scripts/publish-article.ts \
 *     --title "文章标题" \
 *     --category 1 \
 *     --md /path/to/content.md \
 *     --cover /path/to/cover.jpg
 *
 * 参数说明：
 *   --title        文章标题（必填）
 *   --author       作者（默认：向阳健康）
 *   --author-title 作者职称（可选）
 *   --category     分类ID（必填，1=健康科普, 2=健康前沿, 3=健康讲堂）
 *   --content      文章内容 HTML（与 --md 二选一）
 *   --md           Markdown 文件路径（与 --content 二选一，自动转换）
 *   --cover        封面图片路径（可选，自动上传OSS）
 *   --pdf          PDF文件路径（可选，自动上传并插入下载链接）
 *
 * Markdown 支持格式：
 *   ## 标题     → <h2>标题</h2>
 *   空行分隔    → 段落
 *   **加粗**    → <strong>加粗</strong>
 *   - 列表项    → <ul><li>列表项</li></ul>
 */

import OSS from "ali-oss";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const OSS_DOMAIN = process.env.OSS_DOMAIN || "https://xyjk-data.oss-cn-hangzhou.aliyuncs.com";

const ossClient = new OSS({
  region: "oss-cn-hangzhou",
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || "",
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || "",
  bucket: process.env.OSS_BUCKET || "xyjk-data",
  secure: true,
});

const prisma = new PrismaClient();

async function uploadFile(filePath: string, type: string): Promise<string> {
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const key = `${type}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const mime: Record<string, string> = {
    ".pdf": "application/pdf", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif",
  };
  const headers: any = { "Content-Type": mime[ext] || "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable" };
  if (ext === ".pdf") headers["Content-Disposition"] = "inline";
  await ossClient.put(key, buf, { headers });
  return `${OSS_DOMAIN}/${key}`;
}

/** 简单 Markdown → HTML 转换 */
function mdToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inP = false, inUl = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inUl) { out.push("</ul>"); inUl = false; }
      if (inP) { out.push("</p>"); inP = false; }
      continue;
    }
    // 忽略纯"图片"行
    if (line === "图片" || line === "图片：") continue;

    // 二级标题
    if (line.startsWith("## ")) {
      if (inP) { out.push("</p>"); inP = false; }
      if (inUl) { out.push("</ul>"); inUl = false; }
      out.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }

    // 无序列表
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inUl) { out.push("<ul>"); inUl = true; }
      out.push(`<li>${escapeHtml(line.slice(2))}</li>`);
      continue;
    }

    // 普通段落
    if (inUl) { out.push("</ul>"); inUl = false; }
    if (!inP) { out.push("<p>"); inP = true; }
    else out.push("<br>");
    out.push(escapeHtml(line));
  }
  if (inUl) out.push("</ul>");
  if (inP) out.push("</p>");
  return out.join("\n");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function parseArgs() {
  const args: Record<string, string> = {};
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i += 2) {
    const key = raw[i].replace(/^--/, "");
    args[key] = raw[i + 1];
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const title = args.title;
  const author = args.author || "向阳健康";
  const authorTitle = args["author-title"] || "";
  const categoryId = Number(args.category);
  let content = args.content || "";

  // 从 Markdown 文件读取
  if (args.md) {
    if (!fs.existsSync(args.md)) { console.error("Markdown 文件不存在:", args.md); process.exit(1); }
    const md = fs.readFileSync(args.md, "utf-8");
    content = mdToHtml(md);
    // 如果没传 title，从 md 第一行提取
    if (!title) {
      const firstLine = md.split("\n")[0]?.trim();
      if (firstLine && !firstLine.startsWith("#")) {
        args.title = firstLine;
        console.log("自动提取标题:", firstLine);
      }
    }
  }

  if (!title || !categoryId || !content) {
    console.error("错误：--title, --category 为必填参数，--content 或 --md 必须提供其一");
    console.error("用法：pnpm exec tsx scripts/publish-article.ts --title \"标题\" --category 1 --content \"<p>...</p>\" [--cover ...] [--pdf ...]");
    console.error("  或：pnpm exec tsx scripts/publish-article.ts --title \"标题\" --category 1 --md /path/to/file.md [--cover ...]");
    process.exit(1);
  }

  // 上传PDF
  let pdfUrl = "";
  if (args.pdf) {
    console.log("上传PDF...");
    pdfUrl = await uploadFile(args.pdf, "news");
    content += `<p><a href="${pdfUrl}" target="_blank" class="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md">🔗 新窗口打开PDF</a>&nbsp;&nbsp;<a href="${pdfUrl}" download class="inline-block border-2 border-orange-600 text-orange-600 hover:bg-orange-50 font-semibold px-6 py-3 rounded-lg">📥 下载PDF文件</a></p>`;
    console.log("PDF 已上传:", pdfUrl);
  }

  // 上传封面
  let cover = "";
  if (args.cover && fs.existsSync(args.cover)) {
    console.log("上传封面...");
    cover = await uploadFile(args.cover, "news");
    console.log("封面已上传:", cover);
  }

  // 创建文章
  const news = await prisma.news.create({
    data: { title, author, authorTitle: authorTitle || "健康科普", cover, content, date: new Date(), categoryId },
  });
  console.log("\n✅ 文章发布成功！");
  console.log("  ID:", news.id);
  console.log("  标题:", news.title);
  console.log("  链接: https://xyjk.ren/article/" + news.id);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error("发布失败:", e.message);
  process.exit(1);
});