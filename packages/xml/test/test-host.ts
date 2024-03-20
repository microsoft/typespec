import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { XmlTestLibrary } from "../src/testing/index.js";

export async function createOpenAPITestHost() {
  return createTestHost({
    libraries: [XmlTestLibrary],
  });
}
export async function createOpenAPITestRunner() {
  const host = await createOpenAPITestHost();
  return createTestWrapper(host, { autoUsings: ["TypeSpec.Xml"] });
}
