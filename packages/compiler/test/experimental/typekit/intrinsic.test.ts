import { describe, expect, it } from "vitest";
import { $ } from "../../../src/experimental/typekit/index.js";
import { createContextMock } from "./utils.js";

describe("getters", () => {
  it("should match checker intrinsic types", async () => {
    const { program } = await createContextMock();
    const tk = $(program);
    expect(tk.intrinsic.any).toBe(program.checker.anyType);
    expect(tk.intrinsic.error).toBe(program.checker.errorType);
    expect(tk.intrinsic.never).toBe(program.checker.neverType);
    expect(tk.intrinsic.null).toBe(program.checker.nullType);
    expect(tk.intrinsic.void).toBe(program.checker.voidType);
  });
});
