import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/repositories/users.repository';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import {
  ApiResponse,
  LoginResponseData,
  SignupResponseData,
} from './auth.types';

const EMAIL_ALREADY_EXISTS_MESSAGE = 'Email already exists.';
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password.';
const SIGNUP_GENERIC_MESSAGE =
  'Unable to create account at the moment. Please try again later.';
const LOGIN_GENERIC_MESSAGE =
  'Unable to log in at the moment. Please try again later.';

const SIGNUP_SUCCESS_MESSAGE = 'User registered successfully.';
const LOGIN_SUCCESS_MESSAGE = 'Login successful.';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async signup(payload: SignupDto): Promise<ApiResponse<SignupResponseData>> {
    const existingUser = await this.usersRepository.findByEmail(payload.email);

    if (existingUser) {
      throw new ConflictException({
        Success: false,
        Message: EMAIL_ALREADY_EXISTS_MESSAGE,
        Object: null,
        Errors: [EMAIL_ALREADY_EXISTS_MESSAGE],
      });
    }

    const passwordHash = await bcrypt.hash(
      payload.password,
      BCRYPT_SALT_ROUNDS,
    );

    try {
      const createdUser = await this.usersRepository.create({
        name: payload.name,
        email: payload.email,
        password: passwordHash,
        role: payload.role,
      });

      return {
        Success: true,
        Message: SIGNUP_SUCCESS_MESSAGE,
        Object: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
        },
        Errors: null,
      };
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          Success: false,
          Message: EMAIL_ALREADY_EXISTS_MESSAGE,
          Object: null,
          Errors: [EMAIL_ALREADY_EXISTS_MESSAGE],
        });
      }

      this.logger.error(
        'Signup failed due to an unexpected persistence error.',
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException({
        Success: false,
        Message: SIGNUP_GENERIC_MESSAGE,
        Object: null,
        Errors: [SIGNUP_GENERIC_MESSAGE],
      });
    }
  }

  async login(payload: LoginDto): Promise<ApiResponse<LoginResponseData>> {
    const user = await this.usersRepository.findByEmail(payload.email);

    if (!user) {
      throw new UnauthorizedException({
        Success: false,
        Message: INVALID_CREDENTIALS_MESSAGE,
        Object: null,
        Errors: [INVALID_CREDENTIALS_MESSAGE],
      });
    }

    const passwordMatches = await bcrypt.compare(
      payload.password,
      user.password,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException({
        Success: false,
        Message: INVALID_CREDENTIALS_MESSAGE,
        Object: null,
        Errors: [INVALID_CREDENTIALS_MESSAGE],
      });
    }

    try {
      const accessToken = await this.jwtService.signAsync({
        sub: user.id,
        role: user.role,
      });

      return {
        Success: true,
        Message: LOGIN_SUCCESS_MESSAGE,
        Object: {
          accessToken,
        },
        Errors: null,
      };
    } catch (error) {
      this.logger.error(
        'Login failed during token generation.',
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException({
        Success: false,
        Message: LOGIN_GENERIC_MESSAGE,
        Object: null,
        Errors: [LOGIN_GENERIC_MESSAGE],
      });
    }
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    const maybeCode = (error as { code?: unknown }).code;
    return maybeCode === 'P2002';
  }
}
