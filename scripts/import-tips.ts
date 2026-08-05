/**
 * 从养生法则100条.md 导入健康贴士到生产数据库
 * 用法: npx tsx scripts/import-tips.ts
 */
import * as fs from "fs";

const API_BASE = process.env.XIANGYANG_API_BASE || "https://xyjk.ren/api";
// 凭证从环境变量读取，禁止硬编码（安全要求）
const USERNAME = process.env.XIANGYANG_ADMIN_USERNAME || "";
const PASSWORD = process.env.XIANGYANG_ADMIN_PASSWORD || "";
if (!USERNAME || !PASSWORD) {
  console.error("请设置环境变量 XIANGYANG_ADMIN_USERNAME / XIANGYANG_ADMIN_PASSWORD 后再运行");
  process.exit(1);
}

async function main() {
  // 1. 读取 markdown
  const md = fs.readFileSync(".资料库/养生法则100条.md", "utf-8");
  const lines = md.split("\n");

  // 2. 提取 1-100 条内容（跳过标题、引言等）
  const tips: { content: string; source: string }[] = [];
  let current: string[] = [];
  let currentNum = 0;

  const flush = () => {
    if (currentNum > 0 && current.length > 0) {
      let text = current.join(" ").trim();
      // 去掉 markdown 加粗标记
      text = text.replace(/\*\*/g, "").trim();
      // 去掉行首的编号如 "1. " 或 "31. "
      text = text.replace(/^\d+\.\s*/, "");
      tips.push({ content: text, source: "养生法则100条" });
    }
    current = [];
  };

  for (const line of lines) {
    const match = line.match(/^(\d+)\.\s/);
    if (match) {
      flush();
      currentNum = parseInt(match[1]);
      current.push(line);
    } else if (currentNum > 0 && line.trim() && !line.startsWith("---")) {
      // 属于当前条目的续行（如 31、41、50、52、77 的多行内容）
      current.push(line);
    }
  }
  flush();

  console.log(`解析出 ${tips.length} 条贴士`);
  if (tips.length !== 100) {
    console.log("警告: 解析数量不是100条，请检查!");
    for (let i = 1; i <= 100; i++) {
      if (!tips.some((_, idx) => idx === i - 1)) {
        console.log(`  缺失 #${i}`);
      }
    }
  }

  // 3. 登录
  console.log("\n登录中...");
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

  // 4. 检查已有贴士（去重）
  const existingRes = await fetch(`${API_BASE}/daily-tips`, { headers: { Authorization: `Bearer ${token}` } });
  const existing: any[] = await existingRes.json();
  console.log(`数据库中已有 ${existing.length} 条贴士`);

  const existingContent = new Set(existing.map((t: any) => t.content.trim().slice(0, 20)));

  // 5. 逐条导入
  let created = 0, skipped = 0;
  for (let i = 0; i < tips.length; i++) {
    const tip = tips[i];
    const key = tip.content.slice(0, 20);
    if (existingContent.has(key)) {
      console.log(`  #${i + 1} 已存在，跳过`);
      skipped++;
      continue;
    }
    const res = await fetch(`${API_BASE}/daily-tip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ content: tip.content, source: tip.source }),
    });
    if (res.ok) {
      created++;
      if (created % 10 === 0 || created === tips.length) console.log(`  已导入 ${created} 条...`);
    } else {
      console.log(`  #${i + 1} 导入失败:`, await res.text());
    }
  }

  console.log(`\n完成！新增 ${created} 条，跳过 ${skipped} 条`);
}

main().catch(console.error);