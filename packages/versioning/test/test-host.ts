import { createTestHost, TestHost } from "@cadl-lang/compiler/testing";
import { VersioningTestLibrary } from "../src/testing/index.js";

export async function createVersioningTestHost(): Promise<TestHost> {
  return createTestHost({
    libraries: [VersioningTestLibrary],
  });
}
