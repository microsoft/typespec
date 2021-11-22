import express, { Express } from "express";
import { CompilerHost } from "./types.js";

export interface CadlDevServer {
  host: CompilerHost;
  app: Express.Application;
}

function startDevServer(): CadlDevServer {
  const app = express();

  app.listen(3000, () => {
    console.log("Started dev server");
  });
}
