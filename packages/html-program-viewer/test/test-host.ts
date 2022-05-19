import { createTestHost, createTestWrapper } from "@cadl-lang/compiler/testing";
import { ProgramViewerTestLibrary } from "../src/testing/index.js";

export async function createOpenAPITestHost() {
  return createTestHost({
    libraries: [ProgramViewerTestLibrary],
  });
}

export async function createViewerTestRunner() {
  const host = await createOpenAPITestHost();
  return createTestWrapper(host, (code) => code, { emitters: ["@cadl-lang/html-program-viewer"] });
}
