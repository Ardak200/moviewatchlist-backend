import { z } from "zod";

const getMoviesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["createdAt", "releaseYear", "title"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  genre: z.string().optional(),
  search: z.string().optional(),
});

export type GetMoviesQueryType = z.infer<typeof getMoviesQuerySchema>;
export { getMoviesQuerySchema };

const createMovieSchema = z.object({
  title: z.string().trim().min(1, "Movie title is required"),
  releaseYear: z.coerce
    .number()
    .int("Release year must be an integer")
    .min(1888, "Release year must be a valid year")
    .max(new Date().getFullYear() + 10, "Release year must be a valid year"),
  overview: z.string().trim().optional(),
  genres: z
    .array(z.string(), { message: "All genres must be strings" })
    .optional(),
  runtime: z.coerce
    .number()
    .int("Runtime must be an integer")
    .positive("Runtime must be a positive number (in minutes)")
    .optional(),
  posterUrl: z.string().url("Poster URL must be a valid URL").optional(),
});

const updateMovieSchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty").optional(),
  releaseYear: z.coerce
    .number()
    .int("Release year must be an integer")
    .min(1888, "Release year must be a valid year")
    .max(new Date().getFullYear() + 10, "Release year must be a valid year")
    .optional(),
  overview: z.string().trim().optional(),
  genres: z
    .array(z.string(), { message: "All genres must be strings" })
    .optional(),
  runtime: z.coerce
    .number()
    .int("Runtime must be an integer")
    .positive("Runtime must be a positive number (in minutes)")
    .optional(),
  posterUrl: z.string().url("Poster URL must be a valid URL").optional(),
});

export type createMovieType = z.infer<typeof createMovieSchema>;
export type updateMovieType = z.infer<typeof updateMovieSchema>;

export { createMovieSchema, updateMovieSchema };
