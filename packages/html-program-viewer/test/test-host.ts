import { createTestHost, createTestWrapper } from "@cadl-lang/compiler/testing";
import { RestTestLibrary } from "@cadl-lang/rest/testing";
import { ProgramViewerTestLibrary } from "../src/testing/index.js";

export async function createOpenAPITestHost() {
  return createTestHost({
    libraries: [RestTestLibrary, ProgramViewerTestLibrary],
  });
}

export async function createViewerTestRunner() {
  const host = await createOpenAPITestHost();
  return createTestWrapper(
    host,
    (code) => `import "@cadl-lang/rest"; using Cadl.Rest; using Cadl.Http;${code}`,
    { emitters: ["@cadl-lang/html-program-viewer"] }
  );
}
