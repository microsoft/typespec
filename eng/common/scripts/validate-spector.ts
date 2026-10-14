import { resolveNodeBin, runMain, runNode } from "./node-process.ts";
import { withSpectorServer } from "./spector-server.ts";

await runMain((signal) => {
  const spector = resolveNodeBin("@typespec/spector", "tsp-spector");
  return withSpectorServer(
    [spector, "serve", "./specs"],
    3000,
    (signal) => runNode([spector, "knock", "./specs"], signal),
    signal,
  );
});
