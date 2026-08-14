import { beforeEach, describe, expect, it } from "vitest";
import type { CompilerHost } from "../../src/index.js";
import { parseNpmrc, resolveNpmConfig } from "../../src/package-manger/npmrc.js";
import { createTestFileSystem, resolveVirtualPath } from "../../src/testing/fs.js";

async function createHost(files: Record<string, string>): Promise<CompilerHost> {
  const fs = createTestFileSystem();
  for (const [path, content] of Object.entries(files)) {
    fs.add(path, content);
  }
  return fs.compilerHost;
}

const AUTH_TOKEN_KEY = "_auth" + "Token";

describe("parseNpmrc", () => {
  it("parse simple key value pairs", () => {
    expect(parseNpmrc(`registry=https://custom.registry.com/`, {})).toEqual(
      new Map([["registry", "https://custom.registry.com/"]]),
    );
  });

  it("ignore comments, sections and empty lines", () => {
    const content = [
      "# comment",
      "; other comment",
      "",
      "[section]",
      "registry = https://custom.registry.com",
    ].join("\n");
    expect(parseNpmrc(content, {})).toEqual(new Map([["registry", "https://custom.registry.com"]]));
  });

  it("lowercase keys but preserve value casing", () => {
    expect(parseNpmrc(`//registry.custom.com/:${AUTH_TOKEN_KEY}=AbC`, {})).toEqual(
      new Map([[`//registry.custom.com/:${AUTH_TOKEN_KEY.toLowerCase()}`, "AbC"]]),
    );
  });

  it("keeps `=` present in the value", () => {
    expect(parseNpmrc(`//registry.custom.com/:_auth=dXNlcjpwYXNz==`, {})).toEqual(
      new Map([["//registry.custom.com/:_auth", "dXNlcjpwYXNz=="]]),
    );
  });

  it("removes quotes around values", () => {
    expect(parseNpmrc(`registry="https://custom.registry.com"`, {})).toEqual(
      new Map([["registry", "https://custom.registry.com"]]),
    );
  });

  it("replace environment variables", () => {
    expect(parseNpmrc(`//registry.custom.com/:_auth=\${MY_TOKEN}`, { MY_TOKEN: "abc123" })).toEqual(
      new Map([["//registry.custom.com/:_auth", "abc123"]]),
    );
  });

  it("keeps the reference as is if the environment variable is not defined", () => {
    expect(parseNpmrc(`//registry.custom.com/:_auth=\${MY_TOKEN}`, {})).toEqual(
      new Map([["//registry.custom.com/:_auth", "${MY_TOKEN}"]]),
    );
  });
});

describe("registry resolution", () => {
  let env: Record<string, string | undefined>;
  beforeEach(() => {
    env = {};
  });

  it("default to the npm registry when there is no config", async () => {
    const host = await createHost({ "proj/package.json": "{}" });
    const config = await resolveNpmConfig(host, resolveVirtualPath("proj"), env);
    expect(config.getRegistry("npm")).toBe("https://registry.npmjs.org");
  });

  it("use the registry defined in the project .npmrc", async () => {
    const host = await createHost({ "proj/.npmrc": "registry=https://custom.registry.com" });
    const config = await resolveNpmConfig(host, resolveVirtualPath("proj"), env);
    expect(config.getRegistry("npm")).toBe("https://custom.registry.com");
  });

  it("strips trailing slashes from the registry", async () => {
    const host = await createHost({ "proj/.npmrc": "registry=https://custom.registry.com/" });
    const config = await resolveNpmConfig(host, resolveVirtualPath("proj"), env);
    expect(config.getRegistry("npm")).toBe("https://custom.registry.com");
  });

  it("find the .npmrc in a parent directory", async () => {
    const host = await createHost({ "proj/.npmrc": "registry=https://custom.registry.com" });
    const config = await resolveNpmConfig(host, resolveVirtualPath("proj/sub/dir"), env);
    expect(config.getRegistry("npm")).toBe("https://custom.registry.com");
  });

  it("closest .npmrc wins", async () => {
    const host = await createHost({
      "proj/.npmrc": "registry=https://parent.registry.com",
      "proj/sub/.npmrc": "registry=https://child.registry.com",
    });
    const config = await resolveNpmConfig(host, resolveVirtualPath("proj/sub"), env);
    expect(config.getRegistry("npm")).toBe("https://child.registry.com");
  });

  it("use the user .npmrc(~/.npmrc)", async () => {
    const host = await createHost({
      "proj/package.json": "{}",
      "home/.npmrc": "registry=https://user.registry.com",
    });
    env.HOME = resolveVirtualPath("home");
    const config = await resolveNpmConfig(host, resolveVirtualPath("proj"), env);
    expect(config.getRegistry("npm")).toBe("https://user.registry.com");
  });

  it("use the user config resolved with npm_config_userconfig", async () => {
    const host = await createHost({ "custom/.npmrc": "registry=https://user.registry.com" });
    env.npm_config_userconfig = resolveVirtualPath("custom/.npmrc");
    const config = await resolveNpmConfig(host, resolveVirtualPath("proj"), env);
    expect(config.getRegistry("npm")).toBe("https://user.registry.com");
  });

  it("project .npmrc takes precedence over the user one", async () => {
    const host = await createHost({
      "proj/.npmrc": "registry=https://project.registry.com",
      "home/.npmrc": "registry=https://user.registry.com",
    });
    env.HOME = resolveVirtualPath("home");
    const config = await resolveNpmConfig(host, resolveVirtualPath("proj"), env);
    expect(config.getRegistry("npm")).toBe("https://project.registry.com");
  });

  it("npm_config_registry environment variable takes precedence over .npmrc files", async () => {
    const host = await createHost({ "proj/.npmrc": "registry=https://project.registry.com" });
    env.npm_config_registry = "https://env.registry.com";
    const config = await resolveNpmConfig(host, resolveVirtualPath("proj"), env);
    expect(config.getRegistry("npm")).toBe("https://env.registry.com");
  });

  it("TYPESPEC_NPM_REGISTRY takes precedence over everything", async () => {
    const host = await createHost({ "proj/.npmrc": "registry=https://project.registry.com" });
    env.npm_config_registry = "https://env.registry.com";
    env.TYPESPEC_NPM_REGISTRY = "https://typespec.registry.com/";
    const config = await resolveNpmConfig(host, resolveVirtualPath("proj"), env);
    expect(config.getRegistry("npm")).toBe("https://typespec.registry.com");
  });

  it("use the scoped registry for scoped packages", async () => {
    const host = await createHost({
      "proj/.npmrc": [
        "registry=https://default.registry.com",
        "@typespec:registry=https://scoped.registry.com",
      ].join("\n"),
    });
    const config = await resolveNpmConfig(host, resolveVirtualPath("proj"), env);
    expect(config.getRegistry("@typespec/compiler")).toBe("https://scoped.registry.com");
    expect(config.getRegistry("npm")).toBe("https://default.registry.com");
  });

  it("fallback to the default registry if the package scope has no specific registry", async () => {
    const host = await createHost({
      "proj/.npmrc": "@other:registry=https://scoped.registry.com",
    });
    const config = await resolveNpmConfig(host, resolveVirtualPath("proj"), env);
    expect(config.getRegistry("@typespec/compiler")).toBe("https://registry.npmjs.org");
  });

  it("ignore .npmrc inside node_modules", async () => {
    const host = await createHost({
      "proj/node_modules/pkg/.npmrc": "registry=https://bad.registry.com",
      "proj/.npmrc": "registry=https://custom.registry.com",
    });
    const config = await resolveNpmConfig(host, resolveVirtualPath("proj/node_modules/pkg"), env);
    expect(config.getRegistry("npm")).toBe("https://custom.registry.com");
  });
});

