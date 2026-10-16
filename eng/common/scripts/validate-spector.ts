import { run } from "./run.ts";
import { withSpectorServer } from "./spector-server.ts";

await withSpectorServer(["./specs"], 3000, () => run("tsp-spector", ["knock", "./specs"]));
