import { createServer } from "net";

/**
 * Find a free port in the given range by randomly probing.
 */
export async function getFreePort(
  minPort: number,
  maxPort: number,
  tries: number = 100,
): Promise<number> {
  const min = Math.floor(minPort);
  const max = Math.floor(maxPort);
  if (tries <= 0) return min;
  const diff = Math.abs(max - min);
  const port = min + Math.floor(Math.random() * diff);
  const free = await checkPort(port);
  if (free) {
    return port;
  }
  return await getFreePort(min, max, tries - 1);
}

function checkPort(port: number, timeout: number = 100): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const server = createServer();
    server.on("error", () => {
      server.close();
      resolve(false);
    });
    server.listen(port, () => {
      setTimeout(() => {
        server.close();
        resolve(true);
      }, timeout);
    });
  });
}
