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
}
