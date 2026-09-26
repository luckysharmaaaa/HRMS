import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import config from "../config";
import { TokenPayload } from "../types";

/**
 * Generate Access Token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload as object, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as SignOptions);
};

/**
 * Generate Refresh Token
 */
export const generateRefreshToken = (payload: {
  userId: number;
  clientId?: number | null;
}): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as SignOptions);
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token: string): TokenPayload & JwtPayload => {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload & JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expired");
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }

    throw new Error("Token verification failed");
  }
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (
  token: string,
): {
  userId: number;
  clientId?: number | null;
} & JwtPayload => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as {
      userId: number;
    } & JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Refresh token expired");
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid refresh token");
    }

    throw new Error("Refresh token verification failed");
  }
};

/**
 * Generate Access + Refresh Token Pair
 */
export const generateTokenPair = (
  payload: TokenPayload,
): {
  accessToken: string;
  refreshToken: string;
} => {
  const accessToken = generateAccessToken(payload);

  const refreshToken = generateRefreshToken({
    userId: payload.userId,
    clientId: payload.clientId,
  });
  return {
    accessToken,
    refreshToken,
  };
};

/**
 * Decode Token (Without Verification)
 */
export const decodeToken = (token: string): JwtPayload | null => {
  return jwt.decode(token) as JwtPayload | null;
};
