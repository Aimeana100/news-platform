import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SignupResponseData, SuccessResponse } from './auth.types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({
    type: SignupDto,
    description: 'Signup payload',
    examples: {
      authorSignup: {
        summary: 'Author signup',
        value: {
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          password: 'Str0ngP@ssword!',
          role: 'author',
        },
      },
      readerSignup: {
        summary: 'Reader signup',
        value: {
          name: 'John Reader',
          email: 'john.reader@example.com',
          password: 'Read3r@Pass',
          role: 'reader',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Account created successfully.',
    schema: {
      example: {
        Success: true,
        Data: {
          id: 'f8497cff-310f-4f43-8d35-63513f0d68ea',
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          role: 'author',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Request payload validation failed.',
    schema: {
      example: {
        Success: false,
        Errors: [
          'email must be a valid email address.',
          'password must contain at least one special character.',
        ],
      },
    },
  })
  @ApiConflictResponse({
    description: 'Email is already registered.',
    schema: {
      example: {
        Success: false,
        Errors: ['Email already exists.'],
      },
    },
  })
  async signup(
    @Body() payload: SignupDto,
  ): Promise<SuccessResponse<SignupResponseData>> {
    return this.authService.signup(payload);
  }
}
