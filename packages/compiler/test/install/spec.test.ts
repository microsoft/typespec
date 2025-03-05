import { describe, expect, it } from "vitest";
import { PackageJson } from "../../src/index.js";
import { PackageManagerSpecError, resolvePackageManagerSpec } from "../../src/install/spec.js";
import { createTestHost } from "../../src/testing/test-host.js";
import { resolveVirtualPath } from "../../src/testing/test-utils.js";

async function getPackageManagerSpecFor(cwd: string, packages: Record<string, PackageJson>) {
  const host = await createTestHost();
  for (const [path, content] of Object.entries(packages)) {
    host.addTypeSpecFile(path, JSON.stringify(content));
  }
  const tracer: any = { trace: () => {}, sub: () => tracer };
  return resolvePackageManagerSpec(host.compilerHost, tracer, resolveVirtualPath(cwd));
}

it("return no-package if no package.json is found", async () => {
  const result = await getPackageManagerSpecFor("/test", {});
  expect(result).toEqual({ kind: "no-package", path: "/test" });
});

it("return no-spec if package.json is missing packageManager field and devEngines", async () => {
  const result = await getPackageManagerSpecFor("/test", {
    "/test/package.json": { name: "test" },
  });
  expect(result).toEqual({ kind: "no-spec", path: "/test/package.json" });
});

it("resolve if packageManager is set", async () => {
  const result = await getPackageManagerSpecFor("/test", {
    "/test/package.json": { name: "test", packageManager: "npm@9.8.1" },
  });
  expect(result).toEqual({
    kind: "resolved",
    path: "/test/package.json",
    spec: {
      name: "npm",
      range: "9.8.1",
    },
  });
});

it("resolve hash configured in ", async () => {
  const result = await getPackageManagerSpecFor("/test", {
    "/test/package.json": {
      name: "test",
      packageManager:
        "npm@10.2.0+sha256.c362077587b1e782e5aef3dcf85826399ae552ad66b760e2585c4ac11102243f",
    },
  });
  expect(result).toEqual({
    kind: "resolved",
    path: "/test/package.json",
    spec: {
      name: "npm",
      range: "10.2.0",
      hash: {
        algorithm: "sha256",
        value: "c362077587b1e782e5aef3dcf85826399ae552ad66b760e2585c4ac11102243f",
      },
    },
  });
});

it("resolve if devEngines only is set", async () => {
  const result = await getPackageManagerSpecFor("/test", {
    "/test/package.json": {
      name: "test",
      devEngines: { packageManager: { name: "npm", version: "9.8.1" } },
    },
  });
  expect(result).toEqual({
    kind: "resolved",
    path: "/test/package.json",
    spec: {
      name: "npm",
      range: "9.8.1",
    },
  });
});

describe("invalid packageManager field", () => {
  it("throws error if does't contain the version", async () => {
    await expect(() =>
      getPackageManagerSpecFor("/test", {
        "/test/package.json": { name: "test", packageManager: "npm" },
      }),
    ).rejects.toThrowError(PackageManagerSpecError);
  });

  it("throws error if version is not semver", async () => {
    await expect(() =>
      getPackageManagerSpecFor("/test", {
        "/test/package.json": { name: "test", packageManager: "npm@bar" },
      }),
    ).rejects.toThrowError(PackageManagerSpecError);
  });

  it("throws error if not string", async () => {
    await expect(() =>
      getPackageManagerSpecFor("/test", {
        "/test/package.json": { name: "test", packageManager: 123 as any },
      }),
    ).rejects.toThrowError(PackageManagerSpecError);
  });

  it("throws error if trying to use url in version", async () => {
    await expect(() =>
      getPackageManagerSpecFor("/test", {
        "/test/package.json": {
          name: "test",
          packageManager: "npm@https://example.com/custom-npm.tgz",
        },
      }),
    ).rejects.toThrowError(PackageManagerSpecError);
  });
});

describe("invalid devEngines.packageManager field", () => {
  it("throws error if version is missing", async () => {
    await expect(() =>
      getPackageManagerSpecFor("/test", {
        "/test/package.json": {
          name: "test",
          devEngines: { packageManager: { name: "npm", version: null as any } },
        },
      }),
    ).rejects.toThrowError(PackageManagerSpecError);
  });
  it("throws error if version is not semver", async () => {
    await expect(() =>
      getPackageManagerSpecFor("/test", {
        "/test/package.json": {
          name: "test",
          devEngines: { packageManager: { name: "npm", version: "bar" } },
        },
      }),
    ).rejects.toThrowError(PackageManagerSpecError);
  });
});

describe("inconsistent devEngines and packageManager ", () => {
  it("throws error if does't contain the version", async () => {
    await expect(() =>
      getPackageManagerSpecFor("/test", {
        "/test/package.json": { name: "test", packageManager: "npm" },
      }),
    ).rejects.toThrowError(PackageManagerSpecError);
  });

  it("throws error if not string", async () => {
    await expect(() =>
      getPackageManagerSpecFor("/test", {
        "/test/package.json": { name: "test", packageManager: 123 as any },
      }),
    ).rejects.toThrowError(PackageManagerSpecError);
  });

  it("throws error if trying to use url in version", async () => {
    await expect(() =>
      getPackageManagerSpecFor("/test", {
        "/test/package.json": {
          name: "test",
          packageManager: "npm@https://example.com/custom-npm.tgz",
        },
      }),
    ).rejects.toThrowError(PackageManagerSpecError);
  });
});
