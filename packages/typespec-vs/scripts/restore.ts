// @ts-check
import { ensureDotnetVersion, runDotnet } from "@typespec/internal-build-utils";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

await ensureDotnetVersion({ exitWithSuccessInDevBuilds: true });
await runDotnet(["restore", "Microsoft.TypeSpec.VS.sln"], { cwd: pkgRoot });
