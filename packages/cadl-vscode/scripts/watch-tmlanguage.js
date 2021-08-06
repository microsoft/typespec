import watch from "watch";
import { runWatch } from "../../../eng/scripts/helpers.js";
import { resolve } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const script = resolve("dist-dev/tmlanguage.js");

async function regenerate() {
  // For perf, we don't want to shell out to a new process every build and we
  // particularly want to avoid reinitialzing onigasm, which is relatively slow.
  // So we purge the script from the require cache and re-run it with changes
  // in-proc.
  delete require.cache[script];
  await require(script).main();
}

runWatch(watch, "dist-dev", regenerate, {
  // This filter doesn't do as much as one might hope because tsc writes out all
  // the files on recompilation. So tmlanguage.js changes when other .ts files
  // in cadl-vscode change but tmlanguage.ts has not changed. We could check the
  // tmlanguage.ts timestamp to fix it, but it didn't seem worth the complexity.
  // We can't just watch tmlanguage.ts because we need to wait for tsc to
  // compile it.
  filter: (file) => file === script,
});
