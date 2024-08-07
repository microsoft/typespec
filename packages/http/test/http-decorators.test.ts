import { ModelProperty, Namespace, Operation } from "@typespec/compiler";
import {
  BasicTestRunner,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, expect, it } from "vitest";
import {
  getAuthentication,
  getHeaderFieldName,
  getHeaderFieldOptions,
  getPathParamName,
  getPathParamOptions,
  getQueryParamName,
  getQueryParamOptions,
  getServers,
  getStatusCodes,
  includeInapplicableMetadataInPayload,
  isBody,
  isBodyIgnore,
  isBodyRoot,
  isHeader,
  isPathParam,
  isQueryParam,
  isStatusCode,
} from "../src/decorators.js";
import { Visibility, getRequestVisibility, resolveRequestVisibility } from "../src/metadata.js";
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
        },
        {
          code: "invalid-argument",
        },
        {
          code: "invalid-argument",
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
          op test2(@query(#{name: 123}) MyQuery: string): string;
          op test3(@query(#{format: "invalid"}) MyQuery: string): string;
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-argument",
        },
        {
          code: "invalid-argument",
        },
        {
          code: "invalid-argument",
        },
      ]);
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

    it("specify explode: true", async () => {
      const { selects } = await runner.compile(`
        op test(@test @query(#{ explode: true }) selects: string[]): string;
      `);
      expect(getQueryParamOptions(runner.program, selects)).toEqual({
        type: "query",
        name: "selects",
        format: "multi",
        explode: true,
      });
    });

    describe("LEGACY: change format for array value", () => {
      ["csv", "tsv", "ssv", "simple", "pipes"].forEach((format) => {
        it(`set query format to "${format}"`, async () => {
          const { selects } = await runner.compile(`
            #suppress "deprecated" "Test"
            op test(@test @query(#{name: "$select", format: "${format}"}) selects: string[]): string;
          `);
          deepStrictEqual(getQueryParamOptions(runner.program, selects), {
            type: "query",
            name: "$select",
            explode: false,
            format,
          });
        });
      });
      ["form"].forEach((format) => {
        it(`set query format to "${format}"`, async () => {
          const { selects } = await runner.compile(`
            #suppress "deprecated" "Test"
            op test(@test @query(#{name: "$select", format: "${format}"}) selects: string[]): string;
          `);
          deepStrictEqual(getQueryParamOptions(runner.program, selects), {
            type: "query",
            name: "$select",
            explode: true,
            format,
          });
        });
      });
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

    it("emits diagnostic when deprecated `shared` option is used", async () => {
      const diagnostics = await runner.diagnose(`
        @route("/test", { shared: true }) op test(): string;
      `);
      expectDiagnostics(diagnostics, [
        {
          code: "deprecated",
          message:
            "Deprecated: The `shared` option is deprecated, use the `@sharedRoute` decorator instead.",
        },
      ]);
    });

    it("emit diagnostics when not all duplicated routes are declared shared on each op conflicting", async () => {
      const diagnostics = await runner.diagnose(`
        @route("/test") @sharedRoute op test(): string;
        @route("/test") @sharedRoute op test2(): string;
        @route("/test") op test3(): string;
      `);
      expectDiagnostics(diagnostics, [
        {
          code: "@typespec/http/shared-inconsistency",
          message: `Each operation routed at "get /test" needs to have the @sharedRoute decorator.`,
        },
        {
          code: "@typespec/http/shared-inconsistency",
          message: `Each operation routed at "get /test" needs to have the @sharedRoute decorator.`,
        },
        {
          code: "@typespec/http/shared-inconsistency",
          message: `Each operation routed at "get /test" needs to have the @sharedRoute decorator.`,
        },
      ]);
    });

    it("do not emit diagnostics when duplicated shared routes are applied", async () => {
      const diagnostics = await runner.diagnose(`
        @route("/test") @sharedRoute op test(): string;
        @route("/test") @sharedRoute op test2(): string;
      `);

      expectDiagnosticEmpty(diagnostics);
    });

    it("do not emit diagnostics routes sharing path but not same verb", async () => {
      const diagnostics = await runner.diagnose(`
        @route("/test") @sharedRoute op test(): string;
        @route("/test") @sharedRoute op test2(): string;
        @route("/test") @post op test3(): string;
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("emit diagnostic when wrong type for shared is provided", async () => {
      const diagnostics = await runner.diagnose(`
        @route("/test", {shared: "yes"}) op test(): string;
      `);
      expectDiagnostics(diagnostics, [
        {
          code: "invalid-argument",
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
        allowReserved: false,
        explode: false,
        style: "simple",
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

  describe("@bodyRoot", () => {
    it("emit diagnostics when @body is not used on model property", async () => {
      const diagnostics = await runner.diagnose(`
          @bodyRoot op test(): string;

          @bodyRoot model Foo {}
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message:
            "Cannot apply @bodyRoot decorator to test since it is not assignable to ModelProperty",
        },
        {
          code: "decorator-wrong-target",
          message:
            "Cannot apply @bodyRoot decorator to Foo since it is not assignable to ModelProperty",
        },
      ]);
    });

    it("set the body root with @bodyRoot", async () => {
      const { body } = (await runner.compile(`
          @post op test(@test @bodyRoot body: string): string;
        `)) as { body: ModelProperty };

      ok(isBodyRoot(runner.program, body));
    });
  });

  describe("@bodyIgnore", () => {
    it("emit diagnostics when @body is not used on model property", async () => {
      const diagnostics = await runner.diagnose(`
          @bodyIgnore op test(): string;

          @bodyIgnore model Foo {}
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message:
            "Cannot apply @bodyIgnore decorator to test since it is not assignable to ModelProperty",
        },
        {
          code: "decorator-wrong-target",
          message:
            "Cannot apply @bodyIgnore decorator to Foo since it is not assignable to ModelProperty",
        },
      ]);
    });

    it("isBodyIgnore returns true on property decorated", async () => {
      const { body } = await runner.compile(`
          @post op test(@test @bodyIgnore body: string): string;
        `);

      ok(isBodyIgnore(runner.program, body as ModelProperty));
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

    it("emits error if multiple properties are decorated with `@statusCode` in return type", async () => {
      const diagnostics = await runner.diagnose(
        `
        model CreatedOrUpdatedResponse {
          @statusCode ok: "200";
          @statusCode created: "201";
        }
        model DateHeader {
          @header date: utcDateTime;
        }
        model Key {
          key: string;
        }
        @put op create(): CreatedOrUpdatedResponse & DateHeader & Key;
        `
      );
      expectDiagnostics(diagnostics, [{ code: "@typespec/http/multiple-status-codes" }]);
    });

    it("emits error if multiple `@statusCode` decorators are composed together", async () => {
      const diagnostics = await runner.diagnose(
        `      
        model CustomUnauthorizedResponse {
          @statusCode _: 401;
          @bodyRoot body: UnauthorizedResponse;
        }
  
        model Pet {
          name: string;
        }
        
        model PetList {
          @statusCode _: 200;
          @body body: Pet[];
        }
        
        op list(): PetList | CustomUnauthorizedResponse;
        `
      );
      expectDiagnostics(diagnostics, [{ code: "@typespec/http/multiple-status-codes" }]);
    });

    it("set numeric statusCode with @statusCode", async () => {
      const { code } = (await runner.compile(`
          op test(): {
            @test @statusCode code: 201
          };
        `)) as { code: ModelProperty };

      ok(isStatusCode(runner.program, code));
      deepStrictEqual(getStatusCodes(runner.program, code), [201]);
    });

    it("set range statusCode with @statusCode", async () => {
      const { code } = (await runner.compile(`
          op test(): {
            @test @statusCode @minValue(200) @maxValue(299) code: int32;
          };
        `)) as { code: ModelProperty };

      ok(isStatusCode(runner.program, code));
      deepStrictEqual(getStatusCodes(runner.program, code), [{ start: 200, end: 299 }]);
    });

    describe("invalid status codes", () => {
      async function checkInvalid(code: string, message: string) {
        const diagnostics = await runner.diagnose(`
        op test(): {
          @statusCode code: ${code}
        };
      `);

        expectDiagnostics(diagnostics, { code: "@typespec/http/status-code-invalid", message });
      }

      it("emit diagnostic if status code is not a number", () =>
        checkInvalid(`"Ok"`, "statusCode value must be a three digit code between 100 and 599"));
      it("emit diagnostic if status code is a number with more than 3 digit", () =>
        checkInvalid("12345", "statusCode value must be a three digit code between 100 and 599"));
      it("emit diagnostic if status code is not an integer", () =>
        checkInvalid("200.3", "statusCode value must be a three digit code between 100 and 599"));
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
      });
    });

    it("emit diagnostics when description is not a string", async () => {
      const diagnostics = await runner.diagnose(`
        @server("https://example.com", 123)
        namespace MyService {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
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
    it("emit diagnostics when config is not a model, tuple or union", async () => {
      const diagnostics = await runner.diagnose(`
          @useAuth(anOp)
          namespace Foo {}

          op anOp(): void;
        `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
      });
    });

    it("emit diagnostic when OAuth2 flow is not a valid model", async () => {
      const diagnostics = await runner.diagnose(`
        @useAuth(OAuth2Auth<["foo"]>)
        namespace Foo {}

        model Flow { noscopes: "boom"; };
        @useAuth(OAuth2Auth<[Flow]>)
        namespace Bar {}
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-argument",
        },
        {
          code: "invalid-argument",
        },
      ]);
    });

    it("can specify BasicAuth", async () => {
      const { Foo } = (await runner.compile(`
        @useAuth(BasicAuth)
        @test namespace Foo {}
      `)) as { Foo: Namespace };

      expect(getAuthentication(runner.program, Foo)).toEqual({
        options: [
          {
            schemes: [
              {
                id: "BasicAuth",
                type: "http",
                scheme: "basic",
                model: expect.objectContaining({ kind: "Model" }),
              },
            ],
          },
        ],
      });
    });

    it("can specify custom auth name with description", async () => {
      const { Foo } = (await runner.compile(`
        @doc("My custom basic auth")
        model MyAuth is BasicAuth;
        @useAuth(MyAuth)
        @test namespace Foo {}
      `)) as { Foo: Namespace };

      expect(getAuthentication(runner.program, Foo)).toEqual({
        options: [
          {
            schemes: [
              {
                id: "MyAuth",
                description: "My custom basic auth",
                type: "http",
                scheme: "basic",
                model: expect.objectContaining({ kind: "Model" }),
              },
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

      expect(getAuthentication(runner.program, Foo)).toEqual({
        options: [
          {
            schemes: [
              {
                id: "BearerAuth",
                type: "http",
                scheme: "bearer",
                model: expect.objectContaining({ kind: "Model" }),
              },
            ],
          },
        ],
      });
    });

    it("can specify ApiKeyAuth", async () => {
      const { Foo } = (await runner.compile(`
        @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-my-header">)
        @test namespace Foo {}
      `)) as { Foo: Namespace };

      expect(getAuthentication(runner.program, Foo)).toEqual({
        options: [
          {
            schemes: [
              {
                id: "ApiKeyAuth",
                type: "apiKey",
                in: "header",
                name: "x-my-header",
                model: expect.objectContaining({ kind: "Model" }),
              },
            ],
          },
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

      expect(getAuthentication(runner.program, Foo)).toEqual({
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
                model: expect.objectContaining({ kind: "Model" }),
              },
            ],
          },
        ],
      });
    });

    it("can specify OAuth2 with scopes, which are default for every flow", async () => {
      const { Foo } = (await runner.compile(`
        alias MyAuth<T extends string[]> = OAuth2Auth<Flows=[{
          type: OAuth2FlowType.implicit;
          authorizationUrl: "https://api.example.com/oauth2/authorize";
          refreshUrl: "https://api.example.com/oauth2/refresh";
        }], Scopes=T>;

        @useAuth(MyAuth<["read", "write"]>)
        @test namespace Foo {}
      `)) as { Foo: Namespace };

      expect(getAuthentication(runner.program, Foo)).toEqual({
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
                model: expect.objectContaining({ kind: "Model" }),
              },
            ],
          },
        ],
      });
    });

    it("can specify NoAuth", async () => {
      const { Foo } = (await runner.compile(`
        @useAuth(NoAuth)
        @test namespace Foo {}
      `)) as { Foo: Namespace };

      expect(getAuthentication(runner.program, Foo)).toEqual({
        options: [
          {
            schemes: [
              {
                id: "NoAuth",
                type: "noAuth",
                model: expect.objectContaining({ kind: "Model" }),
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

      expect(getAuthentication(runner.program, Foo)).toEqual({
        options: [
          {
            schemes: [
              {
                id: "BasicAuth",
                type: "http",
                scheme: "basic",
                model: expect.objectContaining({ kind: "Model" }),
              },
            ],
          },
          {
            schemes: [
              {
                id: "BearerAuth",
                type: "http",
                scheme: "bearer",
                model: expect.objectContaining({ kind: "Model" }),
              },
            ],
          },
        ],
      });
    });

    it("can specify multiple auth schemes to be used together", async () => {
      const { Foo } = (await runner.compile(`
        @useAuth([BasicAuth, BearerAuth])
        @test namespace Foo {}
      `)) as { Foo: Namespace };

      expect(getAuthentication(runner.program, Foo)).toEqual({
        options: [
          {
            schemes: [
              {
                id: "BasicAuth",
                type: "http",
                scheme: "basic",
                model: expect.objectContaining({ kind: "Model" }),
              },
              {
                id: "BearerAuth",
                type: "http",
                scheme: "bearer",
                model: expect.objectContaining({ kind: "Model" }),
              },
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

      expect(getAuthentication(runner.program, Foo)).toEqual({
        options: [
          {
            schemes: [
              {
                id: "BearerAuth",
                type: "http",
                scheme: "bearer",
                model: expect.objectContaining({ kind: "Model" }),
              },
            ],
          },
          {
            schemes: [
              {
                id: "ApiKeyAuth",
                type: "apiKey",
                in: "header",
                name: "x-my-header",
                model: expect.objectContaining({ kind: "Model" }),
              },
              {
                id: "BasicAuth",
                type: "http",
                scheme: "basic",
                model: expect.objectContaining({ kind: "Model" }),
              },
            ],
          },
        ],
      });
    });

    it("can override auth schemes on interface", async () => {
      const { Foo } = (await runner.compile(`
        alias ServiceKeyAuth = ApiKeyAuth<ApiKeyLocation.header, "X-API-KEY">;
        @useAuth(ServiceKeyAuth)
        @test namespace Foo {
          @useAuth(BasicAuth | BearerAuth)
          interface Bar { }
        }
      `)) as { Foo: Namespace };

      expect(getAuthentication(runner.program, Foo.interfaces.get("Bar")!)).toEqual({
        options: [
          {
            schemes: [
              {
                id: "BasicAuth",
                type: "http",
                scheme: "basic",
                model: expect.objectContaining({ kind: "Model" }),
              },
            ],
          },
          {
            schemes: [
              {
                id: "BearerAuth",
                type: "http",
                scheme: "bearer",
                model: expect.objectContaining({ kind: "Model" }),
              },
            ],
          },
        ],
      });
    });

    it("can override auth schemes on operation", async () => {
      const { Foo } = (await runner.compile(`
        alias ServiceKeyAuth = ApiKeyAuth<ApiKeyLocation.header, "X-API-KEY">;
        @useAuth(ServiceKeyAuth)
        @test namespace Foo {
          @useAuth([BasicAuth, BearerAuth])
          op bar(): void;
        }
      `)) as { Foo: Namespace };

      expect(getAuthentication(runner.program, Foo.operations.get("bar")!)).toEqual({
        options: [
          {
            schemes: [
              {
                id: "BasicAuth",
                type: "http",
                scheme: "basic",
                model: expect.objectContaining({ kind: "Model" }),
              },
              {
                id: "BearerAuth",
                type: "http",
                scheme: "bearer",
                model: expect.objectContaining({ kind: "Model" }),
              },
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

  describe("@parameterVisibility", () => {
    it("ensures getRequestVisibility and resolveRequestVisibility return the same value for default PATCH operations", async () => {
      const { testPatch } = await runner.compile(`
      @patch
      @test op testPatch(): void;
      `);
      deepStrictEqual(
        // eslint-disable-next-line deprecation/deprecation
        getRequestVisibility("patch"),
        resolveRequestVisibility(runner.program, testPatch as Operation, "patch")
      );
    });

    it("ensures getRequestVisibility and resolveRequestVisibility return expected values for customized PATCH operations", async () => {
      const { testPatch } = await runner.compile(`
      @parameterVisibility("create", "update")
      @patch
      @test op testPatch(): void;
      `);
      // eslint-disable-next-line deprecation/deprecation
      deepStrictEqual(getRequestVisibility("patch"), Visibility.Update | Visibility.Patch);
      deepStrictEqual(
        resolveRequestVisibility(runner.program, testPatch as Operation, "patch"),
        Visibility.Update | Visibility.Create | Visibility.Patch
      );
    });
  });
});
