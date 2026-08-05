/**
 * 通过 API 将专家数据从 SQLite 备份恢复到生产数据库
 * 用法: npx tsx scripts/seed-experts-via-api.ts
 */
import { execSync } from "child_process";

const API_BASE = process.env.XIANGYANG_API_BASE || "https://xyjk.ren/api";

// 凭证从环境变量读取，禁止硬编码（安全要求）
const USERNAME = process.env.XIANGYANG_ADMIN_USERNAME || "";
const PASSWORD = process.env.XIANGYANG_ADMIN_PASSWORD || "";
if (!USERNAME || !PASSWORD) {
  console.error("请设置环境变量 XIANGYANG_ADMIN_USERNAME / XIANGYANG_ADMIN_PASSWORD 后再运行");
  process.exit(1);
}

function queryJSON(table: string, columns: string): any[] {
  const sql = `SELECT json_group_array(json_object(${columns})) FROM ${table};`;
  const out = execSync(`sqlite3 "prisma/backup.db" "${sql}"`, { encoding: 'utf-8' }).trim();
  const parsed = JSON.parse(out);
  return parsed.filter((r: any) => r !== null);
}

const EXPERT_COLS = "'id', id, 'name', name, 'title', title, 'avatar', avatar, 'unit', unit, 'achievements', achievements, 'introduction', introduction, 'categoryId', categoryId";

async function main() {
  // 1. Login
  console.log("登录中...");
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  if (!loginRes.ok) {
    console.error("登录失败:", await loginRes.text());
    process.exit(1);
  }
  const { token } = await loginRes.json();
  console.log("登录成功");

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };

  // 2. Check existing experts
  const existingRes = await fetch(`${API_BASE}/experts`, { headers: { Authorization: `Bearer ${token}` } });
  const existingExperts: any[] = await existingRes.json();
  console.log(`数据库中现有 ${existingExperts.length} 个专家`);

  // 3. Check categories
  const catRes = await fetch(`${API_BASE}/categories?type=expert`);
  const categories: any[] = await catRes.json();
  console.log(`分类: ${categories.map(c => `${c.id}=${c.name}`).join(", ")}`);

  // 4. Seed experts from backup
  const experts = queryJSON("Expert", EXPERT_COLS);
  console.log(`SQLite 备份中有 ${experts.length} 个专家`);

  let created = 0;
  for (const e of experts) {
    const exists = existingExperts.find((x: any) => x.id === e.id);
    if (exists) {
      console.log(`  ID=${e.id} ${e.name} 已存在，跳过`);
      continue;
    }
    // Check category exists
    const cat = categories.find((c: any) => c.id === e.categoryId);
    if (!cat) {
      console.log(`  ID=${e.id} ${e.name} 的分类(categoryId=${e.categoryId})不存在，跳过`);
      continue;
    }
    const res = await fetch(`${API_BASE}/experts`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: e.name,
        title: e.title || "",
        avatar: e.avatar || "",
        unit: e.unit || "",
        achievements: e.achievements || "",
        introduction: e.introduction || "",
        categoryId: e.categoryId,
      }),
    });
    if (res.ok) {
      console.log(`  ✓ ID=${e.id} ${e.name} 创建成功`);
      created++;
    } else {
      console.log(`  ✗ ID=${e.id} ${e.name} 创建失败:`, await res.text());
    }
  }
  console.log(`\n完成！新增 ${created} 个专家`);
}

main().catch(console.error);