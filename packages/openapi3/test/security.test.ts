import { deepStrictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { openApiFor } from "./test-host.js";

describe("openapi3: security", () => {
  it("set a basic auth", async () => {
    const res = await openApiFor(
      `
      @service({title: "My service"})
      @useAuth(BasicAuth)
      namespace MyService {}
      `
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
      @service({title: "My service"})
      @useAuth(BearerAuth)
      namespace MyService {}
      `
    );
    deepStrictEqual(res.components.securitySchemes, {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
      },
    });
    deepStrictEqual(res.security, [{ BearerAuth: [] }]);
  });

  it("set a ApiKeyAuth ", async () => {
    const res = await openApiFor(
      `
      @service({title: "My service"})
      @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-my-header">)
      namespace MyService {}
      `
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

  it("set a oauth2 auth", async () => {
    const res = await openApiFor(
      `
      @service({title: "My service"})
     
      @useAuth(OAuth2Auth<[MyFlow]>)
      namespace MyService {
        model MyFlow {
          type: OAuth2FlowType.implicit;
          authorizationUrl: "https://api.example.com/oauth2/authorize";
          refreshUrl: "https://api.example.com/oauth2/refresh";
          scopes: ["read", "write"];
        }
      }
      `
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

  it("set openId auth", async () => {
    const res = await openApiFor(
      `
      @service
      @useAuth(OpenIdConnectAuth<"https://api.example.com/openid">)
      namespace MyService {}
      `
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

  it("can specify custom auth name with description", async () => {
    const res = await openApiFor(
      `
      @service({title: "My service"})
      @useAuth(MyAuth)
      @test namespace Foo {
        @doc("My custom basic auth")
        model MyAuth is BasicAuth;
      }
      `
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

  it("can use multiple auth", async () => {
    const res = await openApiFor(
      `
      @service({title: "My service"})
      @useAuth(BearerAuth | [ApiKeyAuth<ApiKeyLocation.header, "x-my-header">, BasicAuth])
      namespace MyService {}
      `
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
});
