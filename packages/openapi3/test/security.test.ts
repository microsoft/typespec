import { deepStrictEqual, ok } from "assert";
import { OpenAPI3Document, OpenAPI3SecurityScheme } from "../src/types.js";
import { openApiFor } from "./test-host.js";

describe("openapi3: security", () => {
  function schemesEquals(
    res: OpenAPI3Document,
    expectedSchemes: Record<string, OpenAPI3SecurityScheme>
  ) {
    const schemes = res.components?.securitySchemes;

    const schemesWithoutDoc =
      schemes &&
      Object.fromEntries(
        Object.entries(schemes).map(([k, v]) => {
          const { description, ...omitted } = v;
          return [k, omitted];
        })
      );

    deepStrictEqual(schemesWithoutDoc, expectedSchemes);
  }
  it("set a basic auth", async () => {
    const res = await openApiFor(
      `
      @service({title: "My service"})
      @useAuth(BasicAuth)
      namespace MyService {}
      `
    );
    schemesEquals(res, {
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
    ok(res.components.securitySchemes.BearerAuth);
    schemesEquals(res, {
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
    schemesEquals(res, {
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
    schemesEquals(res, {
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
    schemesEquals(res, {
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
