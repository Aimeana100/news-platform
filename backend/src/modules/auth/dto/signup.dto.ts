import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const NAME_PATTERN = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
const PASSWORD_SPECIAL_CHARACTER_PATTERN = /[^A-Za-z0-9]/;
const ALLOWED_ROLES = ['Author', 'Reader'] as const;

export type AllowedRole = (typeof ALLOWED_ROLES)[number];

const normalizeName = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().replace(/\s+/g, ' ');
};

const normalizeEmail = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().toLowerCase();
};

const normalizeRole = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  // Capitalize first letter to match enum values
  const trimmed = value.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

export class SignupDto {
  @ApiProperty({
    description: 'User full name (alphabets and spaces only).',
    example: 'Jane Doe',
    minLength: 1,
    maxLength: 120,
    pattern: '^[A-Za-z]+(?:\\s[A-Za-z]+)*$',
  })
  @Transform(({ value }) => normalizeName(value))
  @IsString({ message: 'name must be a string.' })
  @IsNotEmpty({ message: 'name is required.' })
  @Matches(NAME_PATTERN, {
    message: 'name must contain only alphabets and single spaces.',
  })
  @MaxLength(120, { message: 'name must not exceed 120 characters.' })
  name!: string;

  @ApiProperty({
    description: 'Unique email for the account.',
    example: 'jane.doe@example.com',
    format: 'email',
    maxLength: 320,
  })
  @Transform(({ value }) => normalizeEmail(value))
  @IsString({ message: 'email must be a string.' })
  @IsNotEmpty({ message: 'email is required.' })
  @IsEmail({}, { message: 'email must be a valid email address.' })
  @MaxLength(320, { message: 'email must not exceed 320 characters.' })
  email!: string;

  @ApiProperty({
    description:
      'Password with at least 8 chars, 1 uppercase, 1 lowercase, 1 number, and 1 special character.',
    example: 'Str0ngP@ssword!',
    minLength: 8,
    maxLength: 72,
  })
  @IsString({ message: 'password must be a string.' })
  @IsNotEmpty({ message: 'password is required.' })
  @MinLength(8, { message: 'password must be at least 8 characters long.' })
  @MaxLength(72, {
    message: 'password must not exceed 72 characters for bcrypt compatibility.',
  })
  @Matches(/[A-Z]/, {
    message: 'password must contain at least one uppercase letter.',
  })
  @Matches(/[a-z]/, {
    message: 'password must contain at least one lowercase letter.',
  })
  @Matches(/\d/, {
    message: 'password must contain at least one number.',
  })
  @Matches(PASSWORD_SPECIAL_CHARACTER_PATTERN, {
    message: 'password must contain at least one special character.',
  })
  password!: string;

  @ApiProperty({
    description: 'User role.',
    enum: ALLOWED_ROLES,
    example: 'Author',
  })
  @Transform(({ value }) => normalizeRole(value))
  @IsString({ message: 'role must be a string.' })
  @IsNotEmpty({ message: 'role is required.' })
  @IsIn(ALLOWED_ROLES, {
    message: "role must be either 'Author' or 'Reader'.",
  })
  role!: AllowedRole;
}
