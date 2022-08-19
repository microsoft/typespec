import { ModelProperty, Namespace } from "@cadl-lang/compiler";
import {
  BasicTestRunner,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "@cadl-lang/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import {
  getAuthentication,
  getHeaderFieldName,
  getPathParamName,
  getQueryParamName,
  getServers,
  isBody,
  isHeader,
  isPathParam,
  isQueryParam,
  isStatusCode,
} from "../src/http/decorators.js";
import { createRestTestRunner } from "./test-host.js";

describe("rest: http decorators", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createRestTestRunner();
  });

  describe("emit diagnostic if passing arguments to verb decorators", () => {
    ["get", "post", "put", "patch", "delete", "head"].forEach((verb) => {
      it(`@${verb}`, async () => {
        const diagnostics = await runner.diagnose(`
          @${verb}("/test") op test(): string;
        `);

        expectDiagnostics(diagnostics, {
          code: "invalid-argument-count",
          message: "Expected 0 arguments, but got 1.",
        });
      });
    });
  });

  describe("@header", () => {
    it("emit diagnostics when @header is not used on model property", async () => {
      const diagnostics = await runner.diagnose(`
          @header op test(): string;

          @header model Foo {}
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @header decorator to Operation",
        },
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @header decorator to Model",
        },
      ]);
    });

    it("emit diagnostics when header name is not a string", async () => {
      const diagnostics = await runner.diagnose(`
          op test(@header(123) MyHeader: string): string;
        `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '123' of type 'Number' is not assignable to parameter of type 'String'",
      });
    });

    it("generate header name from property name", async () => {
      const { MyHeader } = await runner.compile(`
          op test(@test @header MyHeader: string): string;
        `);

      ok(isHeader(runner.program, MyHeader));
      strictEqual(getHeaderFieldName(runner.program, MyHeader), "my-header");
    });

    it("override header name with 1st parameter", async () => {
      const { MyHeader } = await runner.compile(`
          op test(@test @header("x-my-header") MyHeader: string): string;
        `);

      strictEqual(getHeaderFieldName(runner.program, MyHeader), "x-my-header");
    });
  });

  describe("@query", () => {
    it("emit diagnostics when @query is not used on model property", async () => {
      const diagnostics = await runner.diagnose(`
          @query op test(): string;

          @query model Foo {}
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @query decorator to Operation",
        },
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @query decorator to Model",
        },
      ]);
    });

    it("emit diagnostics when query name is not a string", async () => {
      const diagnostics = await runner.diagnose(`
          op test(@query(123) MyQuery: string): string;
        `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '123' of type 'Number' is not assignable to parameter of type 'String'",
      });
    });

    it("generate query name from property name", async () => {
      const { select } = await runner.compile(`
          op test(@test @query select: string): string;
        `);

      ok(isQueryParam(runner.program, select));
      strictEqual(getQueryParamName(runner.program, select), "select");
    });

    it("override query name with 1st parameter", async () => {
      const { select } = await runner.compile(`
          op test(@test @query("$select") select: string): string;
        `);

      strictEqual(getQueryParamName(runner.program, select), "$select");
    });
  });

  describe("@path", () => {
    it("emit diagnostics when @path is not used on model property", async () => {
      const diagnostics = await runner.diagnose(`
          @path op test(): string;

          @path model Foo {}
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @path decorator to Operation",
        },
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @path decorator to Model",
        },
      ]);
    });

    it("emit diagnostics if property is optional without default", async () => {
      const diagnostics = await runner.diagnose(`
        @route("/") op test(@path myPath?: string): string;
      `);

      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/rest/optional-path-param",
        message: "Path parameter 'myPath' cannot be optional without a default value.",
      });
    });

    it("accept optional property with default values", async () => {
      const diagnostics = await runner.diagnose(`
        @route("/") op test(@path myPath?: string = "my-default"): string;
      `);

      expectDiagnosticEmpty(diagnostics);
    });

    it("accept optional path when not used as operation parameter", async () => {
      const diagnostics = await runner.diagnose(`
        @route("/") op test(): {@path myPath?: string};
      `);

      expectDiagnosticEmpty(diagnostics);
    });

    it("emit diagnostics when path name is not a string", async () => {
      const diagnostics = await runner.diagnose(`
          op test(@path(123) MyPath: string): string;
        `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '123' of type 'Number' is not assignable to parameter of type 'String'",
      });
    });

    it("generate path name from property name", async () => {
      const { select } = await runner.compile(`
          op test(@test @path select: string): string;
        `);

      ok(isPathParam(runner.program, select));
      strictEqual(getPathParamName(runner.program, select), "select");
    });

    it("override path name with 1st parameter", async () => {
      const { select } = await runner.compile(`
          op test(@test @path("$select") select: string): string;
        `);

      strictEqual(getPathParamName(runner.program, select), "$select");
    });
  });

  describe("@body", () => {
    it("emit diagnostics when @body is not used on model property", async () => {
      const diagnostics = await runner.diagnose(`
          @body op test(): string;

          @body model Foo {}
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @body decorator to Operation",
        },
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @body decorator to Model",
        },
      ]);
    });

    it("set the body with @body", async () => {
      const { body } = await runner.compile(`
          @post op test(@test @body body: string): string;
        `);

      ok(isBody(runner.program, body));
    });
  });

  describe("@statusCode", () => {
    it("emit diagnostics when @statusCode is not used on model property", async () => {
      const diagnostics = await runner.diagnose(`
          @statusCode op test(): string;

          @statusCode model Foo {}
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @statusCode decorator to Operation",
        },
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @statusCode decorator to Model",
        },
      ]);
    });

    it("set the statusCode with @statusCode", async () => {
      const { code } = await runner.compile(`
          op test(): {
            @test @statusCode code: 201
          };
        `);

      ok(isStatusCode(runner.program, code));
    });
  });

  describe("@server", () => {
    it("emit diagnostics when @server is not used on namespace", async () => {
      const diagnostics = await runner.diagnose(`
          @server("https://example.com", "MyServer") op test(): string;

          @server("https://example.com", "MyServer") model Foo {}
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @server decorator to Operation",
        },
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @server decorator to Model",
        },
      ]);
    });

    it("emit diagnostics when url is not a string", async () => {
      const diagnostics = await runner.diagnose(`
          @server(123, "MyServer")
          namespace MyService {}
        `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '123' of type 'Number' is not assignable to parameter of type 'String'",
      });
    });

    it("emit diagnostics when description is not a string", async () => {
      const diagnostics = await runner.diagnose(`
        @server("https://example.com", 123)
        namespace MyService {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '123' of type 'Number' is not assignable to parameter of type 'String'",
      });
    });

    it("emit diagnostics when description is not provided", async () => {
      const diagnostics = await runner.diagnose(`
        @server("https://example.com")
        namespace MyService {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument-count",
        message: "Expected between 2 and 3 arguments, but got 1.",
      });
    });

    it("emit diagnostics when parameters is not a model", async () => {
      const diagnostics = await runner.diagnose(`
        @server("https://example.com", "My service url", 123)
        namespace MyService {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '123' of type 'Number' is not assignable to parameter of type 'Model'",
      });
    });

    it("emit diagnostics if url has parameters that is not specified in model", async () => {
      const diagnostics = await runner.diagnose(`
        @server("https://example.com/{name}/foo", "My service url", {other: string})
        namespace MyService {}
      `);

      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/rest/missing-server-param",
        message: "Server url contains parameter 'name' but wasn't found in given parameters",
      });
    });

    it("define a simple server with a fixed url", async () => {
      const { MyService } = (await runner.compile(`
        @server("https://example.com", "My service url")
        @test namespace MyService {}
      `)) as { MyService: Namespace };

      const servers = getServers(runner.program, MyService);
      deepStrictEqual(servers, [
        {
          description: "My service url",
          parameters: new Map(),
          url: "https://example.com",
        },
      ]);
    });

    it("define a server with parameters", async () => {
      const { MyService, NameParam } = (await runner.compile(`
        @server("https://example.com/{name}/foo", "My service url", {@test("NameParam") name: string })
        @test namespace MyService {}
      `)) as { MyService: Namespace; NameParam: ModelProperty };

      const servers = getServers(runner.program, MyService);
      deepStrictEqual(servers, [
        {
          description: "My service url",
          parameters: new Map<string, ModelProperty>([["name", NameParam]]),
          url: "https://example.com/{name}/foo",
        },
      ]);
    });
  });

  describe("@useAuth", () => {
    it("emit diagnostics when @header is not used on namespace", async () => {
      const diagnostics = await runner.diagnose(`
          @useAuth(BasicAuth) op test(): string;
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @useAuth decorator to Operation",
        },
      ]);
    });

    it("emit diagnostics when config is not a model, tuple or union", async () => {
      const diagnostics = await runner.diagnose(`
          @useAuth(123)
          namespace Foo {}
        `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message:
          "Argument '123' of type 'Number' is not assignable to parameter of type 'Model, Union, Tuple'",
      });
    });

    it("can specify BasicAuth", async () => {
      const { Foo } = (await runner.compile(`
        @useAuth(BasicAuth)
        @test namespace Foo {}
      `)) as { Foo: Namespace };

      deepStrictEqual(getAuthentication(runner.program, Foo), {
        options: [{ schemes: [{ id: "BasicAuth", type: "http", scheme: "basic" }] }],
      });
    });

    it("can specify custom auth name with description", async () => {
      const { Foo } = (await runner.compile(`
        @doc("My custom basic auth")
        model MyAuth is BasicAuth;
        @useAuth(MyAuth)
        @test namespace Foo {}
      `)) as { Foo: Namespace };

      deepStrictEqual(getAuthentication(runner.program, Foo), {
        options: [
          {
            schemes: [
              { id: "MyAuth", description: "My custom basic auth", type: "http", scheme: "basic" },
            ],
          },
        ],
      });
    });

    it("can specify BearerAuth", async () => {
      const { Foo } = (await runner.compile(`
        @useAuth(BearerAuth)
        @test namespace Foo {}
      `)) as { Foo: Namespace };

      deepStrictEqual(getAuthentication(runner.program, Foo), {
        options: [{ schemes: [{ id: "BearerAuth", type: "http", scheme: "bearer" }] }],
      });
    });

    it("can specify ApiKeyAuth", async () => {
      const { Foo } = (await runner.compile(`
        @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-my-header">)
        @test namespace Foo {}
      `)) as { Foo: Namespace };

      deepStrictEqual(getAuthentication(runner.program, Foo), {
        options: [
          { schemes: [{ id: "ApiKeyAuth", type: "apiKey", in: "header", name: "x-my-header" }] },
        ],
      });
    });

    it("can specify OAauth2", async () => {
      const { Foo } = (await runner.compile(`
        model MyFlow {
          type: OAuth2FlowType.implicit;
          authorizationUrl: "https://api.example.com/oauth2/authorize";
          refreshUrl: "https://api.example.com/oauth2/refresh";
          scopes: ["read", "write"];
        }
        @useAuth(OAuth2Auth<[MyFlow]>)
        @test namespace Foo {}
      `)) as { Foo: Namespace };

      deepStrictEqual(getAuthentication(runner.program, Foo), {
        options: [
          {
            schemes: [
              {
                id: "OAuth2Auth",
                type: "oauth2",
                flows: [
                  {
                    type: "implicit",
                    authorizationUrl: "https://api.example.com/oauth2/authorize",
                    refreshUrl: "https://api.example.com/oauth2/refresh",
                    scopes: [{ value: "read" }, { value: "write" }],
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it("can specify multiple auth options", async () => {
      const { Foo } = (await runner.compile(`
        @useAuth(BasicAuth | BearerAuth)
        @test namespace Foo {}
      `)) as { Foo: Namespace };

      deepStrictEqual(getAuthentication(runner.program, Foo), {
        options: [
          { schemes: [{ id: "BasicAuth", type: "http", scheme: "basic" }] },
          { schemes: [{ id: "BearerAuth", type: "http", scheme: "bearer" }] },
        ],
      });
    });

    it("can specify multiple auth schemes to be used together", async () => {
      const { Foo } = (await runner.compile(`
        @useAuth([BasicAuth, BearerAuth])
        @test namespace Foo {}
      `)) as { Foo: Namespace };

      deepStrictEqual(getAuthentication(runner.program, Foo), {
        options: [
          {
            schemes: [
              { id: "BasicAuth", type: "http", scheme: "basic" },
              { id: "BearerAuth", type: "http", scheme: "bearer" },
            ],
          },
        ],
      });
    });

    it("can specify multiple auth schemes to be used together and multiple options", async () => {
      const { Foo } = (await runner.compile(`
        @useAuth(BearerAuth | [ApiKeyAuth<ApiKeyLocation.header, "x-my-header">, BasicAuth])
        @test namespace Foo {}
      `)) as { Foo: Namespace };

      deepStrictEqual(getAuthentication(runner.program, Foo), {
        options: [
          {
            schemes: [{ id: "BearerAuth", type: "http", scheme: "bearer" }],
          },
          {
            schemes: [
              { id: "ApiKeyAuth", type: "apiKey", in: "header", name: "x-my-header" },
              { id: "BasicAuth", type: "http", scheme: "basic" },
            ],
          },
        ],
      });
    });
  });
});
