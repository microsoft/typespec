import { run } from "./run.ts";

const watchers = [
  run("vite", ["build", "--watch", "--emptyOutDir", "false"]),
  run("tsc", ["-p", "tsconfig.declaration.json", "--watch"]),
];
try {
  await Promise.race(watchers);
} finally {
  for (const watcher of watchers) watcher.kill();
  await Promise.allSettled(watchers);
}
