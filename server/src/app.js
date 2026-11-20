import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

if (env.trustProxy > 0) {
  app.set("trust proxy", env.trustProxy);
}

app.use(requestLogger);
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrls,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);
app.use(express.json({ limit: "100kb" }));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;