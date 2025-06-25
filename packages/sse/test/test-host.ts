import { resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";

export const Tester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/events", "@typespec/http", "@typespec/streams", "@typespec/sse"],
})
  .importLibraries()
  .using("Events", "SSE");
