import axios from "axios";

/**
 * 每日健康科普知识抓取模块
 * 
 * 支持的数据源：
 * 1. 天行数据 - 健康科普 API
 * 2. 百度健康 API
 * 3. 手动录入的科普知识库
 */

// 天行数据 API 配置（需要注册获取 key）
// 注册地址：https://www.tianapi.com/
const TIANAPI_KEY = process.env.TIANAPI_KEY || "";
const TIANAPI_HEALTH_URL = "http://api.tianapi.com/health/index";

// 备用科普知识库（当 API 不可用时使用）
const FALLBACK_TIPS = [
  {
    content: "每天坚持运动 30 分钟，可以有效降低心血管疾病风险，增强免疫力。",
    source: "中国健康教育中心"
  },
  {
    content: "成年人每天应摄入 300-500 克蔬菜，深色蔬菜应占一半以上。",
    source: "中国居民膳食指南"
  },
  {
    content: "保持 7-8 小时的优质睡眠，有助于身体修复和记忆巩固。",
    source: "国家卫健委"
  },
  {
    content: "每天饮水 1500-1700 毫升，少量多次，不要等到口渴了再喝水。",
    source: "中国营养学会"
  },
  {
    content: "控制盐摄入量，每日不超过 5 克，有助于预防高血压。",
    source: "世界卫生组织"
  },
  {
    content: "定期体检是预防疾病的重要手段，建议每年进行一次全面体检。",
    source: "中国健康教育中心"
  },
  {
    content: "保持乐观心态，学会减压，对身心健康都有益处。",
    source: "国家卫健委"
  },
  {
    content: "戒烟限酒，远离二手烟，是保护自己和家人健康的重要措施。",
    source: "中国疾控中心"
  },
  {
    content: "饭前便后要洗手，养成良好的卫生习惯，预防疾病传播。",
    source: "中国疾控中心"
  },
  {
    content: "多吃全谷物、坚果和豆类，减少精制食品摄入，有助于控制血糖。",
    source: "中国营养学会"
  },
  {
    content: "久坐伤身，建议每工作 1 小时起身活动 5-10 分钟。",
    source: "世界卫生组织"
  },
  {
    content: "晒太阳可以促进维生素 D 合成，每天 15-30 分钟日照有益健康。",
    source: "中国健康教育中心"
  },
  {
    content: "控制体重在正常范围（BMI 18.5-23.9），可以降低多种慢性病风险。",
    source: "中国疾控中心"
  },
  {
    content: "多吃富含 Omega-3 的食物，如深海鱼类，有助于心脑血管健康。",
    source: "中国营养学会"
  },
  {
    content: "保持社交活动，与家人朋友多交流，有助于心理健康。",
    source: "国家卫健委"
  }
];

/**
 * 从天行数据 API 获取健康科普知识
 */
async function fetchFromTianAPI(): Promise<{ content: string; source?: string } | null> {
  if (!TIANAPI_KEY) {
    console.log("未配置天行数据 API Key");
    return null;
  }

  try {
    const response = await axios.get(TIANAPI_HEALTH_URL, {
      params: { key: TIANAPI_KEY },
      timeout: 5000
    });

    if (response.data.code === 200 && response.data.result && response.data.result.list.length > 0) {
      const item = response.data.result.list[0];
      return {
        content: item.brief || item.title,
        source: item.source || "天行数据"
      };
    }
    return null;
  } catch (error) {
    console.error("天行数据 API 请求失败:", error);
    return null;
  }
}

/**
 * 获取每日科普知识（优先 API，失败则使用备用库）
 */
export async function getDailyTip(): Promise<{ content: string; source?: string }> {
  // 尝试从 API 获取
  const apiTip = await fetchFromTianAPI();
  if (apiTip) {
    return apiTip;
  }

  // 使用备用库 - 根据日期选择一个固定的科普知识
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const index = dayOfYear % FALLBACK_TIPS.length;
  
  return FALLBACK_TIPS[index];
}

/**
 * 获取备用科普知识库（用于管理界面）
 */
export function getFallbackTips() {
  return FALLBACK_TIPS;
}
