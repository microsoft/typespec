import {
  createTestHost,
  TestHost as BaseTestHost,
} from "@cadl-lang/compiler/dist/test/test-host.js";
import { resolve } from "path";
import { fileURLToPath } from "url";
export type TestHost = BaseTestHost;
export async function createVersioningTestHost() {
  const host = await createTestHost();
  const root = resolve(fileURLToPath(import.meta.url), "../../../");

  await host.addRealCadlFile(
    "./node_modules/versioning/package.json",
    resolve(root, "../versioning/package.json")
  );
  await host.addRealJsFile(
    "./node_modules/versioning/dist/src/versioning.js",
    resolve(root, "../versioning/dist/src/versioning.js")
  );
  await host.addRealCadlFile(
    "./node_modules/versioning/lib/versioning.cadl",
    resolve(root, "../versioning/lib/versioning.cadl")
  );

  return host;
}
