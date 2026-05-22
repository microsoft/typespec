import { resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";

const baseTester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/http", "@typespec/rest", "@typespec/openapi"],
});

export const Tester = baseTester.importLibraries().using("OpenAPI");

/**
 * Plain tester without auto-prepended imports, for use in position-sensitive tests.
 * Tests using this tester must include all necessary imports manually.
 */
export const PlainTester = baseTester;
