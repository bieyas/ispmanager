import type { JwtPayload } from "../modules/auth/auth.types.js";

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
      currentUser?: {
        id: string;
        username: string;
        fullName: string;
        role: {
          id: string;
          code: string;
          name: string;
        };
        permissions: string[];
      };
      currentCustomer?: {
        id: string;
        customerId: string;
        username: string;
        mustChangePassword: boolean;
        customer: {
          id: string;
          customerCode: string;
          fullName: string;
          phone: string;
          status: string;
        };
      };
    }
  }
}

export {};
