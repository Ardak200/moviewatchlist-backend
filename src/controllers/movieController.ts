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
