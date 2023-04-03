import { ModelProperty, Namespace } from "@typespec/compiler";
import {
  BasicTestRunner,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import {
  getAuthentication,
  getHeaderFieldName,
  getHeaderFieldOptions,
  getPathParamName,
  getPathParamOptions,
  getQueryParamName,
  getQueryParamOptions,
  getServers,
  includeInapplicableMetadataInPayload,
  isBody,
  isHeader,
  isPathParam,
  isQueryParam,
  isStatusCode,
} from "../src/decorators.js";
import { createHttpTestRunner } from "./test-host.js";

describe("http: decorators", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createHttpTestRunner();
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
          message:
            "Cannot apply @header decorator to test since it is not assignable to ModelProperty",
        },
        {
          code: "decorator-wrong-target",
          message:
            "Cannot apply @header decorator to Foo since it is not assignable to ModelProperty",
        },
      ]);
    });

    it("emit diagnostics when header name is not a string or of type HeaderOptions", async () => {
      const diagnostics = await runner.diagnose(`
          op test(@header(123) MyHeader: string): string;
          op test2(@header({ name: 123 }) MyHeader: string): string;
          op test3(@header({ format: "invalid" }) MyHeader: string): string;
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-argument",
          message:
            "Argument '123' is not assignable to parameter of type 'string | TypeSpec.Http.HeaderOptions'",
        },
        {
          code: "invalid-argument",
          message:
            "Argument '(anonymous model)' is not assignable to parameter of type 'string | TypeSpec.Http.HeaderOptions'",
        },
        {
          code: "invalid-argument",
          message:
            "Argument '(anonymous model)' is not assignable to parameter of type 'string | TypeSpec.Http.HeaderOptions'",
        },
      ]);
    });

    it("emit diagnostics when header is not specifing format but is an array", async () => {
      const diagnostics = await runner.diagnose(`
          op test(@header MyHeader: string[]): string;
        `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/http/header-format-required",
        message: `A format must be specified for @header when type is an array. e.g. @header({format: "csv"})`,
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

    it("override header with HeaderOptions", async () => {
      const { SingleString } = await runner.compile(`
          @put op test(@test @header({name: "x-single-string"}) SingleString: string): string;
        `);

      deepStrictEqual(getHeaderFieldOptions(runner.program, SingleString), {
        type: "header",
        name: "x-single-string",
      });
      strictEqual(getHeaderFieldName(runner.program, SingleString), "x-single-string");
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
          message:
            "Cannot apply @query decorator to test since it is not assignable to ModelProperty",
        },
        {
          code: "decorator-wrong-target",
          message:
            "Cannot apply @query decorator to Foo since it is not assignable to ModelProperty",
        },
      ]);
    });

    it("emit diagnostics when query name is not a string or of type QueryOptions", async () => {
      const diagnostics = await runner.diagnose(`
          op test(@query(123) MyQuery: string): string;
          op test2(@query({name: 123}) MyQuery: string): string;
          op test3(@query({format: "invalid"}) MyQuery: string): string;
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-argument",
          message:
            "Argument '123' is not assignable to parameter of type 'string | TypeSpec.Http.QueryOptions'",
        },
        {
          code: "invalid-argument",
          message:
            "Argument '(anonymous model)' is not assignable to parameter of type 'string | TypeSpec.Http.QueryOptions'",
        },
        {
          code: "invalid-argument",
          message:
            "Argument '(anonymous model)' is not assignable to parameter of type 'string | TypeSpec.Http.QueryOptions'",
        },
      ]);
    });

    it("emit diagnostics when query is not specifing format but is an array", async () => {
      const diagnostics = await runner.diagnose(`
          op test(@query select: string[]): string;
        `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/http/query-format-required",
        message: `A format must be specified for @query when type is an array. e.g. @query({format: "multi"})`,
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

    it("override query with QueryOptions", async () => {
      const { selects } = await runner.compile(`
          @put op test(@test @query({name: "$select", format: "csv"}) selects: string[]): string;
        `);
      deepStrictEqual(getQueryParamOptions(runner.program, selects), {
        type: "query",
        name: "$select",
        format: "csv",
      });
      strictEqual(getQueryParamName(runner.program, selects), "$select");
    });
  });

  describe("@route", () => {
    it("emit diagnostics when duplicated unshared routes are applied", async () => {
      const diagnostics = await runner.diagnose(`
        @route("/test") op test(): string;
        @route("/test") op test2(): string;
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "@typespec/http/duplicate-operation",
          message: `Duplicate operation "test" routed at "get /test".`,
        },
        {
          code: "@typespec/http/duplicate-operation",
          message: `Duplicate operation "test2" routed at "get /test".`,
        },
      ]);
    });

    it("do not emit diagnostics when duplicated shared routes are applied", async () => {
      const diagnostics = await runner.diagnose(`
        @route("/test", {shared: true}) op test(): string;
        @route("/test", {shared: true}) op test2(): string;
      `);

      expectDiagnosticEmpty(diagnostics);
    });

    it("emit diagnostic when wrong type for shared is provided", async () => {
      const diagnostics = await runner.diagnose(`
        @route("/test", {shared: "yes"}) op test(): string;
      `);
      expectDiagnostics(diagnostics, [
        {
          code: "@typespec/http/shared-boolean",
          message: `shared parameter must be a boolean.`,
        },
      ]);
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
          message:
            "Cannot apply @path decorator to test since it is not assignable to ModelProperty",
        },
        {
          code: "decorator-wrong-target",
          message:
            "Cannot apply @path decorator to Foo since it is not assignable to ModelProperty",
        },
      ]);
    });

    it("emit diagnostics if property is optional without default", async () => {
      const diagnostics = await runner.diagnose(`
        @route("/") op test(@path myPath?: string): string;
      `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/http/optional-path-param",
        message: "Path parameter 'myPath' cannot be optional.",
      });
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

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-argument",
          message: "Argument '123' is not assignable to parameter of type 'string'",
        },
      ]);
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

      deepStrictEqual(getPathParamOptions(runner.program, select), {
        type: "path",
        name: "$select",
      });
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
          message:
            "Cannot apply @body decorator to test since it is not assignable to ModelProperty",
        },
        {
          code: "decorator-wrong-target",
          message:
            "Cannot apply @body decorator to Foo since it is not assignable to ModelProperty",
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
          message:
            "Cannot apply @statusCode decorator to test since it is not assignable to ModelProperty",
        },
        {
          code: "decorator-wrong-target",
          message:
            "Cannot apply @statusCode decorator to Foo since it is not assignable to ModelProperty",
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
          message: "Cannot apply @server decorator to test since it is not assignable to Namespace",
        },
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @server decorator to Foo since it is not assignable to Namespace",
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
        message: "Argument '123' is not assignable to parameter of type 'string'",
      });
    });

    it("emit diagnostics when description is not a string", async () => {
      const diagnostics = await runner.diagnose(`
        @server("https://example.com", 123)
        namespace MyService {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '123' is not assignable to parameter of type 'string'",
      });
    });

    it("emit diagnostics when description is not provided", async () => {
      const diagnostics = await runner.diagnose(`
        @server("https://example.com")
        namespace MyService {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument-count",
        message: "Expected 2-3 arguments, but got 1.",
      });
    });

    it("emit diagnostics when parameters is not a model", async () => {
      const diagnostics = await runner.diagnose(`
        @server("https://example.com", "My service url", 123)
        namespace MyService {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '123' is not assignable to parameter of type 'object'",
      });
    });

    it("emit diagnostics if url has parameters that is not specified in model", async () => {
      const diagnostics = await runner.diagnose(`
        @server("https://example.com/{name}/foo", "My service url", {other: string})
        namespace MyService {}
      `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/http/missing-server-param",
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
    it("emit diagnostics when @useAuth is not used on namespace", async () => {
      const diagnostics = await runner.diagnose(`
          @useAuth(BasicAuth) op test(): string;
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message:
            "Cannot apply @useAuth decorator to test since it is not assignable to Namespace",
        },
      ]);
    });

    it("emit diagnostics when config is not a model, tuple or union", async () => {
      const diagnostics = await runner.diagnose(`
          @useAuth(anOp)
          namespace Foo {}

          op anOp(): void;
        `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message:
          "Argument 'anOp' is not assignable to parameter of type 'object | Union | object[]'",
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

    it("can specify OAuth2", async () => {
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

  describe("@visibility", () => {
    it("warns on unsupported write visibility", async () => {
      const diagnostics = await runner.diagnose(`
        @test model M {
          @visibility("write") w: string;
        }
      `);

      expectDiagnostics(diagnostics, [
        {
          severity: "warning",
          code: "@typespec/http/write-visibility-not-supported",
        },
      ]);
    });
  });

  describe("@includeInapplicableMetadataInPayload", () => {
    it("defaults to true", async () => {
      const { M } = await runner.compile(`
        namespace Foo;
        @test model M {p: string; }
      `);

      strictEqual(M.kind, "Model" as const);
      strictEqual(
        includeInapplicableMetadataInPayload(runner.program, M.properties.get("p")!),
        true
      );
    });
    it("can specify at namespace level", async () => {
      const { M } = await runner.compile(`
        @includeInapplicableMetadataInPayload(false)
        namespace Foo;
        @test model M {p: string; }
      `);

      strictEqual(M.kind, "Model" as const);
      strictEqual(
        includeInapplicableMetadataInPayload(runner.program, M.properties.get("p")!),
        false
      );
    });
    it("can specify at model level", async () => {
      const { M } = await runner.compile(`
      namespace Foo;
      @includeInapplicableMetadataInPayload(false) @test model M { p: string; }
    `);

      strictEqual(M.kind, "Model" as const);
      strictEqual(
        includeInapplicableMetadataInPayload(runner.program, M.properties.get("p")!),
        false
      );
    });
    it("can specify at property level", async () => {
      const { M } = await runner.compile(`
      namespace Foo;
      @test model M { @includeInapplicableMetadataInPayload(false) p: string; }
    `);

      strictEqual(M.kind, "Model" as const);
      strictEqual(
        includeInapplicableMetadataInPayload(runner.program, M.properties.get("p")!),
        false
      );
    });

    it("can be overridden", async () => {
      const { M } = await runner.compile(`
      @includeInapplicableMetadataInPayload(false)
      namespace Foo;
      @includeInapplicableMetadataInPayload(true) @test model M { p: string; }
    `);

      strictEqual(M.kind, "Model" as const);
      strictEqual(
        includeInapplicableMetadataInPayload(runner.program, M.properties.get("p")!),
        true
      );
    });
  });
});
