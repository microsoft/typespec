import { CadlDevServer } from "@cadl-lang/compiler";
import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export function $onDevServer(server: CadlDevServer) {
  server.app.use(express.static(join(dirname(fileURLToPath(import.meta.url)), "../../app")));
}
