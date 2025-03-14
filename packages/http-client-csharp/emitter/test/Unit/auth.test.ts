vi.resetModules();

import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it, vi } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Test auth", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("cookie header is not supported", async () => {
    const program = await typeSpecCompile(
      `
            op test(): NoContentResponse;
      `,
      runner,
      {
        AuthDecorator: `@useAuth(ApiKeyAuth<ApiKeyLocation.cookie, "api-key-name">)`,
      },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const diagnostics = context.program.diagnostics;

    const noAuthDiagnostics = diagnostics.filter(
      (d) =>
        d.code === "@typespec/http-client-csharp/unsupported-auth" &&
        d.message?.includes(
          "Only header is supported for ApiKey authentication. cookie is not supported.",
        ),
    );
    strictEqual(noAuthDiagnostics.length, 1);

    const noSupportedAuthDiagnostics = diagnostics.filter(
      (d) =>
        d.code === "@typespec/http-client-csharp/unsupported-auth" &&
        d.message?.includes("No supported authentication methods were provided."),
    );
    strictEqual(noSupportedAuthDiagnostics.length, 1);
    ok(noSupportedAuthDiagnostics[0]);
    strictEqual(
      noSupportedAuthDiagnostics[0].message,
      `No supported authentication methods were provided. No public client constructors will be generated. Please provide your own custom constructor for client instantiation.`,
    );

    // auth was specified but it is not supported, so the known auth methods are undefined
    ok(root.Auth);
    strictEqual(root.Auth?.ApiKey, undefined);
    strictEqual(root.Auth?.OAuth2, undefined);
  });

  it("query header is not supported", async () => {
    const program = await typeSpecCompile(
      `
            op test(): NoContentResponse;
      `,
      runner,
      {
        AuthDecorator: `@useAuth(ApiKeyAuth<ApiKeyLocation.query, "api-key-name">)`,
      },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const diagnostics = context.program.diagnostics;

    const noAuthDiagnostics = diagnostics.filter(
      (d) =>
        d.code === "@typespec/http-client-csharp/unsupported-auth" &&
        d.message?.includes(
          "Only header is supported for ApiKey authentication. query is not supported.",
        ),
    );
    strictEqual(noAuthDiagnostics.length, 1);

    const noSupportedAuthDiagnostics = diagnostics.filter(
      (d) =>
        d.code === "@typespec/http-client-csharp/unsupported-auth" &&
        d.message?.includes("No supported authentication methods were provided."),
    );
    strictEqual(noSupportedAuthDiagnostics.length, 1);
    ok(noSupportedAuthDiagnostics[0]);
    strictEqual(
      noSupportedAuthDiagnostics[0].message,
      `No supported authentication methods were provided. No public client constructors will be generated. Please provide your own custom constructor for client instantiation.`,
    );

    // auth was specified but it is not supported, so the known auth methods are undefined
    ok(root.Auth);
    strictEqual(root.Auth?.ApiKey, undefined);
    strictEqual(root.Auth?.OAuth2, undefined);
  });

  it("query header and cookie header are not supported", async () => {
    const program = await typeSpecCompile(
      `
            op test(): NoContentResponse;
      `,
      runner,
      {
        AuthDecorator: `@useAuth(ApiKeyAuth<ApiKeyLocation.query, "api-key-name"> | ApiKeyAuth<ApiKeyLocation.cookie, "api-key-name">)`,
      },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const diagnostics = context.program.diagnostics;

    const noAuthDiagnostics = diagnostics.filter(
      (d) =>
        d.code === "@typespec/http-client-csharp/unsupported-auth" &&
        d.message?.includes("Only header is supported for ApiKey authentication."),
    );
    strictEqual(noAuthDiagnostics.length, 2);

    const noSupportedAuthDiagnostics = diagnostics.filter(
      (d) =>
        d.code === "@typespec/http-client-csharp/unsupported-auth" &&
        d.message?.includes("No supported authentication methods were provided."),
    );
    strictEqual(noSupportedAuthDiagnostics.length, 1);
    ok(noSupportedAuthDiagnostics[0]);
    strictEqual(
      noSupportedAuthDiagnostics[0].message,
      `No supported authentication methods were provided. No public client constructors will be generated. Please provide your own custom constructor for client instantiation.`,
    );

    // auth was specified but it is not supported, so the known auth methods are undefined
    ok(root.Auth);
    strictEqual(root.Auth?.ApiKey, undefined);
    strictEqual(root.Auth?.OAuth2, undefined);
  });

  it("apikey header auth", async () => {
    const program = await typeSpecCompile(
      `
            op test(): NoContentResponse;
      `,
      runner,
      {
        AuthDecorator: `@useAuth(ApiKeyAuth<ApiKeyLocation.header, "api-key-name">)`,
      },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const diagnostics = context.program.diagnostics;

    const noAuthDiagnostic = diagnostics.find(
      (d) => d.code === "@typespec/http-client-csharp/unsupported-auth",
    );
    strictEqual(noAuthDiagnostic, undefined);

    const noSupportedAuthDiagnostic = diagnostics.find(
      (d) => d.code === "@typespec/http-client-csharp/unsupported-auth",
    );
    strictEqual(noSupportedAuthDiagnostic, undefined);
    ok(root.Auth?.ApiKey);
    strictEqual(root.Auth?.OAuth2, undefined);
  });

  it("at least one supported auth", async () => {
    const program = await typeSpecCompile(
      `
        op test(): NoContentResponse;
      `,
      runner,
      {
        AuthDecorator: `@useAuth(ApiKeyAuth<ApiKeyLocation.query, "api-key-name"> | ApiKeyAuth<ApiKeyLocation.header, "api-key-name">)`,
      },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const diagnostics = context.program.diagnostics;

    const noAuthDiagnostics = diagnostics.filter(
      (d) => d.code === "@typespec/http-client-csharp/unsupported-auth",
    );
    strictEqual(noAuthDiagnostics.length, 1);
    strictEqual(
      noAuthDiagnostics[0].message,
      "Only header is supported for ApiKey authentication. query is not supported.",
    );

    const noSupportedAuthDiagnostic = diagnostics.find(
      (d) =>
        d.code === "@typespec/http-client-csharp/unsupported-auth" &&
        d.message?.includes("No supported authentication methods were provided."),
    );

    strictEqual(noSupportedAuthDiagnostic, undefined);
    ok(root.Auth?.ApiKey);
  });

  it("no auth", async () => {
    const program = await typeSpecCompile(
      `
            op test(): NoContentResponse;
      `,
      runner,
      {
        AuthDecorator: `@useAuth(NoAuth)`,
      },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const diagnostics = context.program.diagnostics;

    const noAuthDiagnostics = diagnostics.filter(
      (d) =>
        d.code === "@typespec/http-client-csharp/unsupported-auth" &&
        d.message?.includes("No supported authentication methods were provided."),
    );

    strictEqual(noAuthDiagnostics.length, 0);
    strictEqual(root.Auth, undefined);
  });
});
