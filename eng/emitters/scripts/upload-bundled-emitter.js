// @ts-check
import { resolve } from "path";
import { bundleAndUploadStandalonePackage } from "../../../packages/bundle-uploader/dist/src/index.js";
import { repoRoot } from "../../common/scripts/helpers.js";

const packageRelativePath = process.argv[2];
if (!packageRelativePath) {
  // eslint-disable-next-line no-console
  console.error("Usage: node upload-bundled-emitter.js <package-path>");
  // eslint-disable-next-line no-console
  console.error("  e.g. node upload-bundled-emitter.js packages/http-client-csharp");
  process.exit(1);
}

// remove leading slash if exists, then resolve to absolute path
const packagePath = resolve(repoRoot, packageRelativePath.replace(/^\//, ""));

await bundleAndUploadStandalonePackage({ packagePath });
