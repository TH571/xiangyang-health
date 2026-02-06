# 向阳健康平台 - 后端 API 接口规范

## 基础信息

- **Base URL**: `https://api.xiangyang.com` (待定)
- **API 版本**: v1
- **数据格式**: JSON
- **字符编码**: UTF-8

## 通用规范

### 统一响应格式

所有 API 接口均使用以下统一响应格式：

```typescript
{
  "success": boolean,    // 请求是否成功
  "data": any,           // 返回数据
  "message?: string      // 错误信息或提示信息（可选）
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/未登录 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 接口列表

### 1. 获取分类列表

获取所有健康知识分类。

**接口地址**: `GET /api/v1/categories`

**请求参数**: 无

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": "frontiers",
      "name": "健康前沿",
      "slug": "health-frontiers",
      "description": "最新的健康研究和科学发现"
    },
    {
      "id": "lectures",
      "name": "健康讲堂",
      "slug": "health-lectures",
      "description": "专业讲座和健康教育"
    },
    {
      "id": "science",
      "name": "健康科普",
      "slug": "health-science",
      "description": "健康知识科普和生活建议"
    }
  ]
}
```

**数据结构**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 分类唯一标识 |
| name | string | 是 | 分类显示名称 |
| slug | string | 是 | URL友好标识符 |
| description | string | 是 | 分类描述 |

---

### 2. 获取文章列表

获取文章列表，支持按分类筛选和分页。

**接口地址**: `GET /api/v1/articles`

**请求参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| category | string | 否 | - | 分类ID (frontiers/lectures/science) |
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |
| search | string | 否 | - | 搜索关键词 |

**请求示例**:

```
GET /api/v1/articles?category=frontiers&page=1&limit=10
GET /api/v1/articles?search=运动
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "1",
        "title": "掌握健康：专家评估产品的指南",
        "category": "frontiers",
        "author": "Zebra Zhang",
        "excerpt": "在当今这个信息爆炸的时代，健康产品的选择变得越来越复杂...",
        "content": "完整的文章内容（Markdown格式）...",
        "image": "https://example.com/images/article-1.jpg",
        "publishDate": "2024-01-15",
        "views": 1250,
        "likes": 89
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

**数据结构**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 文章唯一标识 |
| title | string | 是 | 文章标题 |
| category | string | 是 | 所属分类 |
| author | string | 是 | 作者名称 |
| excerpt | string | 是 | 文章摘要（100-200字） |
| content | string | 是 | 文章完整内容（支持Markdown） |
| image | string | 是 | 封面图片URL |
| publishDate | string | 是 | 发布日期（ISO 8601格式） |
| views | number | 否 | 浏览次数 |
| likes | number | 否 | 点赞数 |

---

### 3. 获取文章详情

获取单篇文章的完整信息。

**接口地址**: `GET /api/v1/articles/:id`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 文章ID |

**请求示例**:

```
GET /api/v1/articles/1
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "掌握健康：专家评估产品的指南",
    "category": "frontiers",
    "author": "Zebra Zhang",
    "excerpt": "在当今这个信息爆炸的时代，健康产品的选择变得越来越复杂...",
    "content": "# 完整的文章内容\n\n## 了解健康产品的基本类型\n\n...",
    "image": "https://example.com/images/article-1.jpg",
    "publishDate": "2024-01-15T10:30:00Z",
    "views": 1250,
    "likes": 89,
    "relatedArticles": [
      {
        "id": "2",
        "title": "运动与心理健康的关系",
        "category": "frontiers",
        "image": "https://example.com/images/article-2.jpg"
      }
    ]
  }
}
```

**数据结构**: 与文章列表相同，额外增加：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| relatedArticles | array | 否 | 相关文章推荐（同分类的其他文章） |

---

### 4. 获取用户列表（今日工大人）

获取展示在首页的健康达人用户列表。

**接口地址**: `GET /api/v1/users`

**请求参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| limit | number | 否 | 10 | 返回数量 |
| featured | boolean | 否 | true | 是否只返回精选用户 |

**请求示例**:

```
GET /api/v1/users?limit=10&featured=true
```

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Olivia Walker",
      "quote": "健康是最好的投资",
      "avatar": "https://example.com/avatars/user-1.jpg",
      "role": "fitness_coach",
      "featured": true
    },
    {
      "id": "2",
      "name": "Dan Mitchell",
      "quote": "坚持运动，享受生活",
      "avatar": "https://example.com/avatars/user-2.jpg",
      "role": "nutritionist",
      "featured": true
    }
  ]
}
```

