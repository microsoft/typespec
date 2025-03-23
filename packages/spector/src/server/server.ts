import { RequestExt } from "@typespec/spec-api";
import bodyParser from "body-parser";
import { ChildProcess, spawn } from "child_process";
import { EventEmitter } from "events";
import express, { ErrorRequestHandler, RequestHandler, Response } from "express";
import { Server, ServerResponse } from "http";
import morgan from "morgan";
import multer from "multer";
import { logger } from "../logger.js";
import { cleanupBody } from "../utils/index.js";

export interface MockApiServerConfig {
  port: number;
}

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error("Error", err);

  const errResponse = err.toJSON
    ? err.toJSON()
    : err instanceof Error
      ? { name: err.name, message: err.message, stack: err.stack }
      : err;

  res.status(err.status || 500);
  res.contentType("application/json").send(errResponse).end();
};

const rawBodySaver = (
  req: RequestExt,
  res: ServerResponse,
  buf: Buffer,
  encoding: BufferEncoding,
) => {
  if (buf && buf.length) {
    req.rawBody = cleanupBody(buf.toString(encoding || "utf8"));
  }
};

const rawBinaryBodySaver = (
  req: RequestExt,
  res: ServerResponse,
  buf: Buffer,
  encoding: BufferEncoding,
) => {
  if (buf && buf.length) {
    req.rawBody = buf;
  }
};

const loggerstream = {
  write: (message: string) => logger.info(message),
};

export class MockApiServer {
  private app: express.Application;

  constructor(private config: MockApiServerConfig) {
    this.app = express();
    this.app.use(morgan("dev", { stream: loggerstream }));
    this.app.use(bodyParser.json({ verify: rawBodySaver, strict: false }));
    this.app.use(
      bodyParser.json({
        type: "application/merge-patch+json",
        verify: rawBodySaver,
        strict: false,
      }),
    );
    this.app.use(bodyParser.urlencoded({ verify: rawBodySaver, extended: true }));
    this.app.use(bodyParser.text({ type: "*/xml", verify: rawBodySaver }));
    this.app.use(bodyParser.text({ type: "*/pdf", verify: rawBodySaver }));
    this.app.use(bodyParser.text({ type: "text/plain" }));
    this.app.use(
      bodyParser.raw({
        type: ["application/octet-stream", "image/png", "application/jsonl"],
        limit: "10mb",
        verify: rawBinaryBodySaver,
      }),
    );
    this.app.use(multer().any() as any);
  }

  public use(route: string, ...handlers: RequestHandler[]): void {
    this.app.use(route, ...handlers);
  }

  public start(): void {
    this.app.use(errorHandler);

    const server = this.app.listen(this.config.port, () => {
      logger.info(`Started server on ${getAddress(server)}`);
    });
  }
}

export type ServerRequestHandler = (request: RequestExt, response: Response) => void;

const getAddress = (server: Server): string => {
  const address = server?.address();
  return typeof address === "string" ? "pipe " + address : "port " + address?.port;
};

interface ServerConfig {
  name: string;
  scaffoldCommand: string;
  startCommand: string;
  workingDirectory: string;
}

export class CustomServerManager extends EventEmitter {
  private serverProcess: ChildProcess | null = null;

  constructor(private config: ServerConfig) {
    super();
  }

  public async scaffold(): Promise<void> {
    logger.info(`Scaffolding ${this.config.name}...`);
    await this.executeCommand(this.config.scaffoldCommand);
    logger.info(`${this.config.name} scaffolding completed.`);
  }

  public start(): void {
    if (this.serverProcess) {
      logger.warn(`${this.config.name} is already running.`);
      return;
    }

    logger.info(`Starting ${this.config.name}...`);
    const [command, ...args] = this.config.startCommand.split(" ");
    this.serverProcess = spawn(command, args, {
      cwd: this.config.workingDirectory,
      stdio: "inherit",
    });

    this.serverProcess.on("close", (code) => {
      logger.info(`${this.config.name} exited with code ${code}`);
      this.serverProcess = null;
      this.emit("stopped", code);
    });

    this.emit("started");
  }

  public stop(): void {
    if (!this.serverProcess) {
      logger.warn(`${this.config.name} is not running.`);
      return;
    }

    logger.info(`Stopping ${this.config.name}...`);
    this.serverProcess.kill();
  }

  private executeCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(" ");
      const process = spawn(cmd, args, {
        cwd: this.config.workingDirectory,
        stdio: "inherit",
      });

      process.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command "${command}" exited with code ${code}`));
        }
      });
    });
  }
}
