import { resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";

export const Tester = createTester(resolvePath((import.meta as any).dirname, ".."), {
  libraries: [],
});
