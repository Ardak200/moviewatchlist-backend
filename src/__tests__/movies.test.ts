import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../app.js";
import { prismaMock } from "../config/__mocks__/prismaMock.js";

vi.mock("../config/db.js");

const fakeMovies = [
  {
    id: "1",
    title: "Inception",
    overview: "A mind-bending thriller",
    genres: ["Action", "Sci-Fi"],
    releaseYear: 2010,
    rating: null,
    runtime: 148,
    posterUrl: null,
    createdBy: "user1",
    createdAt: new Date(),
  },
  {
    id: "2",
    title: "The Dark Knight",
    overview: "Batman vs Joker",
    genres: ["Action"],
    releaseYear: 2008,
    rating: null,
    runtime: 152,
    posterUrl: null,
    createdBy: "user1",
    createdAt: new Date(),
  },
];

vi.mock("../middleware/authMiddleware.js", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: "user1", role: "User" };
    next();
  },
}));

describe("GET /movies", () => {
  it("should return paginated movies with meta", async () => {
    prismaMock.movie.findMany.mockResolvedValue(fakeMovies);
    prismaMock.movie.count.mockResolvedValue(2);

    const res = await request(app).get("/movies");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toEqual({
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it("should respect page and limit params", async () => {
    prismaMock.movie.findMany.mockResolvedValue([fakeMovies[0]]);
    prismaMock.movie.count.mockResolvedValue(2);

    const res = await request(app).get("/movies?page=1&limit=1");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.totalPages).toBe(2);
  });

  it("should return 400 for invalid sortBy value", async () => {
    const res = await request(app).get("/movies?sortBy=invalidField");

    expect(res.status).toBe(400);
  });

  it("should filter by genre", async () => {
    prismaMock.movie.findMany.mockResolvedValue([fakeMovies[1]]);
    prismaMock.movie.count.mockResolvedValue(1);

    const res = await request(app).get("/movies?genre=Action");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});
