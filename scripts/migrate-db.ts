/**
 * 数据迁移脚本：SQLite → PostgreSQL
 *
 * 用法：
 *   DATABASE_URL="postgresql://..." npx tsx scripts/migrate-db.ts
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import * as fs from "fs";
import 'dotenv/config';

const PG_URL = process.env.DATABASE_URL;
if (!PG_URL) {
  console.error("请设置 DATABASE_URL 环境变量为 Neon PostgreSQL 连接字符串");
  process.exit(1);
}

const DB_PATH = "prisma/backup.db";
if (!fs.existsSync(DB_PATH)) {
  console.error("备份文件不存在:", DB_PATH);
  process.exit(1);
}

function queryJSON(table: string, columns: string): any[] {
  const sql = `SELECT json_group_array(json_object(${columns})) FROM ${table};`;
  const out = execSync(`sqlite3 "${DB_PATH}" "${sql}"`, { encoding: 'utf-8' }).trim();
  const parsed = JSON.parse(out);
  return parsed.filter((r: any) => r !== null);
}

// 各表的列定义
const ADMIN_COLS = "'id', id, 'username', username, 'password', password, 'nickname', nickname, 'title', title, 'avatar', avatar, 'createdAt', createdAt, 'updatedAt', updatedAt";
const CATEGORY_COLS = "'id', id, 'name', name, 'type', type, 'createdAt', createdAt, 'updatedAt', updatedAt";
const NEWS_COLS = "'id', id, 'title', title, 'author', author, 'authorTitle', authorTitle, 'authorAvatar', authorAvatar, 'cover', cover, 'content', content, 'date', date, 'categoryId', categoryId, 'createdAt', createdAt, 'updatedAt', updatedAt";
const EXPERT_COLS = "'id', id, 'name', name, 'title', title, 'avatar', avatar, 'unit', unit, 'achievements', achievements, 'score', score, 'introduction', introduction, 'categoryId', categoryId, 'createdAt', createdAt, 'updatedAt', updatedAt";
const PRODUCT_COLS = "'id', id, 'name', name, 'rating', rating, 'image', image, 'introduction', introduction, 'url', url, 'price', price, 'categoryId', categoryId, 'createdAt', createdAt, 'updatedAt', updatedAt";
const DAILYTIP_COLS = "'id', id, 'content', content, 'source', source, 'date', date, 'isActive', isActive, 'createdAt', createdAt, 'updatedAt', updatedAt";

async function migrate() {
  console.log("=== 数据迁移: SQLite → PostgreSQL ===\n");

  // 读取数据
  const admins = queryJSON("Admin", ADMIN_COLS);
  const categories = queryJSON("Category", CATEGORY_COLS);
  const news = queryJSON("News", NEWS_COLS);
  const experts = queryJSON("Expert", EXPERT_COLS);
  const products = queryJSON("Product", PRODUCT_COLS);
  const dailyTips = queryJSON("DailyTip", DAILYTIP_COLS);

  console.log(`SQLite 数据量:`);
  console.log(`  Admin: ${admins.length}`);
  console.log(`  Category: ${categories.length}`);
  console.log(`  News: ${news.length}`);
  console.log(`  Expert: ${experts.length}`);
  console.log(`  Product: ${products.length}`);
  console.log(`  DailyTip: ${dailyTips.length}`);

  // 连接 PostgreSQL
  const pg = new PrismaClient({ datasources: { db: { url: PG_URL } } });

  try {
    // 迁移 Admin
    console.log("\n--- 迁移 Admin ---");
    for (const a of admins) {
      await pg.admin.upsert({
        where: { id: a.id },
        update: { username: a.username, password: a.password, nickname: a.nickname, title: a.title, avatar: a.avatar },
        create: { id: a.id, username: a.username, password: a.password, nickname: a.nickname, title: a.title, avatar: a.avatar },
      });
      console.log(`  ✓ admin: ${a.username}`);
    }

    // 迁移 Category
    console.log("\n--- 迁移 Category ---");
    for (const c of categories) {
      await pg.category.upsert({
        where: { id: c.id },
        update: { name: c.name, type: c.type },
        create: { id: c.id, name: c.name, type: c.type },
      });
      console.log(`  ✓ category: ${c.name} (${c.type})`);
    }

    // 迁移 News
    console.log("\n--- 迁移 News ---");
    for (const n of news) {
      await pg.news.upsert({
        where: { id: n.id },
        update: { title: n.title, author: n.author, authorTitle: n.authorTitle, authorAvatar: n.authorAvatar, cover: n.cover, content: n.content, date: new Date(n.date), categoryId: n.categoryId },
        create: { id: n.id, title: n.title, author: n.author, authorTitle: n.authorTitle, authorAvatar: n.authorAvatar, cover: n.cover, content: n.content, date: new Date(n.date), categoryId: n.categoryId },
      });
      console.log(`  ✓ news: ${n.title.substring(0, 30)}`);
    }

    // 迁移 Expert
    console.log("\n--- 迁移 Expert ---");
    for (const e of experts) {
      await pg.expert.upsert({
        where: { id: e.id },
        update: { name: e.name, title: e.title, avatar: e.avatar, unit: e.unit, achievements: e.achievements, score: e.score, introduction: e.introduction, categoryId: e.categoryId },
        create: { id: e.id, name: e.name, title: e.title, avatar: e.avatar, unit: e.unit, achievements: e.achievements, score: e.score, introduction: e.introduction, categoryId: e.categoryId },
      });
      console.log(`  ✓ expert: ${e.name}`);
    }

    // 迁移 Product
    console.log("\n--- 迁移 Product ---");
    for (const p of products) {
      await pg.product.upsert({
        where: { id: p.id },
        update: { name: p.name, rating: p.rating, image: p.image, introduction: p.introduction, url: p.url, price: p.price, categoryId: p.categoryId },
        create: { id: p.id, name: p.name, rating: p.rating, image: p.image, introduction: p.introduction, url: p.url, price: p.price, categoryId: p.categoryId },
      });
      console.log(`  ✓ product: ${p.name}`);
    }

    // 迁移 DailyTip
    console.log("\n--- 迁移 DailyTip ---");
    for (const d of dailyTips) {
      await pg.dailyTip.upsert({
        where: { id: d.id },
        update: { content: d.content, source: d.source, date: new Date(d.date), isActive: Boolean(d.isActive) },
        create: { id: d.id, content: d.content, source: d.source, date: new Date(d.date), isActive: Boolean(d.isActive) },
      });
      console.log(`  ✓ dailyTip: ${d.content.substring(0, 30)}`);
    }

    console.log("\n=== 迁移完成! ===");
  } catch (error) {
    console.error("迁移失败:", error);
    process.exit(1);
  } finally {
    await pg.$disconnect();
  }
}

migrate();