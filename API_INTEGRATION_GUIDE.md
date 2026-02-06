# API 集成指南

本文档说明如何将模拟数据替换为真实 API 调用。

## 当前状态

项目当前使用 `client/src/lib/mockData.ts` 中的模拟数据进行开发。所有数据接口都已预设，便于后续替换。

## 数据结构

### 用户数据 (User)
```typescript
interface User {
  id: string;
  name: string;
  quote: string;
  avatar: string;
}
```

### 文章数据 (Article)
```typescript
interface Article {
  id: string;
  title: string;
  category: 'frontiers' | 'lectures' | 'science';
  author: string;
  excerpt: string;
  content: string;
  image: string;
  publishDate: string;
}
```

### 分类数据 (Category)
```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}
```

## 替换步骤

### 1. 更新 mockData.ts 中的 API 函数

在 `client/src/lib/mockData.ts` 中，修改以下函数以调用真实 API：

```typescript
// 示例：替换 fetchUsers 函数
export async function fetchUsers(): Promise<ApiResponse<User[]>> {
  try {
    const response = await fetch('https://your-api.com/api/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

### 2. 更新其他 API 函数

类似地更新：
- `fetchArticles(category?: string)` - 获取文章列表
- `fetchArticleById(id: string)` - 获取单篇文章
- `fetchCategories()` - 获取分类列表

### 3. 处理错误和加载状态

页面组件已经处理了加载状态。确保您的 API 响应遵循 `ApiResponse` 接口：

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
```

## 使用示例

### 在组件中使用 API

```typescript
import { fetchArticles } from '@/lib/mockData';

export default function ArticleList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const response = await fetchArticles('frontiers');
        if (response.success) {
          setArticles(response.data);
        }
      } catch (error) {
        console.error('Failed to load articles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  if (loading) return <div>加载中...</div>;
  return <div>{/* 渲染文章 */}</div>;
}
```

## 分页支持

如果需要添加分页，可以修改 API 函数签名：

```typescript
export async function fetchArticles(
  category?: string,
  page: number = 1,
  limit: number = 10
): Promise<ApiResponse<{
  articles: Article[];
  total: number;
  page: number;
}>> {
  // 实现分页逻辑
}
```

## 缓存策略

建议使用 React Query 或 SWR 来管理 API 缓存和状态：

```bash
pnpm add @tanstack/react-query
# 或
pnpm add swr
```

## 环境变量

在 `.env` 文件中配置 API 端点：

```env
VITE_API_BASE_URL=https://your-api.com
VITE_API_TIMEOUT=10000
```

然后在 API 函数中使用：

```typescript
const baseUrl = import.meta.env.VITE_API_BASE_URL;
const response = await fetch(`${baseUrl}/api/articles`);
```

## 常见问题

### Q: 如何处理 CORS 问题？
A: 如果 API 不支持 CORS，可以使用代理或后端转发。

### Q: 如何添加认证？
A: 在 API 请求中添加 Authorization 头：

```typescript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
const response = await fetch(url, { headers });
```

### Q: 如何处理网络错误？
A: 使用 try-catch 和错误边界处理异常。

## 相关文件

- `client/src/lib/mockData.ts` - 数据和 API 接口定义
- `client/src/pages/Home.tsx` - 首页组件（使用 API）
- `client/src/components/ArticleCard.tsx` - 文章卡片组件
- `client/src/components/UserCard.tsx` - 用户卡片组件
