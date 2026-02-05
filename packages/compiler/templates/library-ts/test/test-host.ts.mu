import { resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";

export const Tester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["{{name}}"],
})
  .import("{{name}}")
  .using("{{#casing.pascalCase}}{{name}}{{/casing.pascalCase}}");

