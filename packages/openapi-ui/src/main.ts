import { CadlDevServer } from "@cadl-lang/compiler";
import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export function $onDevServer(server: CadlDevServer) {
  server.app.use(
    "/openapi-ui",
    express.static(join(dirname(fileURLToPath(import.meta.url)), "../../app"))
  );

  server.onCompiled(() => {
    // Later this can be used to notify ui to reload.
  });
}