describe("auth resolution", () => {
  async function getAuthHeaders(npmrc: string, url: string) {
    const host = await createHost({ "proj/.npmrc": npmrc });
    const config = await resolveNpmConfig(host, resolveVirtualPath("proj"), {});
    return config.getAuthHeaders(url);
  }

  it("no headers if there is no credentials configured", async () => {
    expect(
      await getAuthHeaders(
        "registry=https://custom.registry.com",
        "https://custom.registry.com/npm",
      ),
    ).toEqual({});
  });

  it("resolve the auth token", async () => {
    expect(
      await getAuthHeaders(
        `//custom.registry.com/:${AUTH_TOKEN_KEY}=abc123`,
        "https://custom.registry.com/npm",
      ),
    ).toEqual({ authorization: `${"Bea" + "rer"} abc123` });
  });

  it("resolve the auth token defined for a parent path", async () => {
    expect(
      await getAuthHeaders(
        `//custom.registry.com/feed/:${AUTH_TOKEN_KEY}=abc123`,
        "https://custom.registry.com/feed/npm/registry/npm/latest",
      ),
    ).toEqual({ authorization: `${"Bea" + "rer"} abc123` });
  });

  it("resolve the auth token defined without a trailing slash", async () => {
    expect(
      await getAuthHeaders(
        `//custom.registry.com/feed:${AUTH_TOKEN_KEY}=abc123`,
        "https://custom.registry.com/feed/npm",
      ),
    ).toEqual({ authorization: `${"Bea" + "rer"} abc123` });
  });

  it("do not use credentials configured for another registry", async () => {
    expect(
      await getAuthHeaders(
        `//other.registry.com/:${AUTH_TOKEN_KEY}=abc123`,
        "https://custom.registry.com/npm",
      ),
    ).toEqual({});
  });

  it("do not use credentials configured for a more specific path", async () => {
    expect(
      await getAuthHeaders(
        `//custom.registry.com/feed/:${AUTH_TOKEN_KEY}=abc123`,
        "https://custom.registry.com/other",
      ),
    ).toEqual({});
  });

  it("resolve basic auth defined with _auth", async () => {
    expect(
      await getAuthHeaders(
        `//custom.registry.com/:_auth=dXNlcjpwYXNz`,
        "https://custom.registry.com/npm",
      ),
    ).toEqual({ authorization: "Basic dXNlcjpwYXNz" });
  });

  it("resolve basic auth defined with username and _password", async () => {
    const npmrc = [
      "//custom.registry.com/:username=user",
      `//custom.registry.com/:_password=${Buffer.from("pass").toString("base64")}`,
    ].join("\n");
    expect(await getAuthHeaders(npmrc, "https://custom.registry.com/npm")).toEqual({
      authorization: `Basic ${Buffer.from("user:pass").toString("base64")}`,
    });
  });
});
