import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { GetArticlesQueryDto } from './dto/get-articles.query.dto';
import {
  ApiResponse,
  ArticleResponseData,
  PaginationMeta,
} from './articles.types';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    role: string;
  };
}

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  /**
   * GET /articles - Public endpoint to discover published news
   * No authentication required
   *
   * Features:
   * - Returns only published articles (status = 'Published')
   * - Excludes soft-deleted articles (deletedAt IS NULL)
   * - Supports filtering by category (exact match)
   * - Supports filtering by author (partial, case-insensitive)
   * - Supports keyword search in title (partial, case-insensitive)
   * - Pagination with configurable page and size
   */
  @Get()
  @ApiOperation({
    summary: 'Get published articles (Public Feed)',
    description:
      'Public endpoint to discover published news. Returns only published articles, ' +
      'excludes soft-deleted content. Supports filtering by category, author name, ' +
      'and keyword search in title.',
  })
  @ApiOkResponse({
    description: 'Articles retrieved successfully.',
    schema: {
      example: {
        Success: true,
        Message: 'Articles retrieved successfully.',
        Object: {
          articles: [
            {
              id: 'f8497cff-310f-4f43-8d35-63513f0d68ea',
              title: 'Understanding NestJS Architecture',
              content:
                '# Introduction\n\nNestJS is a progressive Node.js framework...',
              category: 'Technology',
              status: 'Published',
              authorId: 'author-uuid-here',
              createdAt: '2024-01-15T10:30:00.000Z',
              deletedAt: null,
            },
          ],
          pagination: {
            page: 1,
            size: 10,
            total: 50,
            totalPages: 5,
          },
        },
        Errors: null,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    schema: {
      example: {
        Success: false,
        Message: 'Validation failed',
        Object: null,
        Errors: ['page must be an integer.', 'size must not exceed 100.'],
      },
    },
  })
  async findPublished(
    @Query() query: GetArticlesQueryDto,
  ): Promise<
    ApiResponse<{ articles: ArticleResponseData[]; pagination: PaginationMeta }>
  > {
    return this.articlesService.findPublished(query);
  }

  /**
   * POST /articles - Create a new article
   * Author only
   */
  @Post()
  @ApiOperation({ summary: 'Create a new article (Author only)' })
  @ApiBody({
    type: CreateArticleDto,
    examples: {
      createArticle: {
        summary: 'Create article example',
        value: {
          title: 'Understanding NestJS Architecture',
          content:
            '# Introduction\n\nNestJS is a progressive Node.js framework...',
          category: 'Technology',
          status: 'Draft',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Article created successfully.',
    schema: {
      example: {
        Success: true,
        Message: 'Article created successfully.',
        Object: {
          id: 'f8497cff-310f-4f43-8d35-63513f0d68ea',
          title: 'Understanding NestJS Architecture',
          content:
            '# Introduction\n\nNestJS is a progressive Node.js framework...',
          category: 'Technology',
          status: 'Draft',
          authorId: 'author-uuid-here',
          createdAt: '2024-01-15T10:30:00.000Z',
          deletedAt: null,
        },
        Errors: null,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    schema: {
      example: {
        Success: false,
        Message: 'Validation failed',
        Object: null,
        Errors: ['title must not exceed 150 characters.'],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT.',
    schema: {
      example: {
        Success: false,
        Message: 'Invalid email or password.',
        Object: null,
        Errors: ['Invalid email or password.'],
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - User is not an Author.',
    schema: {
      example: {
        Success: false,
        Message: 'Forbidden',
        Object: null,
        Errors: ['Forbidden'],
      },
    },
  })
  async create(
    @Body() payload: CreateArticleDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiResponse<ArticleResponseData>> {
    const authorId = req.user.sub;
    return this.articlesService.create(authorId, payload);
  }

  /**
   * GET /articles/me - Get all articles for the authenticated author
   * Author only
   */
  @Get('me')
  @ApiOperation({
    summary: 'Get all articles for the authenticated author (Author only)',
  })
  @ApiOkResponse({
    description: 'Articles retrieved successfully.',
    schema: {
      example: {
        Success: true,
        Message: 'Articles retrieved successfully.',
        Object: [
          {
            id: 'f8497cff-310f-4f43-8d35-63513f0d68ea',
            title: 'Understanding NestJS Architecture',
            content:
              '# Introduction\n\nNestJS is a progressive Node.js framework...',
            category: 'Technology',
            status: 'Draft',
            authorId: 'author-uuid-here',
            createdAt: '2024-01-15T10:30:00.000Z',
            deletedAt: null,
          },
        ],
        Errors: null,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT.',
    schema: {
      example: {
        Success: false,
        Message: 'Invalid email or password.',
        Object: null,
        Errors: ['Invalid email or password.'],
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - User is not an Author.',
    schema: {
      example: {
        Success: false,
        Message: 'Forbidden',
        Object: null,
        Errors: ['Forbidden'],
      },
    },
  })
  async findAll(
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiResponse<ArticleResponseData[]>> {
    const authorId = req.user.sub;
    return this.articlesService.findAllByAuthor(authorId);
  }

  /**
   * GET /articles/:id - Get a single article by ID
   * Author can only access their own articles
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get a single article by ID (Author only, own articles)',
  })
  @ApiOkResponse({
    description: 'Article retrieved successfully.',
    schema: {
      example: {
        Success: true,
        Message: 'Article retrieved successfully.',
        Object: {
          id: 'f8497cff-310f-4f43-8d35-63513f0d68ea',
          title: 'Understanding NestJS Architecture',
          content:
            '# Introduction\n\nNestJS is a progressive Node.js framework...',
          category: 'Technology',
          status: 'Draft',
          authorId: 'author-uuid-here',
          createdAt: '2024-01-15T10:30:00.000Z',
          deletedAt: null,
        },
        Errors: null,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Article not found.',
    schema: {
      example: {
        Success: false,
        Message: 'Article not found.',
        Object: null,
        Errors: ['Article not found.'],
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Not the owner of the article.',
    schema: {
      example: {
        Success: false,
        Message: 'Forbidden',
        Object: null,
        Errors: ['Forbidden'],
      },
    },
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiResponse<ArticleResponseData>> {
    const requestingAuthorId = req.user.sub;
    return this.articlesService.findOne(id, requestingAuthorId);
  }

  /**
   * PUT /articles/:id - Update an article
   * Author can only update their own articles
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update an article (Author only, own articles)' })
  @ApiBody({
    type: UpdateArticleDto,
    examples: {
      updateArticle: {
        summary: 'Update article example',
        value: {
          title: 'Updated Understanding NestJS Architecture',
          status: 'Published',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Article updated successfully.',
    schema: {
      example: {
        Success: true,
        Message: 'Article updated successfully.',
        Object: {
          id: 'f8497cff-310f-4f43-8d35-63513f0d68ea',
          title: 'Updated Understanding NestJS Architecture',
          content:
            '# Introduction\n\nNestJS is a progressive Node.js framework...',
          category: 'Technology',
          status: 'Published',
          authorId: 'author-uuid-here',
          createdAt: '2024-01-15T10:30:00.000Z',
          deletedAt: null,
        },
        Errors: null,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Article not found.',
    schema: {
      example: {
        Success: false,
        Message: 'Article not found.',
        Object: null,
        Errors: ['Article not found.'],
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Not the owner of the article.',
    schema: {
      example: {
        Success: false,
        Message: 'Forbidden',
        Object: null,
        Errors: ['Forbidden'],
      },
    },
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateArticleDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiResponse<ArticleResponseData>> {
    const requestingAuthorId = req.user.sub;
    return this.articlesService.update(id, requestingAuthorId, payload);
  }

  /**
   * DELETE /articles/:id - Soft delete an article
   * Author can only delete their own articles
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft delete an article (Author only, own articles)',
  })
  @ApiNoContentResponse({
    description: 'Article deleted successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Article not found.',
    schema: {
      example: {
        Success: false,
        Message: 'Article not found.',
        Object: null,
        Errors: ['Article not found.'],
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Not the owner of the article.',
    schema: {
      example: {
        Success: false,
        Message: 'Forbidden',
        Object: null,
        Errors: ['Forbidden'],
      },
    },
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiResponse<null>> {
    const requestingAuthorId = req.user.sub;
    return this.articlesService.remove(id, requestingAuthorId);
  }
}
