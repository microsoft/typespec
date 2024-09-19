import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { diagnoseOpenApiFor, openApiFor } from "./test-host.js";

describe("openapi3: security", () => {
  it("set a basic auth", async () => {
    const res = await openApiFor(
      `
      @service
      @useAuth(BasicAuth)
      namespace MyService {}
      `,
    );
    deepStrictEqual(res.components.securitySchemes, {
      BasicAuth: {
        type: "http",
        scheme: "basic",
      },
    });
    deepStrictEqual(res.security, [{ BasicAuth: [] }]);
  });

  it("set a bearer auth", async () => {
    const res = await openApiFor(
      `
      @service
      @useAuth(BearerAuth)
      namespace MyService {}
      `,
    );
    deepStrictEqual(res.components.securitySchemes, {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
      },
    });
    deepStrictEqual(res.security, [{ BearerAuth: [] }]);
  });

  it("set a ApiKeyAuth query", async () => {
    const res = await openApiFor(
      `
      @service
      @useAuth(ApiKeyAuth<ApiKeyLocation.query, "x-my-header">)
      namespace MyService {}
      `,
    );
    deepStrictEqual(res.components.securitySchemes, {
      ApiKeyAuth: {
        type: "apiKey",
        in: "query",
        name: "x-my-header",
      },
    });
    deepStrictEqual(res.security, [{ ApiKeyAuth: [] }]);
  });

  it("set a ApiKeyAuth ", async () => {
    const res = await openApiFor(
      `
      @service
      @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-my-header">)
      namespace MyService {}
      `,
    );
    deepStrictEqual(res.components.securitySchemes, {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-my-header",
      },
    });
    deepStrictEqual(res.security, [{ ApiKeyAuth: [] }]);
  });

  it("set a ApiKeyAuth cookie ", async () => {
    const res = await openApiFor(
      `
      @service
      @useAuth(ApiKeyAuth<ApiKeyLocation.cookie, "x-my-header">)
      namespace MyService {}
      `,
    );
    deepStrictEqual(res.components.securitySchemes, {
      ApiKeyAuth: {
        type: "apiKey",
        in: "cookie",
        name: "x-my-header",
      },
    });
    deepStrictEqual(res.security, [{ ApiKeyAuth: [] }]);
  });

  it("set a oauth2 auth", async () => {
    const res = await openApiFor(
      `
      @service     
      @useAuth(OAuth2Auth<[MyFlow]>)
      namespace MyService {
        model MyFlow {
          type: OAuth2FlowType.implicit;
          authorizationUrl: "https://api.example.com/oauth2/authorize";
          refreshUrl: "https://api.example.com/oauth2/refresh";
          scopes: ["read", "write"];
        }
      }
      `,
    );
    deepStrictEqual(res.components.securitySchemes, {
      OAuth2Auth: {
        type: "oauth2",
        flows: {
          implicit: {
            authorizationUrl: "https://api.example.com/oauth2/authorize",
            refreshUrl: "https://api.example.com/oauth2/refresh",
            scopes: {
              read: "",
              write: "",
            },
          },
        },
      },
    });
    deepStrictEqual(res.security, [{ OAuth2Auth: ["read", "write"] }]);
  });

  it("set a oauth2 auth password", async () => {
    const res = await openApiFor(
      `
      @service     
      @useAuth(OAuth2Auth<[MyFlow]>)
      namespace MyService {
        model MyFlow {
          type: OAuth2FlowType.password;
          tokenUrl: "https://api.example.com/oauth2/authorize";
          refreshUrl: "https://api.example.com/oauth2/refresh";
          scopes: ["read", "write"];
        }
      }
      `,
    );
    deepStrictEqual(res.components.securitySchemes, {
      OAuth2Auth: {
        type: "oauth2",
        flows: {
          password: {
            tokenUrl: "https://api.example.com/oauth2/authorize",
            refreshUrl: "https://api.example.com/oauth2/refresh",
            scopes: {
              read: "",
              write: "",
            },
          },
        },
      },
    });
    deepStrictEqual(res.security, [{ OAuth2Auth: ["read", "write"] }]);
  });

  it("set a oauth2 auth clientCredentials", async () => {
    const res = await openApiFor(
      `
      @service     
      @useAuth(OAuth2Auth<[MyFlow]>)
      namespace MyService {
        model MyFlow {
          type: OAuth2FlowType.clientCredentials;
          tokenUrl: "https://api.example.com/oauth2/authorize";
          refreshUrl: "https://api.example.com/oauth2/refresh";
          scopes: ["read", "write"];
        }
      }
      `,
    );
    deepStrictEqual(res.components.securitySchemes, {
      OAuth2Auth: {
        type: "oauth2",
        flows: {
          clientCredentials: {
            tokenUrl: "https://api.example.com/oauth2/authorize",
            refreshUrl: "https://api.example.com/oauth2/refresh",
            scopes: {
              read: "",
              write: "",
            },
          },
        },
      },
    });
    deepStrictEqual(res.security, [{ OAuth2Auth: ["read", "write"] }]);
  });

  it("set a oauth2 auth authorizationCode", async () => {
    const res = await openApiFor(
      `
      @service     
      @useAuth(OAuth2Auth<[MyFlow]>)
      namespace MyService {
        model MyFlow {
          type: OAuth2FlowType.authorizationCode;
          authorizationUrl: "https://api.example.com/oauth2/authorize";
          tokenUrl: "https://api.example.com/oauth2/token";
          scopes: [
            "https://management.azure.com/read",
            "https://management.azure.com/write"
          ];
        }
      }
      `,
    );
    deepStrictEqual(res.components.securitySchemes, {
      OAuth2Auth: {
        type: "oauth2",
        flows: {
          authorizationCode: {
            authorizationUrl: "https://api.example.com/oauth2/authorize",
            tokenUrl: "https://api.example.com/oauth2/token",
            scopes: {
              "https://management.azure.com/read": "",
              "https://management.azure.com/write": "",
            },
          },
        },
      },
    });
    deepStrictEqual(res.security, [
      { OAuth2Auth: ["https://management.azure.com/read", "https://management.azure.com/write"] },
    ]);
  });

  it("set openId auth", async () => {
    const res = await openApiFor(
      `
      @service
      @useAuth(OpenIdConnectAuth<"https://api.example.com/openid">)
      namespace MyService {}
      `,
    );
    expect(res.components.securitySchemes).toEqual({
      OpenIdConnectAuth: {
        type: "openIdConnect",
        openIdConnectUrl: "https://api.example.com/openid",
        description: expect.stringMatching(/^OpenID Connect/),
      },
    });
    deepStrictEqual(res.security, [{ OpenIdConnectAuth: [] }]);
  });

  it("set a unsupported auth", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
      @service
      @useAuth({})
      namespace MyService {}
      `,
    );
    expectDiagnostics(diagnostics, {
      code: "@typespec/openapi3/unsupported-auth",
    });
  });

  it("can specify custom auth name with description", async () => {
    const res = await openApiFor(
      `
      @service
      @useAuth(MyAuth)
      @test namespace Foo {
        @doc("My custom basic auth")
        model MyAuth is BasicAuth;
      }
      `,
    );
    deepStrictEqual(res.components.securitySchemes, {
      MyAuth: {
        type: "http",
        scheme: "basic",
        description: "My custom basic auth",
      },
    });
    deepStrictEqual(res.security, [{ MyAuth: [] }]);
  });

  it("can specify custom auth name with extensions", async () => {
    const res = await openApiFor(
      `
      @service
      @useAuth(MyAuth)
      @test namespace Foo {
        @extension("x-foo", "bar")
        model MyAuth is BasicAuth;
      }
      `,
    );
    deepStrictEqual(res.components.securitySchemes, {
      MyAuth: {
        type: "http",
        scheme: "basic",
        "x-foo": "bar",
      },
    });
    deepStrictEqual(res.security, [{ MyAuth: [] }]);
  });

  it("can use multiple auth", async () => {
    const res = await openApiFor(
      `
      @service
      @useAuth(BearerAuth | [ApiKeyAuth<ApiKeyLocation.header, "x-my-header">, BasicAuth])
      namespace MyService {}
      `,
    );
    deepStrictEqual(res.components.securitySchemes, {
      ApiKeyAuth: {
        in: "header",
        name: "x-my-header",
        type: "apiKey",
      },
      BasicAuth: {
        scheme: "basic",
        type: "http",
      },
      BearerAuth: {
        scheme: "bearer",
        type: "http",
      },
    });
    deepStrictEqual(res.security, [
      {
        BearerAuth: [],
      },
      {
        ApiKeyAuth: [],
        BasicAuth: [],
      },
    ]);
  });

  it("can override security on methods of interface", async () => {
    const res = await openApiFor(
      `
      namespace Test;
      alias ServiceKeyAuth = ApiKeyAuth<ApiKeyLocation.header, "X-API-KEY">;

      @service
      @useAuth(ServiceKeyAuth)
      @route("/my-service")
      namespace MyService {
        @route("/file")
        @useAuth(ServiceKeyAuth | ApiKeyAuth<ApiKeyLocation.query, "token">)
        interface FileManagement {
          @route("/download")
          op download(fileId: string): bytes;
        }
      }
      `,
    );
    deepStrictEqual(res.components.securitySchemes, {
      ApiKeyAuth: {
        in: "header",
        name: "X-API-KEY",
        type: "apiKey",
      },
      ApiKeyAuth_: {
        in: "query",
        name: "token",
        type: "apiKey",
      },
    });
    deepStrictEqual(res.security, [
      {
        ApiKeyAuth: [],
      },
    ]);
    deepStrictEqual(res.paths["/my-service/file/download"]["post"].security, [
      {
        ApiKeyAuth: [],
      },
      {
        ApiKeyAuth_: [],
      },
    ]);
  });

  it("can specify security on containing namespace", async () => {
    const res = await openApiFor(
      `
      namespace Test;
      alias ServiceKeyAuth = ApiKeyAuth<ApiKeyLocation.header, "X-API-KEY">;

      @service
      @useAuth(ServiceKeyAuth)
      @route("/my-service")
      namespace MyService {
        @route("/file")
        @useAuth(ServiceKeyAuth | ApiKeyAuth<ApiKeyLocation.query, "token">)
        namespace FileManagement {
          @route("/download")
          op download(fileId: string): bytes;
        }
      }
      `,
    );
    deepStrictEqual(res.components.securitySchemes, {
      ApiKeyAuth: {
        in: "header",
        name: "X-API-KEY",
        type: "apiKey",
      },
      ApiKeyAuth_: {
        in: "query",
        name: "token",
        type: "apiKey",
      },
    });
    deepStrictEqual(res.security, [
      {
        ApiKeyAuth: [],
      },
    ]);
    deepStrictEqual(res.paths["/my-service/file/download"]["post"].security, [
      {
        ApiKeyAuth: [],
      },
      {
        ApiKeyAuth_: [],
      },
    ]);
  });

  it("can override security on methods of operation", async () => {
    const res = await openApiFor(
      `
      namespace Test;

      alias ServiceKeyAuth = ApiKeyAuth<ApiKeyLocation.header, "X-API-KEY">;

      @service
      @useAuth(ServiceKeyAuth)
      @route("/my-service")
      namespace MyService {
        @useAuth(NoAuth | ServiceKeyAuth | ApiKeyAuth<ApiKeyLocation.query, "token">)
        @route("download")
        op download(fileId: string): bytes;
      }
      `,
    );
    deepStrictEqual(res.components.securitySchemes, {
      ApiKeyAuth: {
        in: "header",
        name: "X-API-KEY",
        type: "apiKey",
      },
      ApiKeyAuth_: {
        in: "query",
        name: "token",
        type: "apiKey",
      },
    });
    deepStrictEqual(res.security, [
      {
        ApiKeyAuth: [],
      },
    ]);
    deepStrictEqual(res.paths["/my-service/download"]["post"].security, [
      {},
      {
        ApiKeyAuth: [],
      },
      {
        ApiKeyAuth_: [],
      },
    ]);
  });

  it("can override Oauth2 scopes on operation", async () => {
    const res = await openApiFor(
      `
      namespace Test;

      alias MyOauth<T extends string[]> = OAuth2Auth<Flows=[{
        type: OAuth2FlowType.implicit;
        authorizationUrl: "https://api.example.com/oauth2/authorize";
        refreshUrl: "https://api.example.com/oauth2/refresh";
      }], Scopes=T>;

      @route("/my-service")
      @useAuth(MyOauth<["read", "write"]>)
      @service
      namespace MyService {
        @route("/delete")
        @useAuth(MyOauth<["delete"]>)
        @post op delete(): void;
      }
      `,
    );
    deepStrictEqual(res.components.securitySchemes, {
      OAuth2Auth: {
        type: "oauth2",
        flows: {
          implicit: {
            authorizationUrl: "https://api.example.com/oauth2/authorize",
            refreshUrl: "https://api.example.com/oauth2/refresh",
            scopes: {
              read: "",
              write: "",
              delete: "",
            },
          },
        },
      },
    });
    deepStrictEqual(res.security, [
      {
        OAuth2Auth: ["read", "write"],
      },
    ]);
    deepStrictEqual(res.paths["/my-service/delete"]["post"].security, [
      {
        OAuth2Auth: ["delete"],
      },
    ]);
  });
});
