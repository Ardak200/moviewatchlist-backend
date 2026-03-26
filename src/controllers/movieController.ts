import type { Request, Response } from "express";

import { prisma } from "../config/db.js";

export const createMovie = async (req: Request, res: Response) => {
  const { title, ...rest } = req.body;
  const isExisting = await prisma.movie.findFirst({
    where: {
      title,
    },
  });

  if (isExisting) {
    return res
      .status(400)
      .json({ error: "Movie with this name already exists" });
  }

  await prisma.movie.create({
    data: { createdBy: req.user?.id, title, ...rest },
  });

  return res.status(200).json({ message: "shit" });
};

export const updateMovie = async (req: Request, res: Response) => {
  const id = req.params.id;

  const movie = await prisma.movie.findUnique({
    where: {
      id: id as string,
    },
  });

  if (!movie) return res.status(404).json({ error: "Movie not found" });

  if (req.user?.role === "Admin" || movie.createdBy === req.user?.id) {
    await prisma.movie.update({
      where: { id: id as string },
      data: {
        ...req.body,
      },
    });

    res.status(200).json({ message: "Successfully update the movie" });
  } else {
    res.status(403).json({ error: "No permission to update this movie" });
  }
};

export const deleteMovie = async (req: Request, res: Response) => {
  const id = req.params.id;

  const movie = await prisma.movie.findUnique({
    where: {
      id: id as string,
    },
  });

  if (!movie) return res.status(404).json({ error: "Movie not found" });

  if (req.user?.role === "Admin" || movie.createdBy === req.user?.id) {
    await prisma.movie.delete({
      where: { id: id as string },
    });

    res.status(200).json({ message: "Successfully deleted the movie" });
  } else {
    res.status(403).json({ error: "No permission to delete this movie" });
  }
};
