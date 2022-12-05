import {
  BasicTestRunner,
  createTestHost,
  createTestWrapper,
  TestHost,
} from "@cadl-lang/compiler/testing";
import { VersioningTestLibrary } from "../src/testing/index.js";

export async function createVersioningTestHost(): Promise<TestHost> {
  return createTestHost({
    libraries: [VersioningTestLibrary],
  });
}
export async function createVersioningTestRunner(): Promise<BasicTestRunner> {
  const host = await createVersioningTestHost();
  return createTestWrapper(host, { autoUsings: ["Cadl.Versioning"] });
}
