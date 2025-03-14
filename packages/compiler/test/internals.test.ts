import { expect, it } from "vitest";

it("throw error if trying to import @typespec/compiler/internals", async () => {
  await expect(() => import("@typespec/compiler/internals")).rejects.toThrowError(
    "Importing @typespec/compiler/internals is reserved for internal use only.",
  );
});
