import { resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";

export const StreamsTester = createTester(resolvePath(import.meta.dirname, "../.."), {
  libraries: ["@typespec/http", "@typespec/streams"],
})
  .import("@typespec/http", "@typespec/http/streams", "@typespec/streams")
  .using("TypeSpec.Http", "TypeSpec.Http.Streams", "TypeSpec.Streams");
