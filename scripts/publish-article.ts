/**
 * 发布文章脚本
 *
 * 用法：
 *   DATABASE_URL="postgresql://..." pnpm exec tsx scripts/publish-article.ts \
 *     --title "文章标题" \
 *     --author "作者名" \
 *     --category 1 \
 *     --content "<p>HTML内容</p>" \
 *     --cover /path/to/cover.jpg \
 *     --pdf /path/to/file.pdf
 *
 * 参数说明：
 *   --title     文章标题（必填）
 *   --author    作者（默认：向阳健康）
 *   --category  分类ID（必填，1=健康科普, 2=健康前沿, 3=健康讲堂）
 *   --content   文章内容（HTML格式，必填）
 *   --cover     封面图片路径（可选）
 *   --pdf       PDF文件路径（可选，自动上传到OSS并插入内容）
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
  const ext = path.extname(filePath);
  const key = `${type}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const contentType = ext === ".pdf" ? "application/pdf" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : ext === ".png" ? "image/png" : "application/octet-stream";
  const headers: any = { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" };
  if (ext === ".pdf") headers["Content-Disposition"] = "inline";
  await ossClient.put(key, buf, { headers });
  return `${OSS_DOMAIN}/${key}`;
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
  const categoryId = Number(args.category);
  let content = args.content || "";

  if (!title || !categoryId || !content) {
    console.error("错误：--title, --category, --content 为必填参数");
    console.error("用法：pnpm exec tsx scripts/publish-article.ts --title \"标题\" --category 1 --content \"<p>内容</p>\" [--cover /path/to/cover.jpg] [--pdf /path/to/file.pdf]");
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
    data: { title, author, authorTitle: "健康科普", cover, content, date: new Date(), categoryId },
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