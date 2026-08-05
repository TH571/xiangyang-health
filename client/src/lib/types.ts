/**
 * 公共类型定义（由 mockData.ts 迁移而来，数据一律走 API）
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
