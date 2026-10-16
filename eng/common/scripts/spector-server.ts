import { run } from "./run.ts";

export async function withSpectorServer(
  args: readonly string[],
  port: number,
  action: () => Promise<unknown>,
): Promise<void> {
  await run("tsp-spector", ["server", "start", ...args, "--port", String(port)]);
  const stop = () => run("tsp-spector", ["server", "stop", "--port", String(port)]);
  const interrupt = () => void stop().then(() => process.exit(130));
  const terminate = () => void stop().then(() => process.exit(143));
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", terminate);
  try {
    await action();
  } finally {
    await stop();
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", terminate);
  }
}
