import { assert, describe, it } from "vitest";
import { parseHeaderValueParameters } from "../src/helpers/header.js";

describe("headers", () => {
  it("parses header values with parameters", () => {
    const { value, params } = parseHeaderValueParameters("text/html; charset=utf-8");

    assert.equal(value, "text/html");
    assert.equal(params.charset, "utf-8");
  });

  it("parses a header value with a quoted parameter", () => {
    const { value, params } = parseHeaderValueParameters('text/html; charset="utf-8"');

    assert.equal(value, "text/html");
    assert.equal(params.charset, "utf-8");
  });

  it("parses a header value with multiple parameters", () => {
    const { value, params } = parseHeaderValueParameters('text/html; charset="utf-8"; foo=bar');

    assert.equal(value, "text/html");
    assert.equal(params.charset, "utf-8");
    assert.equal(params.foo, "bar");
  });
});
