import { spawn } from "child_process";
import fetch from "node-fetch";
import { MockApiApp } from "../app/app.js";
import { AdminUrls } from "../constants.js";
import { logger } from "../logger.js";
import { ensureScenariosPathExists } from "../utils/index.js";

export interface ServeConfig {
  scenariosPath: string;
  coverageFile: string;
  port: number;
}

export interface StopConfig {
  port: number;
}

export async function serve(config: ServeConfig) {
  await ensureScenariosPathExists(config.scenariosPath);

  const server = new MockApiApp({
    port: config.port,
    scenarioPath: config.scenariosPath,
    coverageFile: config.coverageFile,
  });
  await server.start();
}

export async function startInBackground(config: ServeConfig) {
  return new Promise<void>((resolve) => {
    const [nodeExe, entrypoint] = process.argv;
    logger.info(`Starting server in background at port ${config.port}`);
    const cp = spawn(
      nodeExe,
      [
        entrypoint,
        "serve",
        config.scenariosPath,
        "--port",
        config.port.toString(),
        "--coverageFile",
        config.coverageFile,
      ],
      {
        detached: true,
        stdio: "ignore",
      },
    );
    const exitListener = (exitCode: number) => {
      logger.error(`Server exited within 1s with exit code ${exitCode}`);
      process.exit(1);
    };
    cp.on("exit", exitListener);
    setTimeout(() => {
      cp.removeListener("exit", exitListener);
      logger.info(`Stated server with pid: ${cp.pid}`);
      cp.unref();
      resolve();
    }, 1000);
  });
}

export async function stop(config: StopConfig) {
  try {
    await fetch(`http://localhost:${config.port}${AdminUrls.stop}`, {
      method: "post",
    });

    logger.info(`Stopped server running at port  ${config.port}.`);
  } catch (e: any) {
    if (e.code === "ECONNREFUSED") {
      logger.info(`No server running at port ${config.port}.`);
    } else {
      throw e;
    }
  }
}
