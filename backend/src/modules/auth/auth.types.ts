import type { UserRole as PrismaUserRole } from '../../generated/prisma/enums';

export interface ErrorResponse {
  Success: false;
  Errors: string[];
}

export interface SuccessResponse<TData> {
  Success: true;
  Data: TData;
}

export type SignupResponseRole = Lowercase<PrismaUserRole>;

export interface SignupResponseData {
  id: string;
  name: string;
  email: string;
  role: SignupResponseRole;
}
