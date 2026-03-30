import { Prisma } from "@prisma/client";
import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

interface AppError extends Error {
  statusCode?: number;
  status?: string;
  code?: string;
  meta?: { target?: string[] };
}

const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error: AppError = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message;

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid data provided";
  }

  // Handle Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const field = (err.meta?.target as string[] | undefined)?.[0] || "field";
      statusCode = 400;
      message = `${field} already exists`;
    }
    if (err.code === "P2025") {
      statusCode = 404;
      message = "Record not found";
    }
    if (err.code === "P2003") {
      statusCode = 400;
      message = "Invalid reference: related record does not exist";
    }
  }

  if (err instanceof ZodError || err.name === "ZodError") {
    const zodErr = err as unknown as ZodError;
    statusCode = 400;
    message = zodErr.issues.map((e) => e.message).join(", ");
  }

  res.status(statusCode).json({
    status: err.status || "error",
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export { notFound, errorHandler };
