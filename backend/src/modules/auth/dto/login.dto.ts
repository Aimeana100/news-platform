import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

const normalizeEmail = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().toLowerCase();
};

export class LoginDto {
  @ApiProperty({
    description: 'Registered account email.',
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
    description: 'Account password.',
    example: 'Str0ngP@ssword!',
    maxLength: 72,
  })
  @IsString({ message: 'password must be a string.' })
  @IsNotEmpty({ message: 'password is required.' })
  @MaxLength(72, {
    message: 'password must not exceed 72 characters for bcrypt compatibility.',
  })
  password!: string;
}
