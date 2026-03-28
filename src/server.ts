import { config } from "dotenv";
import { connectDB, disconnectDB } from "./config/db.js";
import app from "./app.js";

config();
connectDB();

const port = Number(process.env.PORT) || 5001;
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on PORT ${process.env.PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);
  await disconnectDB();
  process.exit(1);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});
