import { spawn } from "child_process";
import { resolve } from "path";
import { MockApiApp } from "../app/app.js";
import { AdminUrls, SPECTOR_SERVER_ID } from "../constants.js";
import { logger } from "../logger.js";
import { ensureScenariosPathExists } from "../utils/index.js";

/** How long to wait for the background server to become reachable before giving up. */
const SERVER_START_TIMEOUT_MS = 120_000;
const SERVER_POLL_INTERVAL_MS = 250;
const HEALTH_REQUEST_TIMEOUT_MS = 2_000;

export interface ServeConfig {
  scenariosPath: string | string[];
  coverageFile: string;
  port: number;
}

export interface StopConfig {
  port: number;
}

export async function serve(config: ServeConfig) {
  if (Array.isArray(config.scenariosPath)) {
    for (let idx = 0; idx < config.scenariosPath.length; idx++) {
      config.scenariosPath[idx] = resolve(process.cwd(), config.scenariosPath[idx]);
      await ensureScenariosPathExists(config.scenariosPath[idx]);
    }
  } else {
    await ensureScenariosPathExists(config.scenariosPath);
  }

  const server = new MockApiApp({
    port: config.port,
    scenarioPath: config.scenariosPath,
    coverageFile: config.coverageFile,
  });
  await server.start();
}

export async function startInBackground(config: ServeConfig) {
  const [nodeExe, entrypoint] = process.argv;
  logger.info(`Starting server in background at port ${config.port}`);

  const existing = await getPortStatus(config.port);
  if (existing !== "free") {
    throw new Error(
      [
        `Cannot start the mock server: port ${config.port} is already in use by ${describePortStatus(existing)}.`,
        `Make sure no other process is using port ${config.port} or start the server on a different port with --port.`,
      ].join("\n"),
    );
  }

  const scenariosPath = Array.isArray(config.scenariosPath)
    ? config.scenariosPath
    : [config.scenariosPath];
  const cp = spawn(
    nodeExe,
    [
      entrypoint,
      "serve",
      ...scenariosPath,
      "--port",
      config.port.toString(),
      "--coverageFile",
      config.coverageFile,
    ],
    {
      detached: true,
      // Keep the child's stdio detached from this process so it survives once we exit. Startup
      // problems are surfaced by polling the health endpoint below instead.
      stdio: "ignore",
    },
  );

  let exitCode: number | null = null;
  cp.on("exit", (code) => (exitCode = code ?? 0));

  const deadline = Date.now() + SERVER_START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (exitCode !== null) {
      throw new Error(
        `Mock server exited with code ${exitCode} before it became ready. Run \`tsp-spector serve\` to see the failure.`,
      );
    }

    const status = await getPortStatus(config.port);
    if (status === "spector") {
      logger.info(`Started server with pid: ${cp.pid}`);
      cp.unref();
      return;
    }
    if (status === "other") {
      throw new Error(
        `Port ${config.port} was taken by ${describePortStatus(status)} while the mock server was starting.`,
      );
    }

    await delay(SERVER_POLL_INTERVAL_MS);
  }

  throw new Error(
    `Mock server did not become ready on port ${config.port} within ${SERVER_START_TIMEOUT_MS / 1000}s.`,
  );
}

export async function stop(config: StopConfig) {
  const status = await getPortStatus(config.port);
  if (status === "free") {
    logger.info(`No server running at port ${config.port}.`);
    return;
  }
  if (status === "other") {
    // Refuse to send the stop signal to a process we don't own, it could be an unrelated
    // server that happens to be listening on the same port.
    logger.warn(`Port ${config.port} is used by ${describePortStatus(status)}, not stopping it.`);
    return;
  }

  await fetch(`http://localhost:${config.port}${AdminUrls.stop}`, {
    method: "post",
  });

  logger.info(`Stopped server running at port  ${config.port}.`);
}

type PortStatus = "free" | "spector" | "other";

function describePortStatus(status: PortStatus): string {
  return status === "spector"
    ? "another tsp-spector mock server"
    : "a process that is not a tsp-spector mock server";
}

/** Check what, if anything, is currently serving on the given port. */
async function getPortStatus(port: number): Promise<PortStatus> {
  let response: Response;
  try {
    response = await fetch(`http://localhost:${port}${AdminUrls.health}`, {
      signal: AbortSignal.timeout(HEALTH_REQUEST_TIMEOUT_MS),
    });
  } catch {
    return "free";
  }

  if (!response.ok) {
    return "other";
  }

  try {
    const body = await response.json();
    return body?.server === SPECTOR_SERVER_ID ? "spector" : "other";
  } catch {
    return "other";
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
