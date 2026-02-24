import type { UserRole as PrismaUserRole } from '../../generated/prisma/enums';

export interface ApiResponse<T> {
  Success: boolean;
  Message: string;
  Object: T | null;
  Errors: string[] | null;
}

export interface PaginatedResponse<T> {
  Success: boolean;
  Message: string;
  Object: T[];
  PageNumber: number;
  PageSize: number;
  TotalSize: number;
  Errors: null;
}

export type SignupResponseRole = PrismaUserRole;

export interface SignupResponseData {
  id: string;
  name: string;
  email: string;
  role: SignupResponseRole;
}

export interface LoginResponseData {
  accessToken: string;
}
