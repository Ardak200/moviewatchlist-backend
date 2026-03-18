import express from "express";
import { prisma } from "../config/db.js";

const router = express.Router();

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

router.post("/", (req, res) => {
  res.json({ httpMethod: "post" });
});

router.put("/", (req, res) => {
  res.json({ httpMethod: "put" });
});

router.delete("/", (req, res) => {
  res.json({ httpMethod: "delete" });
});

export default router;
