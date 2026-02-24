import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Article, ArticleStatus } from '../../../generated/prisma/client';
import { UserRole } from '../../../generated/prisma/enums';

export interface CreateArticleData {
  title: string;
  content: string;
  category: string;
  authorId: string;
  status?: ArticleStatus;
}

export interface UpdateArticleData {
  title?: string;
  content?: string;
  category?: string;
  status?: ArticleStatus;
}

export interface FindArticlesByAuthorOptions {
  authorId: string;
  includeDeleted?: boolean;
}

export interface FindPublishedArticlesOptions {
  category?: string;
  author?: string;
  search?: string;
  page: number;
  size: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

@Injectable()
export class ArticlesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new article
   */
  async create(data: CreateArticleData): Promise<Article> {
    return this.prisma.article.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        authorId: data.authorId,
        status: data.status ?? ArticleStatus.Draft,
      },
    });
  }

  /**
   * Find a single article by ID, optionally filtering by author
   * Excludes soft-deleted articles by default
   */
  async findById(
    id: string,
    options?: { authorId?: string; includeDeleted?: boolean },
  ): Promise<Article | null> {
    const where: any = { id };

    // Filter by author if provided
    if (options?.authorId) {
      where.authorId = options.authorId;
    }

    // Handle soft-deleted filter
    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    return this.prisma.article.findUnique({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find all articles by an author
   * Excludes soft-deleted articles by default
   */
  async findByAuthor(
    authorId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<Article[]> {
    const where: any = { authorId };

    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    return this.prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update an article
   */
  async update(id: string, data: UpdateArticleData): Promise<Article> {
    return this.prisma.article.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete an article - sets deletedAt timestamp
   */
  async softDelete(id: string): Promise<Article> {
    return this.prisma.article.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Check if an article exists and belongs to a specific author
   */
  async existsByIdAndAuthor(id: string, authorId: string): Promise<boolean> {
    const article = await this.prisma.article.findFirst({
      where: {
        id,
        authorId,
        deletedAt: null, // Only check non-deleted articles
      },
      select: { id: true },
    });
    return article !== null;
  }

  /**
   * Count articles by author (non-deleted)
   */
  async countByAuthor(authorId: string): Promise<number> {
    return this.prisma.article.count({
      where: {
        authorId,
        deletedAt: null,
      },
    });
  }

  /**
   * Find published articles for public feed with filtering and pagination
   * Always excludes soft-deleted articles
   */
  async findPublished(
    options: FindPublishedArticlesOptions,
  ): Promise<PaginatedResult<Article>> {
    const { category, author, search, page, size } = options;

    // Build the where clause
    const where: any = {
      // Only published articles
      status: ArticleStatus.Published,
      // Exclude soft-deleted articles
      deletedAt: null,
    };

    // Category filter - exact match
    if (category) {
      where.category = category;
    }

    // Author filter - partial, case-insensitive match on author name
    if (author) {
      where.author = {
        name: {
          contains: author,
          mode: 'insensitive',
        },
      };
    }

    // Keyword search - partial match on title (case-insensitive)
    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Execute count and findMany in parallel for efficiency
    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: false,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * size,
        take: size,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }
}
