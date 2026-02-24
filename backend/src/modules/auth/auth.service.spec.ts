import {
  ConflictException,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../generated/prisma/enums';
import { UsersRepository } from '../users/repositories/users.repository';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';

type CreatedUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

type MockUsersRepository = {
  findByEmail: jest.Mock<Promise<CreatedUser | null>, [string]>;
  create: jest.Mock<Promise<CreatedUser>, [unknown]>;
};

type MockJwtService = {
  signAsync: jest.Mock<Promise<string>, [unknown]>;
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersRepository: MockUsersRepository;
  let jwtService: MockJwtService;

  beforeEach(() => {
    const findByEmail = jest.fn<Promise<CreatedUser | null>, [string]>();
    const create = jest.fn<Promise<CreatedUser>, [unknown]>();
    const signAsync = jest.fn<Promise<string>, [unknown]>();

    usersRepository = {
      findByEmail,
      create,
    };
    jwtService = {
      signAsync,
    };

    authService = new AuthService(
      usersRepository as unknown as UsersRepository,
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
    role: 'Author',
  });

  const buildLoginPayload = (): LoginDto => ({
    email: 'jane@example.com',
    password: 'StrongPass1!',
  });

  it('returns 409 conflict when email already exists', async () => {
    usersRepository.findByEmail.mockResolvedValue({
      id: 'existing-user-id',
      name: 'Existing',
      email: 'jane@example.com',
      password: 'hash',
      role: UserRole.Author,
    });

    await expect(authService.signup(buildSignupPayload())).rejects.toEqual(
      expect.objectContaining({
        response: {
          Success: false,
          Message: 'Email already exists.',
          Object: null,
          Errors: ['Email already exists.'],
        },
        status: 409,
      }),
    );
    expect(usersRepository.create).not.toHaveBeenCalled();
  });

  it('hashes password and creates a new user', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    let capturedCreateArgs: unknown;
    usersRepository.create.mockImplementation((args: unknown) => {
      capturedCreateArgs = args;

      return Promise.resolve({
        id: 'new-user-id',
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'hashed-password',
        role: UserRole.Author,
      });
    });

    const result = await authService.signup(buildSignupPayload());

    expect(usersRepository.create).toHaveBeenCalledTimes(1);
    expect(capturedCreateArgs).toBeDefined();
    const createArgs = capturedCreateArgs as {
      name: string;
      email: string;
      password: string;
      role: UserRole;
    };
    const hashedPassword = createArgs.password;

    expect(createArgs.name).toBe('Jane Doe');
    expect(createArgs.email).toBe('jane@example.com');
    expect(createArgs.role).toBe(UserRole.Author);
    expect(hashedPassword).not.toBe('StrongPass1!');
    expect(await bcrypt.compare('StrongPass1!', hashedPassword)).toBe(true);
    expect(result).toEqual({
      Success: true,
      Message: 'User registered successfully.',
      Object: {
        id: 'new-user-id',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'Author',
      },
      Errors: null,
    });
  });

  it('maps prisma unique violations to conflict response', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      authService.signup(buildSignupPayload()),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns 500 for unexpected persistence failures', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.create.mockRejectedValue(new Error('database unavailable'));

    await expect(
      authService.signup(buildSignupPayload()),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('returns 401 when user email does not exist', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);

    await expect(authService.login(buildLoginPayload())).rejects.toEqual(
      expect.objectContaining({
        response: {
          Success: false,
          Message: 'Invalid email or password.',
          Object: null,
          Errors: ['Invalid email or password.'],
        },
        status: 401,
      }),
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('returns 401 when password does not match', async () => {
    usersRepository.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'jane@example.com',
      password: await bcrypt.hash('DifferentPass1!', 12),
      role: UserRole.Author,
    });

    await expect(authService.login(buildLoginPayload())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('returns JWT token when credentials are valid', async () => {
    usersRepository.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'jane@example.com',
      password: await bcrypt.hash('StrongPass1!', 12),
      role: UserRole.Author,
    });
    jwtService.signAsync.mockResolvedValue('signed-jwt');

    const result = await authService.login(buildLoginPayload());

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-id',
      role: 'Author',
    });
    expect(result).toEqual({
      Success: true,
      Message: 'Login successful.',
      Object: {
        accessToken: 'signed-jwt',
      },
      Errors: null,
    });
  });

  it('returns 500 when token generation fails', async () => {
    usersRepository.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'jane@example.com',
      password: await bcrypt.hash('StrongPass1!', 12),
      role: UserRole.Reader,
    });
    jwtService.signAsync.mockRejectedValue(new Error('jwt failure'));

    await expect(authService.login(buildLoginPayload())).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
