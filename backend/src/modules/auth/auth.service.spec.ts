import {
  ConflictException,
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
import { AuthService } from './auth.service';

type CreatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type MockPrisma = {
  user: {
    findUnique: jest.Mock<Promise<unknown>, [unknown]>;
    create: jest.Mock<Promise<CreatedUser>, [unknown]>;
  };
};

type MockJwtService = {
  signAsync: jest.Mock<Promise<string>, [unknown]>;
};

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: MockPrisma;
  let jwtService: MockJwtService;

  beforeEach(() => {
    const findUnique = jest.fn<Promise<unknown>, [unknown]>();
    const create = jest.fn<Promise<CreatedUser>, [unknown]>();
    const signAsync = jest.fn<Promise<string>, [unknown]>();

    prisma = {
      user: {
        findUnique,
        create,
      },
    };
    jwtService = {
      signAsync,
    };

    authService = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
    );
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const buildSignupPayload = (): SignupDto => ({
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'StrongPass1!',
    role: 'author',
  });

  const buildLoginPayload = (): LoginDto => ({
    email: 'jane@example.com',
    password: 'StrongPass1!',
  });

  it('returns 409 conflict when email already exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing-user-id' });

    await expect(authService.signup(buildSignupPayload())).rejects.toEqual(
      expect.objectContaining({
        response: {
          Success: false,
          Errors: ['Email already exists.'],
        },
        status: 409,
      }),
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('hashes password and creates a new user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    let capturedCreateArgs: unknown;
    prisma.user.create.mockImplementation((args: unknown) => {
      capturedCreateArgs = args;

      return Promise.resolve({
        id: 'new-user-id',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: UserRole.AUTHOR,
      });
    });

    const result = await authService.signup(buildSignupPayload());

    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    expect(capturedCreateArgs).toBeDefined();
    const createArgs = capturedCreateArgs as {
      data: { name: string; email: string; password: string; role: UserRole };
      select: { id: true; name: true; email: true; role: true };
    };
    const hashedPassword = createArgs.data.password;

    expect(createArgs.data.name).toBe('Jane Doe');
    expect(createArgs.data.email).toBe('jane@example.com');
    expect(createArgs.data.role).toBe(UserRole.AUTHOR);
    expect(createArgs.select).toEqual({
      id: true,
      name: true,
      email: true,
      role: true,
    });
    expect(hashedPassword).not.toBe('StrongPass1!');
    expect(await bcrypt.compare('StrongPass1!', hashedPassword)).toBe(true);
    expect(result).toEqual({
      Success: true,
      Data: {
        id: 'new-user-id',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'author',
      },
    });
  });

  it('maps prisma unique violations to conflict response', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      authService.signup(buildSignupPayload()),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns 500 for unexpected persistence failures', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockRejectedValue(new Error('database unavailable'));

    await expect(
      authService.signup(buildSignupPayload()),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('returns 401 when user email does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(authService.login(buildLoginPayload())).rejects.toEqual(
      expect.objectContaining({
        response: {
          Success: false,
          Errors: ['Invalid email or password.'],
        },
        status: 401,
      }),
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('returns 401 when password does not match', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      password: await bcrypt.hash('DifferentPass1!', 12),
      role: UserRole.AUTHOR,
    });

    await expect(authService.login(buildLoginPayload())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('returns JWT token when credentials are valid', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      password: await bcrypt.hash('StrongPass1!', 12),
      role: UserRole.AUTHOR,
    });
    jwtService.signAsync.mockResolvedValue('signed-jwt');

    const result = await authService.login(buildLoginPayload());

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-id',
      role: 'author',
    });
    expect(result).toEqual({
      Success: true,
      Data: {
        accessToken: 'signed-jwt',
      },
    });
  });

  it('returns 500 when token generation fails', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      password: await bcrypt.hash('StrongPass1!', 12),
      role: UserRole.READER,
    });
    jwtService.signAsync.mockRejectedValue(new Error('jwt failure'));

    await expect(authService.login(buildLoginPayload())).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
