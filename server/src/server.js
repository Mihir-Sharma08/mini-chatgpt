import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";

async function startServer() {
  try {
    await connectDB();

    app.listen(env.port, () => {
      console.log(`Server running at http://localhost:${env.port} (${env.nodeEnv})`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();