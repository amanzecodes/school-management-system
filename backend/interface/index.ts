declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        regNo: string;
        firstName: string;
        lastName: string;
        role: import("../src/generated/prisma/index").$Enums.Role;
        password: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  }
}