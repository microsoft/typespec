import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runMain, runNode } from "../node-process.ts";
import { withSpectorServer } from "../spector-server.ts";

const [port, coverage] = process.argv.slice(2);
const server = fileURLToPath(new URL("./spector-server.ts", import.meta.url));

await runMain((signal) =>
  withSpectorServer(
    [server, port, coverage],
    Number(port),
    async (signal) => {
      writeFileSync(join(dirname(coverage), "started"), "ready");
      await runNode(["--eval", "setInterval(() => {}, 1000)"], signal);
    },
    signal,
  ),
);
