import type { Request, Response } from "express";

import { prisma } from "../config/db.js";
import {
  createMovieType,
  getMoviesQuerySchema,
  updateMovieType,
} from "../validators/movieValidators.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/appError.js";
import { redis } from "../config/redis.js";

export const getMovies = async (req: Request, res: Response) => {
  const query = getMoviesQuerySchema.parse(req.query);

  const { page, limit, sortBy, sortOrder, genre, search } = query;

  const cacheKey = `movies:${JSON.stringify(query)}`;

  const cached = await redis.get(cacheKey);

  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const skip = (page - 1) * limit;

  const where = {
    ...(genre && { genres: { has: genre } }),
    ...(search && {
      title: { contains: search, mode: "insensitive" as const },
    }),
  };

  const [movies, total] = await Promise.all([
    prisma.movie.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.movie.count({ where }),
  ]);

  const response = {
    data: movies,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };

  await redis.set(cacheKey, JSON.stringify(response), "EX", 60);

  res.json(response);
};

const clearMovieCache = async () => {
  const keys = await redis.keys("movies:*");
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

export const createMovie = async (
  req: Request<{}, {}, createMovieType>,
  res: Response,
) => {
  const { title, overview, genres, posterUrl: _bodyPoster } = req.body;
  const releaseYear = Number(req.body.releaseYear);
  const runtime = req.body.runtime ? Number(req.body.runtime) : undefined;

  const posterUrl = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    : req.body.posterUrl;

  const isExisting = await prisma.movie.findFirst({
    where: {
      title,
    },
  });

  if (isExisting) {
    throw new BadRequestError("Movie with this name already exists");
  }

  await prisma.movie.create({
    data: {
      overview,
      genres,
      releaseYear,
      runtime,
      createdBy: req.user!.id,
      title,
      posterUrl,
    },
  });
  await clearMovieCache();

  return res.status(200).json({ message: "shit" });
};

export const updateMovie = async (
  req: Request<{ id: string }, {}, updateMovieType>,
  res: Response,
) => {
  const id = req.params.id;

  const { title, overview, genres, posterUrl: _bodyPoster } = req.body;
  const releaseYear = Number(req.body.releaseYear);
  const runtime = req.body.runtime ? Number(req.body.runtime) : undefined;

  const posterUrl = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    : req.body.posterUrl;

  const movie = await prisma.movie.findUnique({
    where: {
      id: id as string,
    },
  });

  if (!movie) throw new NotFoundError("Movie not found");

  if (req.user?.role === "Admin" || movie.createdBy === req.user?.id) {
    await prisma.movie.update({
      where: { id: id as string },
      data: {
        title,
        overview,
        genres,
        releaseYear,
        runtime,
        posterUrl,
      },
    });
    await clearMovieCache();

    res.status(200).json({ message: "Successfully update the movie" });
  } else {
    throw new ForbiddenError("No permission to update this movie");
  }
};

export const deleteMovie = async (req: Request, res: Response) => {
  const id = req.params.id;

  const movie = await prisma.movie.findUnique({
    where: {
      id: id as string,
    },
  });

  if (!movie) throw new NotFoundError("Movie not found");

  if (req.user?.role === "Admin" || movie.createdBy === req.user?.id) {
    await prisma.movie.delete({
      where: { id: id as string },
    });
    await clearMovieCache();

    res.status(200).json({ message: "Successfully deleted the movie" });
  } else {
    throw new ForbiddenError("No permission to delete this movie");
  }
};
