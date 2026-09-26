import {
  generateTokenPair,
  verifyRefreshToken,
} from "../utils/jwt";

import {
  hashPassword,
  comparePassword,
} from "../utils/password";

import {
  User,
  Role,
  TokenPayload,
} from "../types";

const authService = {
  /**
   * Hash password
   */
  hashPassword: async (password: string): Promise<string> => {
    return hashPassword(password);
  },

  /**
   * Compare plain password with hashed password
   */
  comparePassword: async (
    password: string,
    hashedPassword: string,
  ): Promise<boolean> => {
    return comparePassword(password, hashedPassword);
  },

  /**
   * Generate Access + Refresh Token Pair
   */
  generateTokens: (
    user: User,
    roles: Role[],
  ): {
    accessToken: string;
    refreshToken: string;
  } => {
    if (!roles.length) {
      throw new Error("No role assigned to this user");
    }

    const role = roles[0];

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      clientId: null,
      roleId: role.id,
      roleSlug: role.roleCode,
      level: 1,
    };

    return generateTokenPair(payload);
  },

  /**
   * Verify Refresh Token
   */
  verifyRefreshToken: (token: string) => {
    return verifyRefreshToken(token);
  },
};

export default authService;