import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { ProgramViewerTestLibrary } from "../src/testing/index.js";

export async function createViewerTestHost() {
  return createTestHost({
    libraries: [ProgramViewerTestLibrary],
  });
}

export async function createViewerTestRunner() {
  const host = await createViewerTestHost();
  return createTestWrapper(host, {
    autoImports: [],
  });
}
