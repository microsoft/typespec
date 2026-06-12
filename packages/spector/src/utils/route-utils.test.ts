import { describe, expect, it } from "vitest";
import { isMockApiUriConsistentWithRoute, normalizeMockApiUri } from "./route-utils.js";

describe("normalizeMockApiUri", () => {
  it("drops the query string", () => {
    expect(normalizeMockApiUri("/foo/bar?baz=1")).toBe("/foo/bar");
  });

  it("removes backslash escapes", () => {
    expect(normalizeMockApiUri("/versioning/removed/api-version\\:v1/v3")).toBe(
      "/versioning/removed/api-version:v1/v3",
    );
  });
});

describe("isMockApiUriConsistentWithRoute", () => {
  it("matches identical routes", () => {
    expect(
      isMockApiUriConsistentWithRoute("/parameters/basic/simple", "/parameters/basic/simple"),
    ).toBe(true);
  });

  it("detects a mismatch in a literal segment", () => {
    // Regression test for the `$`-prefixed dollar-sign scenario mismatch.
    expect(
      isMockApiUriConsistentWithRoute(
        "/parameters/query/special-char/dollarSign",
        "/parameters/query/special-char/dollar-sign",
      ),
    ).toBe(false);
  });

  it("treats template expressions as wildcards", () => {
    expect(
      isMockApiUriConsistentWithRoute(
        "/routes/path/template-only/{param}",
        "/routes/path/template-only/a",
      ),
    ).toBe(true);
  });

  it("matches template expressions embedded in a segment", () => {
    expect(
      isMockApiUriConsistentWithRoute(
        "/routes/path/simple/standard/primitive{param}",
        "/routes/path/simple/standard/primitivea",
      ),
    ).toBe(true);
  });

  it("matches path expansion template expressions that expand to extra segments", () => {
    // `{/param}` expands with a leading slash, so the route template segment contains a `/`.
    expect(
      isMockApiUriConsistentWithRoute(
        "/routes/path/path/standard/record{/param}",
        "/routes/path/path/standard/record/a,1,b,2",
      ),
    ).toBe(true);
    expect(
      isMockApiUriConsistentWithRoute(
        "/routes/path/path/explode/array{/param*}",
        "/routes/path/path/explode/array/a/b",
      ),
    ).toBe(true);
  });

  it("allows the uri to have extra segments not present in the route template", () => {
    // `@path` annotated params, server-templated api-versions and reserved expansions are appended
    // to the uri but are not part of the route template.
    expect(
      isMockApiUriConsistentWithRoute(
        "/routes/path/annotation-only",
        "/routes/path/annotation-only/a",
      ),
    ).toBe(true);
    expect(
      isMockApiUriConsistentWithRoute(
        "/server/versions/versioned/with-path-api-version",
        "/server/versions/versioned/with-path-api-version/2022-12-01-preview",
      ),
    ).toBe(true);
  });

  it("detects a uri that is missing trailing segments present in the route template", () => {
    expect(
      isMockApiUriConsistentWithRoute(
        "/routes/path/template-only/{param}",
        "/routes/path/template-only",
      ),
    ).toBe(false);
    expect(isMockApiUriConsistentWithRoute("/parameters/basic/simple", "/parameters/basic")).toBe(
      false,
    );
  });

  it("matches routes containing escaped characters in the uri", () => {
    expect(
      isMockApiUriConsistentWithRoute(
        "/versioning/removed/api-version:{version}/v3",
        "/versioning/removed/api-version\\:v1/v3",
      ),
    ).toBe(true);
  });
});
