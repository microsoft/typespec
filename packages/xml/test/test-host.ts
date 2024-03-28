import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { XmlTestLibrary } from "../src/testing/index.js";

export async function createXmlTestHost() {
  return createTestHost({
    libraries: [XmlTestLibrary],
  });
}
export async function createXmlTestRunner() {
  const host = await createXmlTestHost();
  return createTestWrapper(host, { autoUsings: ["TypeSpec.Xml"] });
}
