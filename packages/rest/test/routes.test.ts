import { expectDiagnosticEmpty, expectDiagnostics } from "@cadl-lang/compiler/testing";
import { deepStrictEqual, strictEqual } from "assert";
import { HttpOperation } from "../src/http/types.js";
import { compileOperations, getOperations, getRoutesFor } from "./test-host.js";

describe("rest: routes", () => {
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

      @get
      @autoRoute
      @action("actionTwo")
      @actionSeparator(":")
      op separatorRoute(): {};
      `
    );

    deepStrictEqual(routes, [
      { verb: "get", path: "/:action", params: [] },
      { verb: "get", path: "/:actionTwo", params: [] },
    ]);
  });

  it("generates action route fragments when @action is applied", async () => {
    const routes = await getRoutesFor(
      `
      model ThingId {
        @path
        @segment("things")
        thingId: string;
      }

      @autoRoute
      namespace Things {
        @get
        @action
        op ActionOne(...ThingId): string;

        @action("customActionTwo")
        @put op ActionTwo(...ThingId): string;

        @action
        op ActionThree(...ThingId, @body bodyParam: string): string;
      }
      `
    );

    deepStrictEqual(routes, [
      { verb: "get", path: "/things/{thingId}/actionOne", params: ["thingId"] },
      { verb: "put", path: "/things/{thingId}/customActionTwo", params: ["thingId"] },
      { verb: "post", path: "/things/{thingId}/actionThree", params: ["thingId"] },
    ]);
  });

  it("automatically generates routes for operations in various scopes when specified", async () => {
    const routes = await getRoutesFor(
      `
      using Cadl.Rest.Resource;

      @route("/api")
      namespace Things {
        model Thing {
          @key
          @segment("things")
          thingId: string;
        }

        model Subthing {
          @key
          @segment("subthings")
          subthingId: string;
        }

        @get op GetThing(): string;

        @autoRoute
        @get op GetThingWithParams(...KeysOf<Thing>): string;

        @autoRoute
        namespace SubNamespace {
          @put op CreateThing(...KeysOf<Thing>): string;
        }

        @autoRoute
        interface SubInterface {
          @get
          @list(Subthing)
          @segmentOf(Subthing)
          GetSubthings(...KeysOf<Thing>): string;

          @post CreateSubthing(...KeysOf<Thing>, ...KeysOf<Subthing>): string;
        }
      }
      `
    );

    deepStrictEqual(routes, [
      { verb: "get", path: "/api", params: [] },
      { verb: "get", path: "/api/things/{thingId}", params: ["thingId"] },
      { verb: "put", path: "/api/things/{thingId}", params: ["thingId"] },
      { verb: "get", path: "/api/things/{thingId}/subthings", params: ["thingId"] },
      {
        verb: "post",
        path: "/api/things/{thingId}/subthings/{subthingId}",
        params: ["thingId", "subthingId"],
      },
    ]);
  });

  it("autoRoute operations filter out path parameters with a string literal type", async () => {
    const routes = await getRoutesFor(
      `
      model ThingId {
        @path
        @segment("things")
        thingId: string;
      }

      @autoRoute
      namespace Things {
        @get
        op WithFilteredParam(
          @path
          @segment("subscriptions")
          subscriptionId: string,

          @path
          @segment("providers")
          provider: "Microsoft.Things",
          ...ThingId
        ): string;
      }
      `
    );

    deepStrictEqual(routes, [
      {
        verb: "get",
        path: "/subscriptions/{subscriptionId}/providers/Microsoft.Things/things/{thingId}",
        params: ["subscriptionId", "thingId"],
      },
    ]);
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
    strictEqual(diagnostics[0].code, "@cadl-lang/rest/duplicate-operation");
    strictEqual(diagnostics[0].message, `Duplicate operation "get1" routed at "get /test".`);
    strictEqual(diagnostics[1].code, "@cadl-lang/rest/duplicate-operation");
    strictEqual(diagnostics[1].message, `Duplicate operation "get2" routed at "get /test".`);
  });

  it("emit diagnostic if passing arguments to autoroute decorators", async () => {
    const [_, diagnostics] = await compileOperations(`
      @autoRoute("/test") op test(): string;
    `);

    expectDiagnostics(diagnostics, {
      code: "invalid-argument-count",
      message: "Expected 0 arguments, but got 1.",
    });
  });

  describe("operation parameters", () => {
    it("emit diagnostic for parameters with multiple http request annotations", async () => {
      const [_, diagnostics] = await compileOperations(`
        @route("/test")
        @get op get(@body body: string, @path @query multiParam: string): string;
      `);

      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/rest/operation-param-duplicate-type",
        message: "Param multiParam has multiple types: [query, path]",
      });
    });

    it("emit diagnostic when there is an unannotated parameter and a @body param", async () => {
      const [_, diagnostics] = await compileOperations(`
        @route("/test")
        @get op get(param1: string, @body param2: string): string;
      `);

      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/rest/duplicate-body",
        message:
          "Operation has a @body and an unannotated parameter. There can only be one representing the body",
      });
    });

    it("emit diagnostic when there are multiple @body param", async () => {
      const [_, diagnostics] = await compileOperations(`
        @route("/test")
        @get op get(@query select: string, @body param1: string, @body param2: string): string;
      `);

      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/rest/duplicate-body",
        message: "Operation has multiple @body parameters declared",
      });
    });

    it("emit error if using multipart/form-data contentType parameter with a body not being a model", async () => {
      const [_, diagnostics] = await compileOperations(`
        @route("/test")
        @get op get(@header contentType: "multipart/form-data", @body body: string | int32): string;
      `);

      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/rest/multipart-model",
        message: "Multipart request body must be a model.",
      });
    });

    it("emit warning if using contentType parameter without a body", async () => {
      const [_, diagnostics] = await compileOperations(`
        @route("/test")
        @get op get(@header contentType: "image/png"): string;
      `);

      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/rest/content-type-ignored",
        message: "`Content-Type` header ignored because there is no body.",
      });
    });

    it("resolve body when defined with @body", async () => {
      const [routes, diagnostics] = await compileOperations(`
        @route("/test")
        @get op get(@query select: string, @body bodyParam: string): string;
      `);

      expectDiagnosticEmpty(diagnostics);
      deepStrictEqual(routes, [
        {
          verb: "get",
          path: "/test",
          params: { params: [{ type: "query", name: "select" }], body: "bodyParam" },
        },
      ]);
    });

    it("resolves single unannotated parameter as request body", async () => {
      const [routes, diagnostics] = await compileOperations(`
        @route("/test")
        @get op get(@query select: string, unannotatedBodyParam: string): string;
      `);

      expectDiagnosticEmpty(diagnostics);
      deepStrictEqual(routes, [
        {
          verb: "get",
          path: "/test",
          params: {
            params: [{ type: "query", name: "select" }],
            body: ["unannotatedBodyParam"],
          },
        },
      ]);
    });

    it("resolves multiple unannotated parameters as request body", async () => {
      const [routes, diagnostics] = await compileOperations(`
        @route("/test")
        @get op get(
          @query select: string,
          unannotatedBodyParam1: string,
          unannotatedBodyParam2: string): string;
      `);

      expectDiagnosticEmpty(diagnostics);
      deepStrictEqual(routes, [
        {
          verb: "get",
          path: "/test",
          params: {
            params: [{ type: "query", name: "select" }],
            body: ["unannotatedBodyParam1", "unannotatedBodyParam2"],
          },
        },
      ]);
    });

    it("resolves unannotated path parameters that are included in the route path", async () => {
      const [routes, diagnostics] = await compileOperations(`
        @route("/test/{name}/sub/{foo}")
        @get op get(
          name: string,
          foo: string
        ): string;

        @route("/nested/{name}")
        namespace A {
          @route("sub")
          namespace B {
            @route("{bar}")
            @get op get(
              name: string,
              bar: string
            ): string;
          }
        }
      `);

      expectDiagnosticEmpty(diagnostics);
      deepStrictEqual(routes, [
        {
          verb: "get",
          path: "/test/{name}/sub/{foo}",
          params: {
            params: [
              { type: "path", name: "name" },
              { type: "path", name: "foo" },
            ],
            body: undefined,
          },
        },
        {
          verb: "get",
          path: "/nested/{name}/sub/{bar}",
          params: {
            params: [
              { type: "path", name: "name" },
              { type: "path", name: "bar" },
            ],
            body: undefined,
          },
        },
      ]);
    });
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
        code: "@cadl-lang/rest/duplicate-route-decorator",
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

  describe("use of @route with @autoRoute", () => {
    it("can override library operation route in service", async () => {
      const routes = await getRoutesFor(`
        namespace Lib {
          @route("one")
          op action(): void;
        }

        namespace Test {
          op my is Lib.action;
          @route("my")
          op my2 is Lib.action;
        }
      `);
      deepStrictEqual(routes, [
        { verb: "get", path: "/one" },
        { verb: "get", path: "/my" },
      ]);
    });

    it("can override library interface route in service", async () => {
      const routes = await getRoutesFor(`
        namespace Lib {
          @route("one")
          interface Ops {
            action(): void;
          }
        }

        namespace Test {
          interface Mys extends Lib.Ops {
          }

          @route("my") interface Mys2 extends Lib.Ops {}

          op my is Lib.Ops.action;
        }
      `);
      deepStrictEqual(routes, [
        { verb: "get", path: "/" },
        { verb: "get", path: "/my" },
        { verb: "get", path: "/" },
      ]);
    });

    it("prepends @route in service when library operation uses @autoRoute", async () => {
      const routes = await getRoutesFor(`
        namespace Lib {
          @autoRoute
          op action(@path @segment("pets") id: string): void;
        }

        namespace Test {
          op my is Lib.action;
          @route("my")
          op my2 is Lib.action;
        }
      `);
      deepStrictEqual(routes, [
        { verb: "get", path: "/pets/{id}" },
        { verb: "get", path: "/my/pets/{id}" },
      ]);
    });

    it("prepends @route in service when library interface operation uses @autoRoute", async () => {
      const routes = await getRoutesFor(`
        namespace Lib {
          interface Ops {
            @autoRoute
            action(@path @segment("pets") id: string): void;  
          }
        }

        namespace Test {
          interface Mys extends Lib.Ops {}
          @route("my")
          interface Mys2 extends Lib.Ops {};
        }
      `);
      deepStrictEqual(routes, [
        { verb: "get", path: "/pets/{id}" },
        { verb: "get", path: "/my/pets/{id}" },
      ]);
    });

    it("prepends @route in service when library interface uses @autoRoute", async () => {
      const routes = await getRoutesFor(`
        namespace Lib {
          @autoRoute
          interface Ops {
            action(@path @segment("pets") id: string): void;  
          }
        }

        namespace Test {
          interface Mys extends Lib.Ops {}
          @route("my")
          interface Mys2 extends Lib.Ops {};
        }
      `);
      deepStrictEqual(routes, [
        { verb: "get", path: "/{id}" },
        { verb: "get", path: "/my/{id}" },
      ]);
    });
  });

  it("allows customization of path parameters in generated routes", async () => {
    const routes = await getRoutesFor(
      `
      @get
      @autoRoute
      op TestRoute(
        @path
        @segment("things")
        thingId: string;

        @path
        @segment("subthings")
        subThingId: string;
      ): string;
      `,
      {
        autoRouteOptions: {
          routeParamFilter: (_, param) => {
            return {
              routeParamString: param.name === "subThingId" ? "bar" : "{foo}",
              excludeFromOperationParams: true,
            };
          },
        },
      }
    );

    deepStrictEqual(routes, [{ verb: "get", path: "/things/{foo}/subthings/bar", params: [] }]);
  });

  it("allows customization of segment separators", async () => {
    const routes = await getRoutesFor(
      `
      @autoRoute
      namespace Things {
        @action
        @actionSeparator(":")
        @put op customAction(
          @segment("things")
          @path thingId: string
        ): string;
      }
      `
    );

    deepStrictEqual(routes, [
      { verb: "put", path: "/things/{thingId}:customAction", params: ["thingId"] },
    ]);
  });

  it("allows customization of action separators", async () => {
    const routes = await getRoutesFor(
      `
      @autoRoute
      namespace Things {
        @action
        @actionSeparator(":")
        @put op customAction1(
          @segment("things")
          @path thingId: string
        ): string;

        @action
        @actionSeparator("/")
        @put op customAction2(
          @segment("things")
          @path thingId: string
        ): string;

        @action
        @actionSeparator("/:")
        @put op customAction3(
          @segment("things")
          @path thingId: string
        ): string;
      }
      `
    );
    deepStrictEqual(routes, [
      { verb: "put", path: "/things/{thingId}:customAction1", params: ["thingId"] },
      { verb: "put", path: "/things/{thingId}/customAction2", params: ["thingId"] },
      { verb: "put", path: "/things/{thingId}/:customAction3", params: ["thingId"] },
    ]);
  });

  it("emits error if invalid action separator used", async () => {
    const [_, diagnostics] = await compileOperations(
      `
      @autoRoute
      namespace Things {
        @action
        @actionSeparator("x")
        @put op customAction(
          @segment("things")
          @path thingId: string
        ): string;
      }
      `
    );
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "invalid-argument");
    strictEqual(
      diagnostics[0].message,
      `Argument 'x' is not assignable to parameter of type '/ | : | /:'`
    );
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
});
