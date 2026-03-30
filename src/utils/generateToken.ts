import jwt from "jsonwebtoken";
import { response, type Response } from "express";
import { prisma } from "../config/db.js";
import crypto from "crypto";

export const generateAccessToken = (userId: string, res: Response) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });

  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1000 * 60 * 15,
  });

  return token;
};

export const generateRefreshToken = async (
  userId: string,
  res: Response,
): Promise<string> => {
  const token = crypto.randomBytes(40).toString("hex");

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  return token;
};
