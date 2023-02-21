import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { LibraryLinterTestLibrary } from "../src/testing/index.js";

export async function createLibraryLinterTestHost() {
  return createTestHost({
    libraries: [LibraryLinterTestLibrary],
  });
}

export async function createLibraryLinterTestRunner() {
  const host = await createLibraryLinterTestHost();
  return createTestWrapper(host);
}
