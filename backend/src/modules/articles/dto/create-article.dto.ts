import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { ArticleStatus } from '../../../generated/prisma/enums';

// Validation constants based on Prisma schema
const TITLE_MIN_LENGTH = 1;
const TITLE_MAX_LENGTH = 150;
const CONTENT_MIN_LENGTH = 1;
// Note: Prisma uses @db.Text which has no max length in PostgreSQL
// Setting a reasonable max for API validation
const CONTENT_MAX_LENGTH = 50000;
const CATEGORY_MAX_LENGTH = 100;

export class CreateArticleDto {
  @ApiProperty({
    description: 'Article title',
    example: 'Understanding NestJS Architecture',
    minLength: TITLE_MIN_LENGTH,
    maxLength: TITLE_MAX_LENGTH,
  })
  @IsString({ message: 'title must be a string.' })
  @IsNotEmpty({ message: 'title is required.' })
  @MinLength(TITLE_MIN_LENGTH, {
    message: `title must be at least ${TITLE_MIN_LENGTH} character(s).`,
  })
  @MaxLength(TITLE_MAX_LENGTH, {
    message: `title must not exceed ${TITLE_MAX_LENGTH} characters.`,
  })
  title!: string;

  @ApiProperty({
    description: 'Article content (supports markdown)',
    example: '# Introduction\n\nThis article covers...',
    minLength: CONTENT_MIN_LENGTH,
    maxLength: CONTENT_MAX_LENGTH,
  })
  @IsString({ message: 'content must be a string.' })
  @IsNotEmpty({ message: 'content is required.' })
  @MinLength(CONTENT_MIN_LENGTH, {
    message: `content must be at least ${CONTENT_MIN_LENGTH} character(s).`,
  })
  @MaxLength(CONTENT_MAX_LENGTH, {
    message: `content must not exceed ${CONTENT_MAX_LENGTH} characters.`,
  })
  content!: string;

  @ApiProperty({
    description: 'Article category',
    example: 'Technology',
    maxLength: CATEGORY_MAX_LENGTH,
  })
  @IsString({ message: 'category must be a string.' })
  @IsNotEmpty({ message: 'category is required.' })
  @MaxLength(CATEGORY_MAX_LENGTH, {
    message: `category must not exceed ${CATEGORY_MAX_LENGTH} characters.`,
  })
  category!: string;

  @ApiProperty({
    description: 'Article status',
    enum: ArticleStatus,
    example: ArticleStatus.Draft,
    required: false,
  })
  @IsEnum(ArticleStatus, {
    message: `status must be either '${ArticleStatus.Draft}' or '${ArticleStatus.Published}'.`,
  })
  status?: ArticleStatus;
}
