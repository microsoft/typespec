import { describe, expect, it } from "vitest";
import {
  getServerPathPrefixSegmentCount,
  isMockApiUriConsistentWithRoute,
  normalizeMockApiUri,
} from "./route-utils.js";

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

describe("getServerPathPrefixSegmentCount", () => {
  it("returns 0 for an undefined server", () => {
    expect(getServerPathPrefixSegmentCount(undefined)).toBe(0);
  });

  it("returns 0 for the default localhost server", () => {
    expect(getServerPathPrefixSegmentCount("http://localhost:3000")).toBe(0);
  });

  it("returns 0 for a bare host server (e.g. ARM)", () => {
    expect(getServerPathPrefixSegmentCount("https://management.azure.com")).toBe(0);
  });

  it("counts the path segments after an {endpoint} template", () => {
    expect(
      getServerPathPrefixSegmentCount(
        "{endpoint}/resiliency/service-driven/client:v2/service:{serviceDeploymentVersion}/api-version:{apiVersion}",
      ),
    ).toBe(5);
  });

  it("counts the path segments after localhost:3000", () => {
    expect(getServerPathPrefixSegmentCount("http://localhost:3000/my/prefix")).toBe(2);
  });
});

describe("isMockApiUriConsistentWithRoute", () => {
  it("matches identical routes", () => {
    expect(
      isMockApiUriConsistentWithRoute("/parameters/basic/simple", "/parameters/basic/simple"),
    ).toBe(true);
  });

  it("detects a mismatch in a literal segment", () => {
    // Regression test for the dollar-sign scenario mismatch.
    expect(
      isMockApiUriConsistentWithRoute(
        "/parameters/query/special-char/dollarSign",
        "/parameters/query/special-char/dollar-sign",
      ),
    ).toBe(false);
  });

  it("detects swapped routes", () => {
    expect(isMockApiUriConsistentWithRoute("/routes/fixed", "/routes/in-interface/fixed")).toBe(
      false,
    );
  });

  it("treats whole-segment template expressions as wildcards", () => {
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
    expect(
      isMockApiUriConsistentWithRoute(
        "/routes/path/path/standard/primitive{param}",
        "/routes/path/path/standard/primitive/a",
      ),
    ).toBe(true);
  });

  it("detects a uri that is missing a trailing literal segment present in the route", () => {
    expect(isMockApiUriConsistentWithRoute("/parameters/basic/simple", "/parameters/basic")).toBe(
      false,
    );
  });

  it("ignores trailing slashes", () => {
    expect(
      isMockApiUriConsistentWithRoute(
        "/azure/special-headers/x-ms-client-request-id/",
        "/azure/special-headers/x-ms-client-request-id",
      ),
    ).toBe(true);
  });

  it("ignores the query string of both the route and the uri", () => {
    expect(
      isMockApiUriConsistentWithRoute(
        "/routes/query/query-continuation/standard/primitive?fixed=true",
        "/routes/query/query-continuation/standard/primitive?fixed=true&param=a",
      ),
    ).toBe(true);
  });

  it("matches routes containing escaped characters in the uri", () => {
    expect(
      isMockApiUriConsistentWithRoute(
        "/versioning/removed/api-version:{version}/v3",
        "/versioning/removed/api-version\\:v1/v3",
      ),
    ).toBe(true);
  });

  describe("with a server path prefix", () => {
    // Resiliency service-driven: the api-version/client/service version segments come from the
    // `@server` url and may legitimately differ from the mock uri (e.g. client:v1 vs client:v2).
    const serverPrefix = getServerPathPrefixSegmentCount(
      "{endpoint}/resiliency/service-driven/client:v2/service:{serviceDeploymentVersion}/api-version:{apiVersion}",
    );

    it("skips the server prefix segments before comparing", () => {
      expect(
        isMockApiUriConsistentWithRoute(
          "/add-optional-param/from-none",
          "/resiliency/service-driven/client\\:v1/service\\:v1/api-version\\:v1/add-optional-param/from-none",
          serverPrefix,
        ),
      ).toBe(true);
    });

    it("still detects a mismatch in the operation route after the server prefix", () => {
      expect(
        isMockApiUriConsistentWithRoute(
          "/add-optional-param/from-none",
          "/resiliency/service-driven/client\\:v2/service\\:v2/api-version\\:v2/add-operation",
          serverPrefix,
        ),
      ).toBe(false);
    });
  });

  describe("ARM routes", () => {
    it("matches a fully resolved ARM tracked resource route", () => {
      expect(
        isMockApiUriConsistentWithRoute(
          "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/{topLevelTrackedResourceName}",
          "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top",
        ),
      ).toBe(true);
    });

    it("matches an extension resource route whose {resourceUri} spans several scope segments", () => {
      const route =
        "/{resourceUri}/providers/Azure.ResourceManager.Resources/extensionsResources/{extensionsResourceName}";
      expect(
        isMockApiUriConsistentWithRoute(
          route,
          "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/extensionsResources/extension",
        ),
      ).toBe(true);
      expect(
        isMockApiUriConsistentWithRoute(
          route,
          "/providers/Azure.ResourceManager.Resources/extensionsResources/extension",
        ),
      ).toBe(true);
    });
  });
});
