import { Operation } from "@typespec/compiler";
import { expectDiagnosticEmpty, expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { PathOptions } from "../generated-defs/TypeSpec.Http.js";
import { HttpOperation, HttpOperationParameter, getRoutePath } from "../src/index.js";
import {
  compileOperations,
  createHttpTestRunner,
  diagnoseOperations,
  getOperations,
  getRoutesFor,
} from "./test-host.js";

describe("http: routes", () => {
  // Describe how routes should be included.
  describe("route inclusion", () => {
    function expectRouteIncluded(routes: HttpOperation[], expectedRoutePaths: string[]) {
      const includedRoutes = routes.map((x) => x.path);
      deepStrictEqual(includedRoutes, expectedRoutePaths);
    }

    describe("when there is NO service namespace", () => {
      it("operations at the document root are included", async () => {
        const routes = await getOperations(`
          @route("/one")
          @get op one(): string;
          @route("/two")
          @get op two(): string;
        `);

        expectRouteIncluded(routes, ["/one", "/two"]);
      });

      it("interface at the document root are included", async () => {
        const routes = await getOperations(`
          interface Foo {
            @get index(): void;
          }
        `);

        expectRouteIncluded(routes, ["/"]);
      });

      it("generic operation at the document root are NOT included", async () => {
        const routes = await getOperations(`
          @route("/not-included")
          @get op index<T>(): T;
        `);

        expectRouteIncluded(routes, []);
      });

      it("generic interface at the document root are NOT included", async () => {
        const routes = await getOperations(`
          interface Foo<T> {
            @route("/not-included")
            @get index(): T;
          }
        `);

        expectRouteIncluded(routes, []);
      });

      it("routes inside a namespace not marked as the service namespace aren't be included", async () => {
        const routes = await getOperations(
          `
      namespace Foo {
        @get op index(): void;
      }
      `
        );

        deepStrictEqual(routes, []);
      });
    });

    describe("when there is a service namespace", () => {
      it("operation in the service namespace are included", async () => {
        const routes = await getOperations(
          `
          @service({title: "My Service"})
          namespace MyService;
          @get op index(): void;
          `
        );

        expectRouteIncluded(routes, ["/"]);
      });

      it("operation at the root of the document are NOT included", async () => {
        const routes = await getOperations(
          `
          @route("/not-included")
          @get op notIncluded(): void;

          @service({title: "My Service"})
          namespace MyService {
            @route("/included")
            @get op included(): void;
          }
          `
        );
        expectRouteIncluded(routes, ["/included"]);
      });

      it("interface in the service namespace are included", async () => {
        const routes = await getOperations(
          `
          @service({title: "My Service"})
          namespace MyService;
          interface Foo {
            @get index(): void;
          }`
        );

        expectRouteIncluded(routes, ["/"]);
      });

      it("operation in namespace in the service namespace are be included", async () => {
        const routes = await getOperations(
          `
          @service({title: "My Service"})
          namespace MyService;

          namespace MyArea{
            @get op index(): void;
          }
          `
        );

        expectRouteIncluded(routes, ["/"]);
      });

      it("operation in a different namespace are not included", async () => {
        const routes = await getOperations(
          `
          @service({title: "My Service"})
          namespace MyService {
            @route("/included")
            @get op test(): string;
          }

          namespace MyLib {
            @route("/not-included")
            @get op notIncluded(): void;
          }
          `
        );
        expectRouteIncluded(routes, ["/included"]);
      });
    });
  });

  describe("@route path parameters mapping", () => {
    it("maps route interpolated params to the operation param", async () => {
      const routes = await getRoutesFor(
        `@route("/foo/{myParam}") op test(@path myParam: string): void;`
      );
      deepStrictEqual(routes, [{ verb: "get", path: "/foo/{myParam}", params: ["myParam"] }]);
    });

    it("maps route interpolated params to the operation param when operation spread items", async () => {
      const routes = await getRoutesFor(
        `@route("/foo/{myParam}") op test(@path myParam: string, ...Record<string>): void;`
      );
      deepStrictEqual(routes, [{ verb: "post", path: "/foo/{myParam}", params: ["myParam"] }]);
    });

    it("emit diagnostic if interpolated param is missing in param list", async () => {
      const diagnostics = await diagnoseOperations(
        `@route("/foo/{myParam}/") op test(@path other: string): void;`
      );
      expectDiagnostics(diagnostics, {
        code: "@typespec/http/missing-uri-param",
        message: "Route reference parameter 'myParam' but wasn't found in operation parameters",
      });
    });
  });

  describe("path parameters when no explicit @route", () => {
    it("uses the name of the parameter by default and wraps in {}", async () => {
      const routes = await getRoutesFor(`op test(@path myParam: string): void;`);

      deepStrictEqual(routes, [{ verb: "get", path: "/{myParam}", params: ["myParam"] }]);
    });

    it("respect the name provided by @path argument", async () => {
      const routes = await getRoutesFor(`op test(@path("custom-name") myParam: string): void;`);

      deepStrictEqual(routes, [{ verb: "get", path: "/{custom-name}", params: ["custom-name"] }]);
    });

    it("respect the name provided by @path argument when being explicit in the route", async () => {
      const routes = await getRoutesFor(
        `@route("/foo/{custom-name}") op test(@path("custom-name") myParam: string): void;`
      );

      deepStrictEqual(routes, [
        { verb: "get", path: "/foo/{custom-name}", params: ["custom-name"] },
      ]);
    });
  });

  it("combines routes on namespaced bare operations", async () => {
    const routes = await getRoutesFor(
      `
      @route("/things")
      namespace Things {
        @get op GetThing(): string;

        @route("/{thingId}")
        @put op CreateThing(@path thingId: string): string;

        @route("/{thingId}/subthings")
        namespace Subthing {
          @get op GetSubthing(@path thingId: string): string;

          @route("/{subthingId}")
          @post op CreateSubthing(@path thingId: string, @path subthingId: string): string;
        }
      }
      `
    );

    deepStrictEqual(routes, [
      { verb: "get", path: "/things", params: [] },
      { verb: "put", path: "/things/{thingId}", params: ["thingId"] },
      { verb: "get", path: "/things/{thingId}/subthings", params: ["thingId"] },
      {
        verb: "post",
        path: "/things/{thingId}/subthings/{subthingId}",
        params: ["thingId", "subthingId"],
      },
    ]);
  });

  it("combines routes between namespaces and interfaces", async () => {
    const routes = await getRoutesFor(
      `
      @route("/things")
      namespace Things {
        @get op GetThing(): string;

        @route("/{thingId}")
        @put op CreateThing(@path thingId: string): string;

        @route("/{thingId}/subthings")
        interface Subthing {
          @get GetSubthing(@path thingId: string): string;

          @route("/{subthingId}")
          @post CreateSubthing(@path thingId: string, @path subthingId: string): string;
        }
      }
      `
    );

    deepStrictEqual(routes, [
      { verb: "get", path: "/things", params: [] },
      { verb: "put", path: "/things/{thingId}", params: ["thingId"] },
      { verb: "get", path: "/things/{thingId}/subthings", params: ["thingId"] },
      {
        verb: "post",
        path: "/things/{thingId}/subthings/{subthingId}",
        params: ["thingId", "subthingId"],
      },
    ]);
  });

  it("join empty route segments correctly", async () => {
    const routes = await getRoutesFor(
      `
      @route("")
      interface Foo {
        @get @route("") index(): {};
      }
      `
    );

    deepStrictEqual(routes, [{ verb: "get", path: "/", params: [] }]);
  });

  it("keeps trailing / at the end of the route", async () => {
    const routes = await getRoutesFor(
      `
      @route("/foo/") op index(): void;
      `
    );

    deepStrictEqual(routes, [{ verb: "get", path: "/foo/", params: [] }]);
  });

  it("merge trailing and leading / when combining container path", async () => {
    const routes = await getRoutesFor(
      `
      @route("/foo/")
      interface Foo {
        @route("/bar/") op index(): void;
      }
      `
    );

    deepStrictEqual(routes, [{ verb: "get", path: "/foo/bar/", params: [] }]);
  });

  it("join / route segments correctly", async () => {
    const routes = await getRoutesFor(
      `
      @route("/")
      interface Foo {
        @get @route("/") index(): {};
      }
      `
    );

    deepStrictEqual(routes, [{ verb: "get", path: "/", params: [] }]);
  });

  it("always produces a route starting with /", async () => {
    const routes = await getRoutesFor(
      `
      @get
      @route(":action")
      op colonRoute(): {};
      `
    );

    deepStrictEqual(routes, [{ verb: "get", path: "/:action", params: [] }]);
  });

  it("defaults to POST when operation has a body but didn't specify the verb", async () => {
    const routes = await getRoutesFor(`
        @route("/test")
        op get(@body body: string): string;
    `);

    deepStrictEqual(routes, [
      {
        verb: "post",
        path: "/test",
        params: [],
      },
    ]);
  });

  it("emit diagnostics if 2 operation have the same path and verb", async () => {
    const [_, diagnostics] = await compileOperations(`
        @route("/test")
        op get1(): string;

        @route("/test")
        op get2(): string;
    `);

    // Has one diagnostic per duplicate operation
    strictEqual(diagnostics.length, 2);
    strictEqual(diagnostics[0].code, "@typespec/http/duplicate-operation");
    strictEqual(diagnostics[0].message, `Duplicate operation "get1" routed at "get /test".`);
    strictEqual(diagnostics[1].code, "@typespec/http/duplicate-operation");
    strictEqual(diagnostics[1].message, `Duplicate operation "get2" routed at "get /test".`);
  });

  describe("double @route", () => {
    it("emit diagnostic if specifying route twice on operation", async () => {
      const [_, diagnostics] = await compileOperations(`
        @route("/test")
        @route("/test")
        op get(): string;
    `);
      expectDiagnostics(diagnostics, [
        {
          code: "duplicate-decorator",
          message: "Decorator @route cannot be used twice on the same declaration.",
        },
        {
          code: "duplicate-decorator",
          message: "Decorator @route cannot be used twice on the same declaration.",
        },
      ]);
    });

    it("emit diagnostic if specifying route twice on interface", async () => {
      const [_, diagnostics] = await compileOperations(`
        @route("/test")
        @route("/test")
        interface Foo {
          get(): string
        }
    `);
      expectDiagnostics(diagnostics, [
        {
          code: "duplicate-decorator",
          message: "Decorator @route cannot be used twice on the same declaration.",
        },
        {
          code: "duplicate-decorator",
          message: "Decorator @route cannot be used twice on the same declaration.",
        },
      ]);
    });

    it("emit diagnostic if namespace have route but different values", async () => {
      const [_, diagnostics] = await compileOperations(`
        @route("/test1")
        namespace Foo {
          @route("/get1")
          op get1(): string;
        }

        @route("/test2")
        namespace Foo {
          @route("/get2")
          op get2(): string;
        }
    `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/http/duplicate-route-decorator",
        message: "@route was defined twice on this namespace and has different values.",
      });
    });

    it("merge namespace if @route value is the same", async () => {
      const [_, diagnostics] = await compileOperations(`
        @route("/test")
        namespace Foo {
          @route("/get1")
          op get1(): string;
        }

        @route("/test")
        namespace Foo {
          @route("/get2")
          op get2(): string;
        }
    `);

      expectDiagnosticEmpty(diagnostics);
    });
  });

  it("skips templated operations", async () => {
    const routes = await getRoutesFor(
      `
      @route("/things")
      namespace Things {
        @get op GetThingBase<TResponse>(): TResponse;
        op GetThing is GetThingBase<string>;

        @route("/{thingId}")
        @put op CreateThing(@path thingId: string): string;
      }
      `
    );

    deepStrictEqual(routes, [
      { verb: "get", path: "/things", params: [] },
      { verb: "put", path: "/things/{thingId}", params: ["thingId"] },
    ]);
  });

  describe("shared routes", () => {
    it("@sharedRoute decorator makes routes shared", async () => {
      const runner = await createHttpTestRunner();
      const { get1, get2 } = (await runner.compile(`
        @route("/test")
        namespace Foo {
          @test
          @sharedRoute
          @route("/get1")
          op get1(): string;
        }

        @route("/test")
        namespace Foo {
          @test
          @route("/get2")
          op get2(): string;
        }
      `)) as { get1: Operation; get2: Operation };

      strictEqual(getRoutePath(runner.program, get1)?.shared, true);
      strictEqual(getRoutePath(runner.program, get2)?.shared, false);
    });

    it("legacy `shared: true parameter` still works", async () => {
      const runner = await createHttpTestRunner();
      const { get1, get2 } = (await runner.compile(`
        @route("/test")
        namespace Foo {
          #suppress "deprecated"
          @test
          @route("/get1", { shared: true })
          op get1(): string;
        }

        @route("/test")
        namespace Foo {
          #suppress "deprecated"
          @test
          @route("/get2", { shared: false })
          op get2(): string;
        }
      `)) as { get1: Operation; get2: Operation };

      strictEqual(getRoutePath(runner.program, get1)?.shared, true);
      strictEqual(getRoutePath(runner.program, get2)?.shared, false);
    });
  });
});

