import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { ProgramViewerTestLibrary } from "../src/testing/index.js";

export async function createOpenAPITestHost() {
  return createTestHost({
    libraries: [ProgramViewerTestLibrary],
  });
}

export async function createViewerTestRunner() {
  const host = await createOpenAPITestHost();
  return createTestWrapper(host, {
    compilerOptions: {
      emitters: { "@typespec/html-program-viewer": {} },
    },
  });
}
