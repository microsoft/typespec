import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { EventsTestLibrary } from "../src/testing/index.js";

export async function createEventsTestHost() {
  return createTestHost({
    libraries: [EventsTestLibrary],
  });
}

export async function createEventsTestRunner() {
  const host = await createEventsTestHost();
  return createTestWrapper(host, { autoUsings: ["TypeSpec.Events"] });
}