**数据结构**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 用户唯一标识 |
| name | string | 是 | 用户显示名称 |
| quote | string | 是 | 用户健康格言 |
| avatar | string | 是 | 头像图片URL |
| role | string | 否 | 用户角色（fitness_coach/nutritionist/etc） |
| featured | boolean | 否 | 是否为精选用户 |

---

### 5. 点赞文章

用户对文章进行点赞操作。

**接口地址**: `POST /api/v1/articles/:id/like`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 文章ID |

**请求头**:

```
Authorization: Bearer {token}  // 如果需要登录
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "articleId": "1",
    "likes": 90,
    "liked": true
  }
}
```

**数据结构**:

| 字段 | 类型 | 说明 |
|------|------|------|
| articleId | string | 文章ID |
| likes | number | 更新后的点赞总数 |
| liked | boolean | 当前用户是否已点赞 |

---

### 6. 分享文章

记录文章分享行为（用于统计）。

**接口地址**: `POST /api/v1/articles/:id/share`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 文章ID |

**请求体**:

```json
{
  "platform": "wechat"  // 分享平台：wechat/weibo/copy
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "articleId": "1",
    "shares": 25
  }
}
```

---

### 7. 搜索文章

全文搜索文章。

**接口地址**: `GET /api/v1/search`

**请求参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| q | string | 是 | - | 搜索关键词 |
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |

**请求示例**:

```
GET /api/v1/search?q=运动&page=1&limit=10
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "2",
        "title": "运动与心理健康的关系",
        "category": "frontiers",
        "excerpt": "科研表明，定期运动不仅能改善身体健康...",
        "image": "https://example.com/images/article-2.jpg",
        "highlight": "科研表明，定期<em>运动</em>不仅能改善身体健康..."
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
}
```

---

## 数据模型

### Category（分类）

```typescript
interface Category {
  id: string;           // 唯一标识
  name: string;         // 显示名称
  slug: string;         // URL标识符
  description: string;  // 描述
}
```

### Article（文章）

```typescript
interface Article {
  id: string;           // 唯一标识
  title: string;        // 标题
  category: string;     // 分类ID
  author: string;       // 作者
  excerpt: string;      // 摘要
  content: string;      // 内容（Markdown）
  image: string;        // 封面图URL
  publishDate: string;  // 发布日期（ISO 8601）
  views?: number;       // 浏览次数
  likes?: number;       // 点赞数
}
```

### User（用户）

```typescript
interface User {
  id: string;           // 唯一标识
  name: string;         // 显示名称
  quote: string;        // 格言
  avatar: string;       // 头像URL
  role?: string;        // 角色
  featured?: boolean;   // 是否精选
}
```

---

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "data": null,
  "message": "错误描述信息"
}
```

### 常见错误码

| 错误码 | 说明 |
|--------|------|
| INVALID_PARAMS | 请求参数无效 |
| ARTICLE_NOT_FOUND | 文章不存在 |
| CATEGORY_NOT_FOUND | 分类不存在 |
| UNAUTHORIZED | 未授权访问 |
| RATE_LIMIT_EXCEEDED | 请求频率超限 |

---

## 注意事项

### 性能优化

1. **图片资源**: 建议使用 CDN 加速，支持 WebP 格式
2. **分页**: 建议每页最多返回 20 条数据
3. **缓存策略**:
   - 分类列表：缓存 1 小时
   - 文章列表：缓存 5 分钟
   - 文章详情：缓存 10 分钟

### 安全建议

1. **CORS 配置**: 允许前端域名访问
2. **速率限制**: 防止接口滥用
3. **输入验证**: 严格验证所有输入参数
4. **SQL 注入防护**: 使用参数化查询

### 内容管理

1. **图片格式**: 支持 JPG、PNG、WebP
2. **图片尺寸**:
   - 文章封面：推荐 800x600 或 1200x800
   - 用户头像：推荐 200x200
3. **内容格式**: 文章内容支持 Markdown 语法

---

## 开发优先级

### 第一阶段（MVP）

- ✅ 获取分类列表
- ✅ 获取文章列表（支持分类筛选）
- ✅ 获取文章详情
- ✅ 获取用户列表

### 第二阶段（增强功能）

- ⏳ 搜索功能
- ⏳ 点赞功能
- ⏳ 分享统计

### 第三阶段（进阶功能）

- ⏳ 用户认证（微信登录）
- ⏳ 评论系统
- ⏳ 内容推荐算法

---

## 测试数据建议

开发期间可使用以下测试数据：

### 分类
- frontiers - 健康前沿
- lectures - 健康讲堂
- science - 健康科普

### 测试账号
（如需要认证功能）

---

## 联系方式

如有疑问，请联系前端开发团队。

**文档版本**: v1.0
**最后更新**: 2024-01-15
