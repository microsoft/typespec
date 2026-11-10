import { resolvePath } from "@typespec/compiler";
import { createTester, findTestPackageRoot } from "@typespec/compiler/testing";

export const packageRoot = await findTestPackageRoot(import.meta.url);

export const Tester = createTester(resolvePath(packageRoot), {
  libraries: ["@typespec/protobuf"],
});
