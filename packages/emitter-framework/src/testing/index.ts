import { resolvePath } from "@typespec/compiler";
import { createTestLibrary, type TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

/** @deprecated Use `createTester` from `@typespec/compiler/testing` instead */
// eslint-disable-next-line @typescript-eslint/no-deprecated
export const EmitterFrameworkTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/emitter-framework",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../"),
});

export * from "./scenario-test/index.js";
