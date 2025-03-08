import { expect, it } from "vitest";

it("throw error if trying to import @typespec/compiler/internals", () => {
  expect(() => {
    import("@typespec/compiler/internals");
  }).toThrowError("Importing @typespec/compiler/internals is reserved for internal use only.");
});
