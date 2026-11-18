import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");

app.use(requestLogger);
app.use(cors({ origin: env.clientUrl }));
app.use(express.json({ limit: "100kb" }));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;