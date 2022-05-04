import { bundleCadlLibrary } from "@cadl-lang/bundler";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(fileURLToPath(import.meta.url), "..", "..", "..");
const outputDir = join(root, "public", "libs");

async function bundleLibrary(name: string) {
  await bundleCadlLibrary(resolve(root, "node_modules", name), join(outputDir, `${name}.js`));
}

async function createBundles() {
  await bundleLibrary("@cadl-lang/compiler");
  await bundleLibrary("@cadl-lang/rest");
  await bundleLibrary("@cadl-lang/openapi");
  await bundleLibrary("@cadl-lang/versioning");
  await bundleLibrary("@cadl-lang/openapi3");
}

await createBundles();
