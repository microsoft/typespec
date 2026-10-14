import { repoRoot } from "./helpers.ts";
import { resolveNodeBin, runMain, runParallel } from "./node-process.ts";

await runMain((signal) =>
  runParallel(
    [
      [resolveNodeBin("vite", "vite"), "build", "--watch", "--emptyOutDir", "false"],
      [
        resolveNodeBin("typescript-native", "tsc", repoRoot),
        "-p",
        "tsconfig.declaration.json",
        "--watch",
      ],
    ],
    signal,
    true,
  ),
);
