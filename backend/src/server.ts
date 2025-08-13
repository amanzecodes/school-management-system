import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Request, Response } from "express";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import { testDatabaseConnection } from "./lib/database-test";

dotenv.config();

const PORT = process.env.PORT || 5000;
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};
const app = express();

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "UP" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Test database connection before starting server
async function startServer() {
  try {
    console.log("🚀 Starting server...");

    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.error("❌ Failed to connect to database. Server not started.");
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
