import { exec } from "child_process";
import { cpSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { runPython3 } from "./run-python3.js";

// tsc does not copy non-TS assets. Copy Handlebars templates used by the TS
// code generation layer into the build output so they can be loaded at runtime.
function copyTemplates() {
  const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
  const copies = [
    {
      from: join(pkgRoot, "emitter", "src", "codegen", "enums", "templates"),
      to: join(pkgRoot, "dist", "emitter", "codegen", "enums", "templates"),
    },
  ];
  for (const { from, to } of copies) {
    mkdirSync(to, { recursive: true });
    cpSync(from, to, { recursive: true });
  }
}

async function main() {
  copyTemplates();
  await runPython3("./eng/scripts/setup/build_pygen_wheel.py");
  // remove the venv_build_wheel directory
  exec("rimraf ./venv_build_wheel", (error, stdout, _stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`); // eslint-disable-line no-console
      return;
    }
    console.log(`Command output:\n${stdout}`); // eslint-disable-line no-console
  });
}

main();
