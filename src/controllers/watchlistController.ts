import type { Request, Response } from "express";
import type { WatchlistStatus } from "@prisma/client";
import { prisma } from "../config/db.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/appError.js";

const getWatchlist = async (req: Request, res: Response) => {
  const watchlist = await prisma.watchlistItem.findMany({
    where: { userId: req.user!.id },
    include: { movie: true },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    status: "success",
    data: { watchlist },
  });
};

const addToWatchlist = async (req: Request, res: Response) => {
  const { movieId, status, rating, notes } = req.body;

  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
  });

  if (!movie) {
    throw new NotFoundError("Movie not found");
  }

  const existingInWatchlist = await prisma.watchlistItem.findUnique({
    where: {
      userId_movieId: {
        userId: req.user!.id,
        movieId: movieId,
      },
    },
  });

  if (existingInWatchlist) {
    throw new BadRequestError("Movie already in the watchlist");
  }

  const watchlistItem = await prisma.watchlistItem.create({
    data: {
      userId: req.user!.id,
      movieId,
      status: status || "PLANNED",
      rating,
      notes,
    },
  });

  res.status(201).json({
    status: "Success",
    data: {
      watchlistItem,
    },
  });
};

const updateWatchlistItem = async (req: Request, res: Response) => {
  const { status, rating, notes } = req.body;
  const id = req.params.id as string;

  const watchlistItem = await prisma.watchlistItem.findUnique({
    where: { id },
  });

  if (!watchlistItem) {
    throw new NotFoundError("Watchlist item not found");
  }

  if (watchlistItem.userId !== req.user!.id) {
    throw new ForbiddenError("Not allowed to update this watchlist item");
  }

  const updateData: {
    status?: WatchlistStatus;
    rating?: number;
    notes?: string;
  } = {};
  if (status !== undefined)
    updateData.status = status.toUpperCase() as WatchlistStatus;
  if (rating !== undefined) updateData.rating = rating;
  if (notes !== undefined) updateData.notes = notes;

  const updatedItem = await prisma.watchlistItem.update({
    where: { id },
    data: updateData,
  });

  res.status(200).json({
    status: "success",
    data: {
      watchlistItem: updatedItem,
    },
  });
};

const removeFromWatchlist = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const watchlistItem = await prisma.watchlistItem.findUnique({
    where: { id },
  });

  if (!watchlistItem) {
    throw new NotFoundError("Watchlist item not found");
  }

  if (watchlistItem.userId !== req.user!.id) {
    throw new ForbiddenError("Not allowed to update this watchlist item");
  }

  await prisma.watchlistItem.delete({
    where: { id },
  });

  res.status(200).json({
    status: "success",
    message: "Movie removed from watchlist",
  });
};

export {
  getWatchlist,
  addToWatchlist,
  updateWatchlistItem,
  removeFromWatchlist,
};
