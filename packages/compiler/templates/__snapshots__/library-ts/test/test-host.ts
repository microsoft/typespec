import { resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";

export const Tester = createTester(resolvePath(import.meta.dirname, "../.."), {
  libraries: ["library-ts"],
}).import("library-ts");

