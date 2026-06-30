import { resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";

export const Tester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/versioning"],
  compilerOptions: {
    configFile: { features: ["declaration-expressions"] } as any,
  },
})
  .importLibraries()
  .using("Versioning");
