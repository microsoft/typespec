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
    ok(root.auth);
    strictEqual(root.auth?.apiKey, undefined);
    strictEqual(root.auth?.oAuth2, undefined);
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
    ok(root.auth);
    strictEqual(root.auth?.apiKey, undefined);
    strictEqual(root.auth?.oAuth2, undefined);
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
    ok(root.auth);
    strictEqual(root.auth?.apiKey, undefined);
    strictEqual(root.auth?.oAuth2, undefined);
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
    ok(root.auth?.apiKey);
    strictEqual(root.auth?.oAuth2, undefined);
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
    ok(root.auth?.apiKey);
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
    strictEqual(root.auth, undefined);
  });

  it("oauth2 authorization code flow", async () => {
    const program = await typeSpecCompile(
      `
        op test(): NoContentResponse;
      `,
      runner,
      {
        AuthDecorator: `@useAuth(OAuth2Auth<[
          {
            type: OAuth2FlowType.authorizationCode,
            authorizationUrl: "https://example.com/oauth/authorize",
            tokenUrl: "https://example.com/oauth/token",
            refreshUrl: "https://example.com/oauth/refresh",
            scopes: ["read", "write"]
          }
        ]>)`,
      },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const diagnostics = context.program.diagnostics;

    // Should have no auth-related diagnostics
    const authDiagnostics = diagnostics.filter(
      (d) => d.code === "@typespec/http-client-csharp/unsupported-auth",
    );
    strictEqual(authDiagnostics.length, 0);

    // Should have OAuth2 authentication configured
    ok(root.auth?.oAuth2);
    strictEqual(root.auth?.apiKey, undefined);
    strictEqual(root.auth.oAuth2.flows.length, 1);

    const flow = root.auth.oAuth2.flows[0];
    strictEqual(flow.authorizationUrl, "https://example.com/oauth/authorize");
    strictEqual(flow.tokenUrl, "https://example.com/oauth/token");
    strictEqual(flow.refreshUrl, "https://example.com/oauth/refresh");
    strictEqual(flow.scopes?.length, 2);
    strictEqual(flow.scopes?.[0], "read");
    strictEqual(flow.scopes?.[1], "write");
  });

  it("oauth2 implicit flow", async () => {
    const program = await typeSpecCompile(
      `
        op test(): NoContentResponse;
      `,
      runner,
      {
        AuthDecorator: `@useAuth(OAuth2Auth<[
          {
            type: OAuth2FlowType.implicit,
            authorizationUrl: "https://example.com/oauth/authorize",
            scopes: ["read"]
          }
        ]>)`,
      },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);

    ok(root.auth?.oAuth2);
    strictEqual(root.auth.oAuth2.flows.length, 1);

    const flow = root.auth.oAuth2.flows[0];
    strictEqual(flow.authorizationUrl, "https://example.com/oauth/authorize");
    strictEqual(flow.tokenUrl, undefined); // Should not have tokenUrl for implicit flow
    strictEqual(flow.refreshUrl, undefined);
    strictEqual(flow.scopes?.length, 1);
    strictEqual(flow.scopes?.[0], "read");
  });

  it("oauth2 password flow", async () => {
    const program = await typeSpecCompile(
      `
        op test(): NoContentResponse;
      `,
      runner,
      {
        AuthDecorator: `@useAuth(OAuth2Auth<[
          {
            type: OAuth2FlowType.password,
            authorizationUrl: "https://example.com/oauth/authorize",
            tokenUrl: "https://example.com/oauth/token",
            scopes: ["admin"]
          }
        ]>)`,
      },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);

    ok(root.auth?.oAuth2);
    strictEqual(root.auth.oAuth2.flows.length, 1);

    const flow = root.auth.oAuth2.flows[0];
    strictEqual(flow.authorizationUrl, "https://example.com/oauth/authorize");
    strictEqual(flow.tokenUrl, undefined); // Should not have tokenUrl for password flow
    strictEqual(flow.scopes?.length, 1);
    strictEqual(flow.scopes?.[0], "admin");
  });

  it("oauth2 client credentials flow", async () => {
    const program = await typeSpecCompile(
      `
        op test(): NoContentResponse;
      `,
      runner,
      {
        AuthDecorator: `@useAuth(OAuth2Auth<[
          {
            type: OAuth2FlowType.clientCredentials,
            tokenUrl: "https://example.com/oauth/token",
            scopes: ["api:read", "api:write"]
          }
        ]>)`,
      },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);

    ok(root.auth?.oAuth2);
    strictEqual(root.auth.oAuth2.flows.length, 1);

    const flow = root.auth.oAuth2.flows[0];
    strictEqual(flow.authorizationUrl, undefined); // Should not have authorizationUrl for client credentials flow
    strictEqual(flow.tokenUrl, "https://example.com/oauth/token");
    strictEqual(flow.scopes?.length, 2);
    strictEqual(flow.scopes?.[0], "api:read");
    strictEqual(flow.scopes?.[1], "api:write");
  });

  it("oauth2 multiple flows", async () => {
    const program = await typeSpecCompile(
      `
        op test(): NoContentResponse;
      `,
      runner,
      {
        AuthDecorator: `@useAuth(OAuth2Auth<[
          {
            type: OAuth2FlowType.authorizationCode,
            authorizationUrl: "https://example.com/oauth/authorize",
            tokenUrl: "https://example.com/oauth/token",
            scopes: ["read", "write"]
          },
          {
            type: OAuth2FlowType.clientCredentials,
            tokenUrl: "https://example.com/oauth/token",
            scopes: ["api:admin"]
          }
        ]>)`,
      },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);

    ok(root.auth?.oAuth2);
    strictEqual(root.auth.oAuth2.flows.length, 2);

    const authCodeFlow = root.auth.oAuth2.flows[0];
    strictEqual(authCodeFlow.authorizationUrl, "https://example.com/oauth/authorize");
    strictEqual(authCodeFlow.tokenUrl, "https://example.com/oauth/token");
    strictEqual(authCodeFlow.refreshUrl, undefined);
    strictEqual(authCodeFlow.scopes?.length, 2);
    strictEqual(authCodeFlow.scopes?.[0], "read");
    strictEqual(authCodeFlow.scopes?.[1], "write");

    const clientCredFlow = root.auth.oAuth2.flows[1];
    strictEqual(clientCredFlow.authorizationUrl, undefined);
    strictEqual(clientCredFlow.tokenUrl, "https://example.com/oauth/token");
    strictEqual(clientCredFlow.scopes?.length, 1);
    strictEqual(clientCredFlow.scopes?.[0], "api:admin");
  });

  it("oauth2 flow with no scopes", async () => {
    const program = await typeSpecCompile(
      `
        op test(): NoContentResponse;
      `,
      runner,
      {
        AuthDecorator: `@useAuth(OAuth2Auth<[
          {
            type: OAuth2FlowType.clientCredentials,
            tokenUrl: "https://example.com/oauth/token"
          }
        ]>)`,
      },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);

    ok(root.auth?.oAuth2);
    strictEqual(root.auth.oAuth2.flows.length, 1);

    const flow = root.auth.oAuth2.flows[0];
    strictEqual(flow.tokenUrl, "https://example.com/oauth/token");
    strictEqual(flow.scopes?.length, 0); // Should be empty array if no scopes are provided
  });

  it("oauth2 flow with empty scopes array", async () => {
    const program = await typeSpecCompile(
      `
        op test(): NoContentResponse;
      `,
      runner,
      {
        AuthDecorator: `@useAuth(OAuth2Auth<[
          {
            type: OAuth2FlowType.clientCredentials,
            tokenUrl: "https://example.com/oauth/token",
            scopes: []
          }
        ]>)`,
      },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);

    ok(root.auth?.oAuth2);
    strictEqual(root.auth.oAuth2.flows.length, 1);

    const flow = root.auth.oAuth2.flows[0];
    strictEqual(flow.tokenUrl, "https://example.com/oauth/token");
    strictEqual(flow.scopes?.length, 0);
  });

  it("oauth2 with apikey fallback", async () => {
    const program = await typeSpecCompile(
      `
        op test(): NoContentResponse;
      `,
      runner,
      {
        AuthDecorator: `@useAuth(OAuth2Auth<[
          {
            type: OAuth2FlowType.clientCredentials,
            tokenUrl: "https://example.com/oauth/token",
            scopes: ["api:read"]
          }
        ]> | ApiKeyAuth<ApiKeyLocation.header, "X-API-Key">)`,
      },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);

    // Should have both OAuth2 and API key auth
    ok(root.auth?.oAuth2);
    ok(root.auth?.apiKey);

    strictEqual(root.auth.oAuth2.flows.length, 1);
    strictEqual(root.auth.apiKey.name, "X-API-Key");
    strictEqual(root.auth.apiKey.in, "header");
  });

  it("oauth2 authorization code flow with all optional parameters", async () => {
    const program = await typeSpecCompile(
      `
        op test(): NoContentResponse;
      `,
      runner,
      {
        AuthDecorator: `@useAuth(OAuth2Auth<[
          {
            type: OAuth2FlowType.authorizationCode,
            authorizationUrl: "https://example.com/oauth/authorize",
            tokenUrl: "https://example.com/oauth/token",
            refreshUrl: "https://example.com/oauth/refresh",
            scopes: ["read", "write", "admin"]
          }
        ]>)`,
      },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);

    ok(root.auth?.oAuth2);
    strictEqual(root.auth.oAuth2.flows.length, 1);

    const flow = root.auth.oAuth2.flows[0];
    strictEqual(flow.authorizationUrl, "https://example.com/oauth/authorize");
    strictEqual(flow.tokenUrl, "https://example.com/oauth/token");
    strictEqual(flow.refreshUrl, "https://example.com/oauth/refresh");
    strictEqual(flow.scopes?.length, 3);
    strictEqual(flow.scopes?.[0], "read");
    strictEqual(flow.scopes?.[1], "write");
    strictEqual(flow.scopes?.[2], "admin");
  });
});
