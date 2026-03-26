import express from "express";
import { prisma } from "../config/db.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createMovieSchema,
  updateMovieSchema,
} from "../validators/movieValidators.js";
import {
  createMovie,
  deleteMovie,
  updateMovie,
} from "../controllers/movieController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// Get all movies
router.get("/", async (req, res) => {
  try {
    const movies = await prisma.movie.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(movies);
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

router.post("/", validateRequest(createMovieSchema), createMovie);

router.patch("/:id", validateRequest(updateMovieSchema), updateMovie);

router.delete("/:id", deleteMovie);

export default router;