describe("uri template", () => {
  async function getOp(code: string) {
    const ops = await getOperations(code);
    return ops[0];
  }
  describe("extract implicit parameters", () => {
    async function getParameter(code: string, name: string) {
      const op = await getOp(code);
      const param = op.parameters.parameters.find((x) => x.name === name);
      ok(param);
      expect(param.name).toEqual(name);
      return param;
    }

    function expectPathParameter(param: HttpOperationParameter, expected: PathOptions) {
      strictEqual(param.type, "path");
      const { style, explode, allowReserved } = param;
      expect({ style, explode, allowReserved }).toEqual(expected);
    }

    it("extract simple path parameter", async () => {
      const param = await getParameter(`@route("/bar/{foo}") op foo(foo: string): void;`, "foo");
      expectPathParameter(param, { style: "simple", allowReserved: false, explode: false });
    });

    it("+ operator map to allowReserved", async () => {
      const param = await getParameter(`@route("/bar/{+foo}") op foo(foo: string): void;`, "foo");
      expectPathParameter(param, { style: "simple", allowReserved: true, explode: false });
    });

    it.each([
      [";", "matrix"],
      ["#", "fragment"],
      [".", "label"],
      ["/", "path"],
    ] as const)("%s map to style: %s", async (operator, style) => {
      const param = await getParameter(
        `@route("/bar/{${operator}foo}") op foo(foo: string): void;`,
        "foo"
      );
      expectPathParameter(param, { style, allowReserved: false, explode: false });
    });

    function expectQueryParameter(param: HttpOperationParameter, expected: PathOptions) {
      strictEqual(param.type, "query");
      const { explode } = param;
      expect({ explode }).toEqual(expected);
    }

    it("extract simple query parameter", async () => {
      const param = await getParameter(`@route("/bar{?foo}") op foo(foo: string): void;`, "foo");
      expectQueryParameter(param, { explode: false });
    });

    it("extract explode query parameter", async () => {
      const param = await getParameter(`@route("/bar{?foo*}") op foo(foo: string): void;`, "foo");
      expectQueryParameter(param, { explode: true });
    });

    it("extract simple query continuation parameter", async () => {
      const param = await getParameter(
        `@route("/bar?fixed=yes{&foo}") op foo(foo: string): void;`,
        "foo"
      );
      expectQueryParameter(param, { explode: false });
    });
  });

  describe("build uriTemplate from parameter", () => {
    it.each([
      ["@path one: string", "/foo/{one}"],
      ["@path(#{allowReserved: true}) one: string", "/foo/{+one}"],
      ["@path(#{explode: true}) one: string", "/foo/{one*}"],
      [`@path(#{style: "matrix"}) one: string`, "/foo/{;one}"],
      [`@path(#{style: "label"}) one: string`, "/foo/{.one}"],
      [`@path(#{style: "fragment"}) one: string`, "/foo/{#one}"],
      [`@path(#{style: "path"}) one: string`, "/foo/{/one}"],
      ["@path(#{allowReserved: true, explode: true}) one: string", "/foo/{+one*}"],
      ["@query one: string", "/foo{?one}"],
    ])("%s -> %s", async (param, expectedUri) => {
      const op = await getOp(`@route("/foo") op foo(${param}): void;`);
      expect(op.uriTemplate).toEqual(expectedUri);
    });
  });

  it("emit diagnostic when annotating a path parameter with @query", async () => {
    const diagnostics = await diagnoseOperations(
      `@route("/bar/{foo}") op foo(@query foo: string): void;`
    );
    expectDiagnostics(diagnostics, {
      code: "@typespec/http/incompatible-uri-param",
      message: "Parameter 'foo' is defined in the uri as a path but is annotated as a query.",
    });
  });

  it("emit diagnostic when annotating a query parameter with @path", async () => {
    const diagnostics = await diagnoseOperations(
      `@route("/bar/{?foo}") op foo(@path foo: string): void;`
    );
    expectDiagnostics(diagnostics, {
      code: "@typespec/http/incompatible-uri-param",
      message: "Parameter 'foo' is defined in the uri as a query but is annotated as a path.",
    });
  });

  it("emit diagnostic when annotating a query continuation parameter with @path", async () => {
    const diagnostics = await diagnoseOperations(
      `@route("/bar/?bar=def{&foo}") op foo(@path foo: string): void;`
    );
    expectDiagnostics(diagnostics, {
      code: "@typespec/http/incompatible-uri-param",
      message: "Parameter 'foo' is defined in the uri as a query but is annotated as a path.",
    });
  });

  describe("emit diagnostic if using any of the path options when parameter is already defined in the uri template", () => {
    it.each([
      "#{ allowReserved: true }",
      "#{ explode: true }",
      `#{ style: "label" }`,
      `#{ style: "matrix" }`,
      `#{ style: "fragment" }`,
      `#{ style: "path" }`,
    ])("%s", async (options) => {
      const diagnostics = await diagnoseOperations(
        `@route("/bar/{foo}") op foo(@path(${options}) foo: string): void;`
      );
      expectDiagnostics(diagnostics, {
        code: "@typespec/http/use-uri-template",
        message:
          "Parameter 'foo' is already defined in the uri template. Explode, style and allowReserved property must be defined in the uri template as described by RFC 6570.",
      });
    });
  });

  describe("emit diagnostic if using any of the query options when parameter is already defined in the uri template", () => {
    it.each(["#{ explode: true }"])("%s", async (options) => {
      const diagnostics = await diagnoseOperations(
        `@route("/bar{?foo}") op foo(@query(${options}) foo: string): void;`
      );
      expectDiagnostics(diagnostics, {
        code: "@typespec/http/use-uri-template",
        message:
          "Parameter 'foo' is already defined in the uri template. Explode, style and allowReserved property must be defined in the uri template as described by RFC 6570.",
      });
    });
  });
});
