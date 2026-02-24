import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import {
  ApiResponse,
  LoginResponseData,
  SignupResponseData,
} from './auth.types';

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
          role: 'Author',
        },
      },
      readerSignup: {
        summary: 'Reader signup',
        value: {
          name: 'John Reader',
          email: 'john.reader@example.com',
          password: 'Read3r@Pass',
          role: 'Reader',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Account created successfully.',
    schema: {
      example: {
        Success: true,
        Message: 'User registered successfully.',
        Object: {
          id: 'f8497cff-310f-4f43-8d35-63513f0d68ea',
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          role: 'Author',
        },
        Errors: null,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Request payload validation failed.',
    schema: {
      example: {
        Success: false,
        Message: 'Validation failed',
        Object: null,
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
        Message: 'Email already exists.',
        Object: null,
        Errors: ['Email already exists.'],
      },
    },
  })
  async signup(
    @Body() payload: SignupDto,
  ): Promise<ApiResponse<SignupResponseData>> {
    return this.authService.signup(payload);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and issue access token' })
  @ApiBody({
    type: LoginDto,
    description: 'Login payload',
    examples: {
      login: {
        summary: 'Valid login',
        value: {
          email: 'jane.doe@example.com',
          password: 'Str0ngP@ssword!',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Authenticated successfully.',
    schema: {
      example: {
        Success: true,
        Message: 'Login successful.',
        Object: {
          accessToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmODQ5N2NmZi0zMTBmLTRmNDMtOGQzNS02MzUxM2YwZDY4ZWEiLCJyb2xlIjoiYXV0aG9yIiwiZXhwIjoxNzQwNDAwMDAwfQ.signature',
        },
        Errors: null,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Request payload validation failed.',
    schema: {
      example: {
        Success: false,
        Message: 'Validation failed',
        Object: null,
        Errors: ['email must be a valid email address.'],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials.',
    schema: {
      example: {
        Success: false,
        Message: 'Invalid email or password.',
        Object: null,
        Errors: ['Invalid email or password.'],
      },
    },
  })
  async login(
    @Body() payload: LoginDto,
  ): Promise<ApiResponse<LoginResponseData>> {
    return this.authService.login(payload);
  }
}
