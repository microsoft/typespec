import { RequestExt } from "@typespec/spec-api";
import bodyParser from "body-parser";
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
        type: ["application/octet-stream", "image/png"],
        limit: "10mb",
        verify: rawBinaryBodySaver,
      }),
    );
    this.app.use(multer().any());
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
