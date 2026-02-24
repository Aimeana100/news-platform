import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { Transform } from 'class-transformer';

// Validation constants
const PAGE_MIN = 1;
const PAGE_DEFAULT = 1;
const SIZE_MIN = 1;
const SIZE_MAX = 100;
const SIZE_DEFAULT = 10;
const CATEGORY_MAX_LENGTH = 100;
const AUTHOR_MAX_LENGTH = 120;
const SEARCH_MAX_LENGTH = 150;

export class GetArticlesQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (minimum 1)',
    example: 1,
    default: PAGE_DEFAULT,
    minimum: PAGE_MIN,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt({ message: 'page must be an integer.' })
  @Min(PAGE_MIN, { message: `page must be at least ${PAGE_MIN}.` })
  page?: number = PAGE_DEFAULT;

  @ApiPropertyOptional({
    description: 'Number of items per page (1-100)',
    example: 10,
    default: SIZE_DEFAULT,
    minimum: SIZE_MIN,
    maximum: SIZE_MAX,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt({ message: 'size must be an integer.' })
  @Min(SIZE_MIN, { message: `size must be at least ${SIZE_MIN}.` })
  @Max(SIZE_MAX, { message: `size must not exceed ${SIZE_MAX}.` })
  size?: number = SIZE_DEFAULT;

  @ApiPropertyOptional({
    description: 'Exact category filter',
    example: 'Technology',
    maxLength: CATEGORY_MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: 'category must be a string.' })
  @MaxLength(CATEGORY_MAX_LENGTH, {
    message: `category must not exceed ${CATEGORY_MAX_LENGTH} characters.`,
  })
  category?: string;

  @ApiPropertyOptional({
    description: 'Partial, case-insensitive author name search',
    example: 'John',
    maxLength: AUTHOR_MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: 'author must be a string.' })
  @MaxLength(AUTHOR_MAX_LENGTH, {
    message: `author must not exceed ${AUTHOR_MAX_LENGTH} characters.`,
  })
  author?: string;

  @ApiPropertyOptional({
    description: 'Keyword search in article title',
    example: 'NestJS',
    maxLength: SEARCH_MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: 'q must be a string.' })
  @MaxLength(SEARCH_MAX_LENGTH, {
    message: `q must not exceed ${SEARCH_MAX_LENGTH} characters.`,
  })
  q?: string;
}
