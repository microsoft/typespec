import { describe, expect, it } from "vitest";
import { $ } from "../../src/typekit/index.js";
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

describe("is", () => {
  it("should validate intrinsics", async () => {
    const { program } = await createContextMock();
    const tk = $(program);

    // All known intrinsics
    expect(tk.intrinsic.is(tk.intrinsic.any)).toBe(true);
    expect(tk.intrinsic.is(tk.intrinsic.error)).toBe(true);
    expect(tk.intrinsic.is(tk.intrinsic.never)).toBe(true);
    expect(tk.intrinsic.is(tk.intrinsic.null)).toBe(true);
    expect(tk.intrinsic.is(tk.intrinsic.void)).toBe(true);

    // Entities that are not intrinsics should fail
    expect(tk.intrinsic.is(tk.builtin.string)).toBe(false);
    expect(tk.intrinsic.is(tk.literal.create("test"))).toBe(false);
    expect(tk.intrinsic.is(tk.value.create("test"))).toBe(false);
  });
});
