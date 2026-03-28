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
  getMovies,
  updateMovie,
} from "../controllers/movieController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.use(authMiddleware);

// Get all movies
router.get("/", getMovies);

router.post(
  "/",
  upload.single("poster"),
  validateRequest(createMovieSchema),
  createMovie,
);

router.patch(
  "/:id",
  upload.single("poster"),
  validateRequest(updateMovieSchema),
  updateMovie,
);

router.delete("/:id", deleteMovie);

export default router;
