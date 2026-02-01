// apps/api/src/main.ts
import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { config } from "./config/env.js";
import { logger } from "./config/logger";
import "dotenv/config";

const port = config.PORT || 3000;

logger.info(`Starting server on port ${port}...`);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    logger.info(`🚀 Server is running on http://localhost:${info.port}`);
  },
);
