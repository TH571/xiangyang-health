/**
 * Mock Data for Xiangyang Health Platform
 * 这些数据用于前端开发和演示，后续可通过 API 替换
 */

export interface User {
  id: string;
  name: string;
  quote: string;
  avatar: string;
}

export interface Article {
  id: string;
  title: string;
  category: 'frontiers' | 'lectures' | 'science';
  author: string;
  excerpt: string;
  content: string;
  image: string;
  publishDate: string;
  authorAvatar?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

// Mock Users Data
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Olivia Walker',
    quote: '健康是最好的投资',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop'
  },
  {
    id: '2',
    name: 'Dan Mitchell',
    quote: '坚持运动，享受生活',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
  },
  {
    id: '3',
    name: 'Tess Andersen',
    quote: '营养均衡，活力无限',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop'
  },
  {
    id: '4',
    name: 'Noah Patterson',
    quote: '心态决定健康',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop'
  }
];

// Mock Articles Data
export const mockArticles: Article[] = [
  {
    id: '1',
    title: '掌握健康：专家评估产品的指南',
    category: 'frontiers',
    author: 'Zebra Zhang',
    excerpt: '在当今这个信息爆炸的时代，健康产品的选择变得越来越复杂。市场上充斥着各种各样的产品，从营养补充剂到健身器材，每一种都声称能改善我们的健康。',
    content: `在当今这个信息爆炸的时代，健康产品的选择变得越来越复杂。市场上充斥着各种各样的产品，从营养补充剂到健身器材，每一种都声称能改善我们的健康。然而，如何在这些产品中做出明智的选择呢？本文将为您提供一份专家评估产品的指南，帮助您掌握健康，做出更好的选择。

## 了解健康产品的基本类型

在深入评估健康产品之前，首先需要了解市场上常见的健康产品类型。以下是一些主要类别：

### 营养补充剂
营养补充剂是为了补充饮食中缺乏的营养成分而设计的产品。它们通常包括：
- 维生素和矿物质：如维生素C、维生素D、钙和铁等
- 草本补充剂：如人参、姜黄和大蒜等
- 蛋白质粉：用于增加蛋白质摄入，适合健身爱好者

### 健身器材
健身器材包括各种设备和工具，帮助用户进行锻炼和保持身体健康。常见的健身器材有：
- 哑铃和杠铃：用于力量训练
- 健身球：用于核心训练和稳定性训练
- 有氧运动器械：如跑步机和椭圆机

### 个人护理产品
个人护理产品包括护肤品、洗发水和其他日常护理用品，这些产品对皮肤和头发健康至关重要。`,
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop',
    publishDate: '2024-01-15'
  },
  {
    id: '2',
    title: '运动与心理健康的关系',
    category: 'frontiers',
    author: 'Zebra Zhang',
    excerpt: '科研表明，定期运动不仅能改善身体健康，还能显著提升心理健康水平。本文探讨了运动如何影响我们的情绪和心理状态。',
    content: '科研表明，定期运动不仅能改善身体健康，还能显著提升心理健康水平。运动释放内啡肽，这种天然的"快乐激素"能够缓解压力、焦虑和抑郁症状。',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
    publishDate: '2024-01-14'
  },
  {
    id: '3',
    title: '睡眠质量对健康的重要性',
    category: 'lectures',
    author: 'Zebra Zhang',
    excerpt: '充足的睡眠是维持健康的基础。本讲座将介绍如何改善睡眠质量，建立良好的睡眠习惯。',
    content: '充足的睡眠是维持健康的基础。睡眠不足会导致免疫系统功能下降，增加患病风险。建立规律的睡眠时间表，避免在睡前使用电子设备，可以显著改善睡眠质量。',
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=400&fit=crop',
    publishDate: '2024-01-13'
  },
  {
    id: '4',
    title: '水的重要性：每天喝多少水才够',
    category: 'science',
    author: 'Zebra Zhang',
    excerpt: '水是生命之源。了解正确的饮水量对维持身体健康至关重要。',
    content: '水是生命之源。一般建议成年人每天饮用8杯水（约2升），但实际需求因人而异，取决于活动水平、气候和个人代谢。',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop',
    publishDate: '2024-01-12'
  },
  {
    id: '5',
    title: '营养均衡饮食指南',
    category: 'science',
    author: 'Zebra Zhang',
    excerpt: '学习如何构建营养均衡的饮食，确保身体获得所需的所有营养元素。',
    content: '营养均衡的饮食应包含蛋白质、碳水化合物、脂肪、维生素和矿物质。建议每天摄入不同颜色的蔬菜和水果，以确保获得多种营养。',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop',
    publishDate: '2024-01-11'
  },
  {
    id: '6',
    title: '压力管理技巧',
    category: 'lectures',
    author: 'Zebra Zhang',
    excerpt: '学习有效的压力管理技巧，改善生活质量和工作效率。',
    content: '现代生活充满压力。冥想、深呼吸、瑜伽和定期运动都是有效的压力管理方法。建立健康的工作生活平衡对长期健康至关重要。',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop',
    publishDate: '2024-01-10'
  }
];

// Mock Categories Data
export const mockCategories: Category[] = [
  {
    id: 'frontiers',
    name: '健康前沿',
    slug: 'health-frontiers',
    description: '最新的健康研究和科学发现'
  },
  {
    id: 'lectures',
    name: '健康讲堂',
    slug: 'health-lectures',
    description: '专业讲座和健康教育'
  },
  {
    id: 'science',
    name: '健康科普',
    slug: 'health-science',
    description: '健康知识科普和生活建议'
  }
];

// API 接口层（可扩展）
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * 获取用户列表
 * 后续可替换为真实 API 调用
 */
export async function fetchUsers(): Promise<ApiResponse<User[]>> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    success: true,
    data: mockUsers
  };
}

/**
 * 获取文章列表
 * 支持按分类过滤
 */
export async function fetchArticles(category?: string): Promise<ApiResponse<Article[]>> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const articles = category
    ? mockArticles.filter(article => article.category === category)
    : mockArticles;
  return {
    success: true,
    data: articles
  };
}

/**
 * 获取单篇文章
 */
export async function fetchArticleById(id: string): Promise<ApiResponse<Article | null>> {
  await new Promise(resolve => setTimeout(resolve, 200));
  const article = mockArticles.find(a => a.id === id);
  return {
    success: true,
    data: article || null
  };
}

/**
 * 获取分类列表
 */
export async function fetchCategories(): Promise<ApiResponse<Category[]>> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    success: true,
    data: mockCategories
  };
}
