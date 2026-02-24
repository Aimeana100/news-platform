import { ArticleStatus } from '../../generated/prisma/enums';

export interface ApiResponse<T> {
  Success: boolean;
  Message: string;
  Object: T | null;
  Errors: string[] | null;
}

export interface ArticleResponseData {
  id: string;
  title: string;
  content: string;
  category: string;
  status: ArticleStatus;
  authorId: string;
  createdAt: Date;
  deletedAt: Date | null;
}

export interface CreateArticleResponseData extends ArticleResponseData {}

export interface UpdateArticleResponseData extends ArticleResponseData {}

export interface ArticleListResponseData {
  articles: ArticleResponseData[];
  total: number;
}

export interface PaginationMeta {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface PaginatedArticlesResponse {
  articles: ArticleResponseData[];
  pagination: PaginationMeta;
}
