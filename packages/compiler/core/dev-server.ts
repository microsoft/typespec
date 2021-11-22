import express, { Express } from "express";
import { Server } from "http";
import { CompilerHost } from "./types.js";
import { NodeHost } from "./util.js";

export interface CadlDevServer {
  host: CompilerHost;
  app: Express;
  server: Server;
}

export function startDevServer(): CadlDevServer {
  const app = express();
  const outputs: Record<string, string> = {};

  app.get("/cadl-output/:file*", (req, res) => {
    const param = (req.params as any).file;
    const output = outputs[param];
    if (output === undefined) {
      console.log(`cannot find ${param} in outputs. [${Object.keys(outputs).join(",")}]`);
      return res.status(404).end();
    }
    return res.status(200).send(output).end();
  });
  const server = app.listen(3000, () => {
    console.log("Started dev server");
  });

  const host: CompilerHost = {
    ...NodeHost,
    writeFile: (path, content) => {
      outputs[path] = content;
      console.log("Write path", path);
      throw new Error("AVC");
      return NodeHost.writeFile(path, content);
    },
  };

  return {
    host,
    app,
    server,
  };
}
