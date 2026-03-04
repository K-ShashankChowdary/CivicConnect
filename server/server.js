import "dotenv/config";
import app from "./app.js";
import connectDB from "./src/config/db.js";
import { initPriorityModel } from "./src/services/priorityService.js";
import mongoose from "mongoose";

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/municipal-complaints";

// handle synchronous unhandled exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception. Shutting down server.");
  console.error(err.name, err.message);
  process.exit(1);
});

const startServer = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB(MONGO_URI);
    console.log("MongoDB connected successfully");

    const server = app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });

    // handle asynchronous unhandled rejections
    process.on("unhandledRejection", (err) => {
      console.error("Unhandled Rejection. Shutting down server.");
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // graceful shutdown for termination signals
    const shutdown = () => {
      console.log("Shutdown signal received. Closing HTTP server and database connection.");
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log("MongoDB connection closed. Process exiting.");
          process.exit(0);
        });
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    // train AI model in background
    console.log("Training AI model in background...");
    initPriorityModel()
      .then(() => {
        console.log("AI model ready");
      })
      .catch((error) => {
        console.error("AI model training failed:", error.message);
        console.error("Server will continue running without AI predictions");
      });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();