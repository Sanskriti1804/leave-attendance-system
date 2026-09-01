import { createApp } from "./app.js";
import { env } from "./env.js";
import { logger } from "./logger.js";

const app = createApp();

app.listen(env.port, () => {
  logger.info({ port: env.port }, "API listening");
});
