import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";
import { BadRequestError, UnauthorizedError } from "../utils/appError.js";

const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const userExists = await prisma.user.findUnique({
    where: { email: email },
  });

  if (userExists) {
    throw new BadRequestError("User already exists with this email");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  const accessToken = generateAccessToken(user.id, res);
  await generateRefreshToken(user.id, res);

  res.status(201).json({
    status: "success",
    data: {
      user: {
        id: user.id,
        name: name,
        email: email,
        role: user.role,
      },
      token: accessToken,
    },
  });
};

const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const accessToken = generateAccessToken(user.id, res);
  await generateRefreshToken(user.id, res);

  res.status(201).json({
    status: "success",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: email,
        role: user.role,
      },
      token: accessToken,
    },
  });
};

const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new UnauthorizedError("No refresh token provided");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    if (storedToken) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    }

    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  const accessToken = generateAccessToken(storedToken.userId, res);
  await generateRefreshToken(storedToken.userId, res);

  res.status(200).json({
    status: "success",
    data: { token: accessToken },
  });
};

const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  res.cookie("accessToken", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.cookie("refreshToken", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};

const getMe = async (req: Request, res: Response) => {
  const user = req.user!;
  res.status(200).json({
    status: "success",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
};

export { register, login, logout, getMe, refresh };
