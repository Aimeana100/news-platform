import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { ArticleStatus } from '../../../generated/prisma/enums';
import { CreateArticleDto } from './create-article.dto';

// Validation constants (must match create-article.dto.ts)
const TITLE_MIN_LENGTH = 1;
const TITLE_MAX_LENGTH = 150;
const CONTENT_MIN_LENGTH = 1;
const CONTENT_MAX_LENGTH = 50000;
const CATEGORY_MAX_LENGTH = 100;

export class UpdateArticleDto extends PartialType(CreateArticleDto) {
  @ApiProperty({
    description: 'Article title',
    example: 'Updated Understanding NestJS Architecture',
    minLength: TITLE_MIN_LENGTH,
    maxLength: TITLE_MAX_LENGTH,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'title must be a string.' })
  @MinLength(TITLE_MIN_LENGTH, {
    message: `title must be at least ${TITLE_MIN_LENGTH} character(s).`,
  })
  @MaxLength(TITLE_MAX_LENGTH, {
    message: `title must not exceed ${TITLE_MAX_LENGTH} characters.`,
  })
  title?: string;

  @ApiProperty({
    description: 'Article content (supports markdown)',
    example: '# Updated Introduction\n\nThis article now covers...',
    minLength: CONTENT_MIN_LENGTH,
    maxLength: CONTENT_MAX_LENGTH,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'content must be a string.' })
  @MinLength(CONTENT_MIN_LENGTH, {
    message: `content must be at least ${CONTENT_MIN_LENGTH} character(s).`,
  })
  @MaxLength(CONTENT_MAX_LENGTH, {
    message: `content must not exceed ${CONTENT_MAX_LENGTH} characters.`,
  })
  content?: string;

  @ApiProperty({
    description: 'Article category',
    example: 'Software Engineering',
    maxLength: CATEGORY_MAX_LENGTH,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'category must be a string.' })
  @MaxLength(CATEGORY_MAX_LENGTH, {
    message: `category must not exceed ${CATEGORY_MAX_LENGTH} characters.`,
  })
  category?: string;

  @ApiProperty({
    description: 'Article status',
    enum: ArticleStatus,
    example: ArticleStatus.Published,
    required: false,
  })
  @IsOptional()
  @IsEnum(ArticleStatus, {
    message: `status must be either '${ArticleStatus.Draft}' or '${ArticleStatus.Published}'.`,
  })
  status?: ArticleStatus;
}
