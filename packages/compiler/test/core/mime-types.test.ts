import { deepStrictEqual, strictEqual } from "assert";
import { describe, it } from "vitest";
import { parseMimeType } from "../../src/core/mime-type.js";

describe("compiler: mime-type utils", () => {
  it("return undefined if invalid mime type", () => {
    strictEqual(parseMimeType("foo/bar/baz"), undefined);
  });

  it("parse simple mime types", () => {
    deepStrictEqual(parseMimeType("application/json"), { type: "application", subtype: "json" });
  });

  it("parse mime types with suffix", () => {
    deepStrictEqual(parseMimeType("application/merge-patch+json"), {
      type: "application",
      subtype: "merge-patch",
      suffix: "json",
    });
  });
});
