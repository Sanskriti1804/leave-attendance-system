/**
 * Loads the app in a fresh process so NODE_ENV and CORS_ORIGIN are read once.
 * Prints JSON: { status, allowOrigin, vary }.
 */
import { createApp } from "./src/app.js";

async function main() {
  const origin = process.argv[2] ?? "";
  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.on("listening", () => resolve()));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const headers: Record<string, string> = {};
  if (origin) headers.origin = origin;
  const res = await fetch(`http://127.0.0.1:${port}/health/health`, { headers });
  const body = {
    status: res.status,
    allowOrigin: res.headers.get("access-control-allow-origin"),
  };
  server.close();
  console.log(JSON.stringify(body));
}

main();
