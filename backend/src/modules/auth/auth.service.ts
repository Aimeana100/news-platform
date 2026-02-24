import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import {
  ErrorResponse,
  LoginResponseData,
  SignupResponseData,
  SuccessResponse,
} from './auth.types';

const EMAIL_ALREADY_EXISTS_ERROR = 'Email already exists.';
const INVALID_CREDENTIALS_ERROR = 'Invalid email or password.';
const SIGNUP_GENERIC_ERROR =
  'Unable to create account at the moment. Please try again later.';
const LOGIN_GENERIC_ERROR =
  'Unable to log in at the moment. Please try again later.';

@Injectable()
export class AuthService {
  private static readonly BCRYPT_SALT_ROUNDS = 12;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(
    payload: SignupDto,
  ): Promise<SuccessResponse<SignupResponseData>> {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: payload.email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw this.buildEmailConflictException();
    }

    const passwordHash = await bcrypt.hash(
      payload.password,
      AuthService.BCRYPT_SALT_ROUNDS,
    );

    try {
      const createdUser = await this.prisma.user.create({
        data: {
          name: payload.name,
          email: payload.email,
          password: passwordHash,
          role: this.mapSignupRoleToPrismaRole(payload.role),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      return {
        Success: true,
        Data: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          role: this.mapPrismaRoleToApiRole(createdUser.role),
        },
      };
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) {
        throw this.buildEmailConflictException();
      }

      this.logger.error(
        'Signup failed due to an unexpected persistence error.',
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException({
        Success: false,
        Errors: [SIGNUP_GENERIC_ERROR],
      } satisfies ErrorResponse);
    }
  }

  private buildEmailConflictException(): ConflictException {
    return new ConflictException({
      Success: false,
      Errors: [EMAIL_ALREADY_EXISTS_ERROR],
    } satisfies ErrorResponse);
  }

  async login(payload: LoginDto): Promise<SuccessResponse<LoginResponseData>> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: payload.email,
      },
      select: {
        id: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      throw this.buildInvalidCredentialsException();
    }

    const passwordMatches = await bcrypt.compare(
      payload.password,
      user.password,
    );
    if (!passwordMatches) {
      throw this.buildInvalidCredentialsException();
    }

    try {
      const accessToken = await this.jwtService.signAsync({
        sub: user.id,
        role: this.mapPrismaRoleToApiRole(user.role),
      });

      return {
        Success: true,
        Data: {
          accessToken,
        },
      };
    } catch (error) {
      this.logger.error(
        'Login failed during token generation.',
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException({
        Success: false,
        Errors: [LOGIN_GENERIC_ERROR],
      } satisfies ErrorResponse);
    }
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    const maybeCode = (error as { code?: unknown }).code;
    return maybeCode === 'P2002';
  }

  private buildInvalidCredentialsException(): UnauthorizedException {
    return new UnauthorizedException({
      Success: false,
      Errors: [INVALID_CREDENTIALS_ERROR],
    } satisfies ErrorResponse);
  }

  private mapSignupRoleToPrismaRole(role: SignupDto['role']): UserRole {
    return role === 'author' ? UserRole.AUTHOR : UserRole.READER;
  }

  private mapPrismaRoleToApiRole(role: UserRole): SignupResponseData['role'] {
    return role === UserRole.AUTHOR ? 'author' : 'reader';
  }
}
