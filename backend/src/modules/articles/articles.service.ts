import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ArticlesRepository } from './repositories/articles.repository';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ApiResponse, ArticleResponseData } from './articles.types';

// Error messages
const ARTICLE_NOT_FOUND_MESSAGE = 'Article not found.';
const FORBIDDEN_MESSAGE = 'Forbidden';
const ARTICLE_CREATE_ERROR_MESSAGE =
  'Unable to create article at the moment. Please try again later.';
const ARTICLE_UPDATE_ERROR_MESSAGE =
  'Unable to update article at the moment. Please try again later.';
const ARTICLE_DELETE_ERROR_MESSAGE =
  'Unable to delete article at the moment. Please try again later.';

// Success messages
const ARTICLE_CREATE_SUCCESS_MESSAGE = 'Article created successfully.';
const ARTICLE_UPDATE_SUCCESS_MESSAGE = 'Article updated successfully.';
const ARTICLE_DELETE_SUCCESS_MESSAGE = 'Article deleted successfully.';

@Injectable()
export class ArticlesService {
  private readonly logger = new Logger(ArticlesService.name);

  constructor(private readonly articlesRepository: ArticlesRepository) {}

  /**
   * Create a new article for an author
   */
  async create(
    authorId: string,
    payload: CreateArticleDto,
  ): Promise<ApiResponse<ArticleResponseData>> {
    try {
      const article = await this.articlesRepository.create({
        title: payload.title,
        content: payload.content,
        category: payload.category,
        authorId,
        status: payload.status,
      });

      return {
        Success: true,
        Message: ARTICLE_CREATE_SUCCESS_MESSAGE,
        Object: this.mapToResponseData(article),
        Errors: null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create article for author ${authorId}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException({
        Success: false,
        Message: ARTICLE_CREATE_ERROR_MESSAGE,
        Object: null,
        Errors: [ARTICLE_CREATE_ERROR_MESSAGE],
      });
    }
  }

  /**
   * Get all articles for an author (their own articles only)
   */
  async findAllByAuthor(
    authorId: string,
  ): Promise<ApiResponse<ArticleResponseData[]>> {
    const articles = await this.articlesRepository.findByAuthor(authorId);

    return {
      Success: true,
      Message: 'Articles retrieved successfully.',
      Object: articles.map((article) => this.mapToResponseData(article)),
      Errors: null,
    };
  }

  /**
   * Get a single article by ID, ensuring ownership
   * Returns forbidden if the article belongs to another author
   */
  async findOne(
    articleId: string,
    requestingAuthorId: string,
  ): Promise<ApiResponse<ArticleResponseData>> {
    const article = await this.articlesRepository.findById(articleId);

    if (!article) {
      throw new NotFoundException({
        Success: false,
        Message: ARTICLE_NOT_FOUND_MESSAGE,
        Object: null,
        Errors: [ARTICLE_NOT_FOUND_MESSAGE],
      });
    }

    // Ownership check - if requesting author is not the owner, return forbidden
    if (article.authorId !== requestingAuthorId) {
      throw new ForbiddenException({
        Success: false,
        Message: FORBIDDEN_MESSAGE,
        Object: null,
        Errors: [FORBIDDEN_MESSAGE],
      });
    }

    return {
      Success: true,
      Message: 'Article retrieved successfully.',
      Object: this.mapToResponseData(article),
      Errors: null,
    };
  }

  /**
   * Update an article, ensuring ownership
   * Returns forbidden if attempting to modify another author's article
   */
  async update(
    articleId: string,
    requestingAuthorId: string,
    payload: UpdateArticleDto,
  ): Promise<ApiResponse<ArticleResponseData>> {
    // First check if article exists and belongs to the author
    const article = await this.articlesRepository.findById(articleId);

    if (!article) {
      throw new NotFoundException({
        Success: false,
        Message: ARTICLE_NOT_FOUND_MESSAGE,
        Object: null,
        Errors: [ARTICLE_NOT_FOUND_MESSAGE],
      });
    }

    // Ownership check
    if (article.authorId !== requestingAuthorId) {
      throw new ForbiddenException({
        Success: false,
        Message: FORBIDDEN_MESSAGE,
        Object: null,
        Errors: [FORBIDDEN_MESSAGE],
      });
    }

    try {
      const updatedArticle = await this.articlesRepository.update(articleId, {
        title: payload.title,
        content: payload.content,
        category: payload.category,
        status: payload.status,
      });

      return {
        Success: true,
        Message: ARTICLE_UPDATE_SUCCESS_MESSAGE,
        Object: this.mapToResponseData(updatedArticle),
        Errors: null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update article ${articleId}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException({
        Success: false,
        Message: ARTICLE_UPDATE_ERROR_MESSAGE,
        Object: null,
        Errors: [ARTICLE_UPDATE_ERROR_MESSAGE],
      });
    }
  }

  /**
   * Soft delete an article, ensuring ownership
   * Returns forbidden if attempting to delete another author's article
   */
  async remove(
    articleId: string,
    requestingAuthorId: string,
  ): Promise<ApiResponse<null>> {
    // First check if article exists and belongs to the author
    const article = await this.articlesRepository.findById(articleId);

    if (!article) {
      throw new NotFoundException({
        Success: false,
        Message: ARTICLE_NOT_FOUND_MESSAGE,
        Object: null,
        Errors: [ARTICLE_NOT_FOUND_MESSAGE],
      });
    }

    // Ownership check
    if (article.authorId !== requestingAuthorId) {
      throw new ForbiddenException({
        Success: false,
        Message: FORBIDDEN_MESSAGE,
        Object: null,
        Errors: [FORBIDDEN_MESSAGE],
      });
    }

    try {
      await this.articlesRepository.softDelete(articleId);

      return {
        Success: true,
        Message: ARTICLE_DELETE_SUCCESS_MESSAGE,
        Object: null,
        Errors: null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to soft-delete article ${articleId}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException({
        Success: false,
        Message: ARTICLE_DELETE_ERROR_MESSAGE,
        Object: null,
        Errors: [ARTICLE_DELETE_ERROR_MESSAGE],
      });
    }
  }

  /**
   * Map Prisma Article to response data
   */
  private mapToResponseData(article: any): ArticleResponseData {
    return {
      id: article.id,
      title: article.title,
      content: article.content,
      category: article.category,
      status: article.status,
      authorId: article.authorId,
      createdAt: article.createdAt,
      deletedAt: article.deletedAt,
    };
  }
}
