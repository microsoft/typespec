import { getAnyExtensionFromPath, resolvePath } from "@cadl-lang/compiler";
import {
  CadlTestLibrary,
  findFilesFromPattern,
  resolveVirtualPath,
  StandardTestLibrary,
} from "@cadl-lang/compiler/testing";
import { OpenAPITestLibrary } from "@cadl-lang/openapi/testing";
import { OpenAPI3TestLibrary } from "@cadl-lang/openapi3/testing";
import { RestTestLibrary } from "@cadl-lang/rest/testing";
import { VersioningTestLibrary } from "@cadl-lang/versioning/testing";
import { readFile, writeFile } from "fs/promises";

const staticContents: Record<string, string> = {};

async function addCadlLibrary(testLibrary: CadlTestLibrary) {
  for (const { realDir, pattern, virtualPath } of testLibrary.files) {
    const lookupDir = resolvePath(testLibrary.packageRoot, realDir);
    const entries = await findFilesFromPattern(lookupDir, pattern);
    for (const entry of entries) {
      const fileRealPath = resolvePath(lookupDir, entry);
      const fileVirtualPath = resolveVirtualPath(virtualPath, entry).replace("Z:", "");
      switch (getAnyExtensionFromPath(fileRealPath)) {
        case ".cadl":
        case ".json":
          const contents = await readFile(fileRealPath, "utf-8");
          staticContents[fileVirtualPath] = contents;
          break;
        case ".js":
        case ".mjs":
          // TODO:
          break;
      }
    }
  }
}

async function load() {
  await addCadlLibrary(StandardTestLibrary);
  await addCadlLibrary(RestTestLibrary);
  await addCadlLibrary(VersioningTestLibrary);
  await addCadlLibrary(OpenAPITestLibrary);
  await addCadlLibrary(OpenAPI3TestLibrary);
  await writeFile("./dist-dev/cadlContents.json", JSON.stringify(staticContents));
}

await load();
