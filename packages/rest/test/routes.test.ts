import { ModelProperty, Operation } from "@typespec/compiler";
import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, strictEqual } from "assert";
import { compileOperations, getOperations, getRoutesFor } from "./test-host.js";

describe("rest: routes", () => {
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
      interface Things {
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
      using TypeSpec.Rest.Resource;

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

        namespace SubNamespace {
          @autoRoute
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
      interface Things {
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

  it("emit diagnostic if passing arguments to autoroute decorators", async () => {
    const [_, diagnostics] = await compileOperations(`
      @autoRoute("/test") op test(): string;
    `);

    expectDiagnostics(diagnostics, {
      code: "invalid-argument-count",
      message: "Expected 0 arguments, but got 1.",
    });
  });

  describe("use of @route with @autoRoute", () => {
    it("can override library operation route in service", async () => {
      const ops = await getOperations(`
        namespace Lib {
          @route("one")
          op action(): void;
        }

        @service({title: "Test"})
        namespace Test {
          op my is Lib.action;
          @route("my")
          op my2 is Lib.action;
        }
      `);
      strictEqual(ops[0].verb, "get");
      strictEqual(ops[0].path, "/one");
      strictEqual(ops[1].verb, "get");
      strictEqual(ops[1].path, "/my");
    });

    it("can override library interface route in service", async () => {
      const ops = await getOperations(`
        namespace Lib {
          @route("one")
          interface Ops {
            action(): void;
          }
        }

        @service({title: "Test"})
        namespace Test {
          interface Mys extends Lib.Ops {
          }

          @route("my") interface Mys2 extends Lib.Ops {}
        }
      `);
      strictEqual(ops[0].verb, "get");
      strictEqual(ops[0].path, "/");
      strictEqual(ops[1].verb, "get");
      strictEqual(ops[1].path, "/my");
    });

    it("can override library interface route in service without changing library", async () => {
      const ops = await getOperations(`
        namespace Lib {
          @route("one")
          interface Ops {
            action(): void;
          }
        }

        @service({title: "Test"})
        namespace Test {
          @route("my") interface Mys2 extends Lib.Ops {}

          op op2 is Lib.Ops.action;
        }
      `);
      strictEqual(ops[1].verb, "get");
      strictEqual(ops[1].path, "/my");
      strictEqual(ops[1].container.kind, "Interface");
      strictEqual(ops[0].verb, "get");
      strictEqual(ops[0].path, "/");
      strictEqual(ops[0].container.kind, "Namespace");
    });

    it("prepends @route in service when library operation uses @autoRoute", async () => {
      const ops = await getOperations(`
        namespace Lib {
          @autoRoute
          op action(@path @segment("pets") id: string): void;
        }

        @service({title: "Test"})
        namespace Test {
          op my is Lib.action;

          @route("my")
          op my2 is Lib.action;
        }
      `);
      strictEqual(ops[0].verb, "get");
      strictEqual(ops[0].path, "/pets/{id}");
      strictEqual(ops[1].verb, "get");
      strictEqual(ops[1].path, "/my/pets/{id}");
    });

    it("prepends @route in service when library interface operation uses @autoRoute", async () => {
      const ops = await getOperations(`
        namespace Lib {
          interface Ops {
            @autoRoute
            action(@path @segment("pets") id: string): void;  
          }
        }

        @service({title: "Test"})
        namespace Test {
          interface Mys extends Lib.Ops {}
          @route("my")
          interface Mys2 extends Lib.Ops {};
        }
      `);
      strictEqual(ops[0].verb, "get");
      strictEqual(ops[0].path, "/pets/{id}");
      strictEqual(ops[1].verb, "get");
      strictEqual(ops[1].path, "/my/pets/{id}");
    });

    it("prepends @route in service when library interface uses @autoRoute", async () => {
      const ops = await getOperations(`
        namespace Lib {
          @autoRoute
          interface Ops {
            action(@path @segment("pets") id: string): void;  
          }
        }

        @service({title: "Test"})
        namespace Test {
          interface Mys extends Lib.Ops {}
          @route("my")
          interface Mys2 extends Lib.Ops {};
        }
      `);
      strictEqual(ops[0].verb, "get");
      strictEqual(ops[0].path, "/pets/{id}");
      strictEqual(ops[1].verb, "get");
      strictEqual(ops[1].path, "/my/pets/{id}");
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
          routeParamFilter: (_: Operation, param: ModelProperty) => {
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
      interface Things {
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
      interface Things {
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
      interface Things {
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
