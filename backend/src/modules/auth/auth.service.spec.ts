import {
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';

type FindUniqueArgs = {
  where: { email: string };
  select: { id: true };
};

type CreateArgs = {
  data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  };
  select: {
    id: true;
    name: true;
    email: true;
    role: true;
  };
};

type CreatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type MockPrisma = {
  user: {
    findUnique: jest.Mock<Promise<{ id: string } | null>, [FindUniqueArgs]>;
    create: jest.Mock<Promise<CreatedUser>, [CreateArgs]>;
  };
};

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: MockPrisma;

  beforeEach(() => {
    const findUnique = jest.fn<
      Promise<{ id: string } | null>,
      [FindUniqueArgs]
    >();
    const create = jest.fn<Promise<CreatedUser>, [CreateArgs]>();

    prisma = {
      user: {
        findUnique,
        create,
      },
    };

    authService = new AuthService(prisma as unknown as PrismaService);
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
    let capturedCreateArgs: CreateArgs | undefined;
    prisma.user.create.mockImplementation((args: CreateArgs) => {
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
    const hashedPassword = capturedCreateArgs?.data.password ?? '';

    expect(capturedCreateArgs?.data.name).toBe('Jane Doe');
    expect(capturedCreateArgs?.data.email).toBe('jane@example.com');
    expect(capturedCreateArgs?.data.role).toBe(UserRole.AUTHOR);
    expect(capturedCreateArgs?.select).toEqual({
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
});
