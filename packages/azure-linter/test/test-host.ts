import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { AzureLinterTestLibrary } from "../src/testing/index.js";

export async function createAzureLinterTestHost() {
  return createTestHost({
    libraries: [AzureLinterTestLibrary],
  });
}

export async function createAzureLinterTestRunner() {
  const host = await createAzureLinterTestHost();

  return createTestWrapper(host, {
    autoUsings: ["AzureLinter"],
  });
}
