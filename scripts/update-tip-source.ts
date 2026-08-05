/**
 * 将所有健康贴士的来源改为 韩勇航
 * 用法: npx tsx scripts/update-tip-source.ts
 */
const API_BASE = process.env.XIANGYANG_API_BASE || "https://xyjk.ren/api";
// 凭证从环境变量读取，禁止硬编码（安全要求）
const USERNAME = process.env.XIANGYANG_ADMIN_USERNAME || "";
const PASSWORD = process.env.XIANGYANG_ADMIN_PASSWORD || "";
if (!USERNAME || !PASSWORD) {
  console.error("请设置环境变量 XIANGYANG_ADMIN_USERNAME / XIANGYANG_ADMIN_PASSWORD 后再运行");
  process.exit(1);
}

async function main() {
  // 登录
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
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
  console.log("登录成功");

  // 获取所有贴士
  const tipsRes = await fetch(`${API_BASE}/daily-tips`, { headers });
  const tips: any[] = await tipsRes.json();
  console.log(`共 ${tips.length} 条贴士`);

  // 逐条更新 source
  let updated = 0;
  for (const t of tips) {
    if (t.source === "韩勇航") {
      console.log(`  #${t.id} 已是韩勇航，跳过`);
      continue;
    }
    const res = await fetch(`${API_BASE}/daily-tips/${t.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ source: "韩勇航" }),
    });
    if (res.ok) {
      updated++;
    } else {
      console.log(`  #${t.id} 更新失败:`, await res.text());
    }
  }
  console.log(`\n完成！更新 ${updated} 条为韩勇航`);
}

main().catch(console.error);