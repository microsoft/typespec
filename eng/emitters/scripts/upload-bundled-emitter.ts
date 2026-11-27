// @ts-check
import { parseArgs } from "node:util";
import { resolve } from "path";
import { bundleAndUploadStandalonePackage } from "../../../packages/bundle-uploader/dist/src/index.js";
import { repoRoot } from "../../common/scripts/helpers.ts";

const { values, positionals } = parseArgs({
  options: {
    overwrite: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

const packageRelativePath = positionals[0];
if (!packageRelativePath) {
  // eslint-disable-next-line no-console
  console.error("Usage: node upload-bundled-emitter.ts <package-path> [--overwrite]");
  // eslint-disable-next-line no-console
  console.error("  e.g. node upload-bundled-emitter.ts packages/http-client-csharp");
  process.exit(1);
}

// remove leading slash if exists, then resolve to absolute path
const packagePath = resolve(repoRoot, packageRelativePath.replace(/^\//, ""));

await bundleAndUploadStandalonePackage({ packagePath, overwrite: values.overwrite });
