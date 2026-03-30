import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";
import { UnauthorizedError } from "../utils/appError.js";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new UnauthorizedError("Not authorized, no token provided");
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!,
    ) as jwt.JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError("Not authorized, token failed");
  }
};
