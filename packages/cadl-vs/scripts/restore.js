// @ts-check
import { runDotnetOrExit } from "@cadl-lang/internal-build-utils";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

await runDotnetOrExit(["restore", "Microsoft.Cadl.VS.sln"], { cwd: pkgRoot });
