import * as http from "node:http";
import { assert, describe, it } from "vitest";
import {
  formatContentDispositionAttachment,
  parseHeaderValueParameters,
} from "../src/helpers/header.js";

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

  it("formats attachment filenames without invalid header characters", () => {
    const headerValue = formatContentDispositionAttachment("bad\r\nX-Test: yup\0.zip");
    const response = new http.ServerResponse({ method: "GET" } as any);

    assert.doesNotThrow(() => {
      response.setHeader("content-disposition", headerValue);
    });
    assert.notMatch(headerValue, /[\r\n\0]/);
  });

  it("escapes quotes and backslashes in attachment filenames", () => {
    assert.equal(
      formatContentDispositionAttachment('quote"slash\\semi;name.zip'),
      'attachment; filename="quote\\"slash\\\\semi;name.zip"',
    );
  });
});
