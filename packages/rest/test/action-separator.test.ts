import { expectDiagnostics } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { Tester, getRoutesFor } from "./test-host.js";

describe("rest: @actionSeparator decorator", () => {
  describe("valid targets", () => {
    it("works on Operation and affects routing", async () => {
      const routes = await getRoutesFor(`
        @autoRoute
        interface Things {
          @action
          @TypeSpec.Rest.actionSeparator(":")
          @put op customAction(@segment("things") @path thingId: string): string;
        }
      `);

      strictEqual(routes.length, 1);
      strictEqual(routes[0].path, "/things/{thingId}:customAction");
    });

    it("accepts Interface as target without compilation errors", async () => {
      // This test verifies that @actionSeparator can be applied to interfaces without errors
      const diagnostics = await Tester.diagnose(`
        @TypeSpec.Rest.actionSeparator(":")
        interface TestInterface {
          op test(): void;
        }
      `);

      // No diagnostics means the decorator accepts interfaces as valid targets
      strictEqual(diagnostics.length, 0);
    });

    it("accepts Namespace as target without compilation errors", async () => {
      // This test verifies that @actionSeparator can be applied to namespaces without errors
      const diagnostics = await Tester.diagnose(`
        @TypeSpec.Rest.actionSeparator(":")
        namespace TestNamespace {
          op test(): void;
        }
      `);

      // No diagnostics means the decorator accepts namespaces as valid targets
      strictEqual(diagnostics.length, 0);
    });

    it("supports all separator values in routing", async () => {
      const routes = await getRoutesFor(`
        @autoRoute
        interface Things {
          @action
          @TypeSpec.Rest.actionSeparator("/")
          @put op action1(@segment("things") @path thingId: string): string;

          @action
          @TypeSpec.Rest.actionSeparator(":")
          @put op action2(@segment("things") @path thingId: string): string;

          @action
          @TypeSpec.Rest.actionSeparator("/:")
          @put op action3(@segment("things") @path thingId: string): string;
        }
      `);

      strictEqual(routes.length, 3);
      strictEqual(routes[0].path, "/things/{thingId}/action1");
      strictEqual(routes[1].path, "/things/{thingId}:action2");
      strictEqual(routes[2].path, "/things/{thingId}/:action3");
    });
  });

  describe("hierarchy behavior", () => {
    it("interface-level separator applies to all actions in interface", async () => {
      const routes = await getRoutesFor(`
        @autoRoute
        @TypeSpec.Rest.actionSeparator(":")
        interface Things {
          @action
          @put op action1(@segment("things") @path thingId: string): string;

          @action
          @put op action2(@segment("things") @path thingId: string): string;
        }
      `);

      strictEqual(routes.length, 2);
      strictEqual(routes[0].path, "/things/{thingId}:action1");
      strictEqual(routes[1].path, "/things/{thingId}:action2");
    });

    it("namespace-level separator applies to all actions in namespace", async () => {
      const routes = await getRoutesFor(`
        @TypeSpec.Rest.actionSeparator(":")
        namespace TestNs {
          @autoRoute
          interface Things {
            @action
            @put op action1(@segment("things") @path thingId: string): string;
          }
        }
      `);

      strictEqual(routes.length, 1);
      strictEqual(routes[0].path, "/things/{thingId}:action1");
    });

    it("operation-level separator overrides interface-level separator", async () => {
      const routes = await getRoutesFor(`
        @autoRoute
        @TypeSpec.Rest.actionSeparator(":")
        interface Things {
          @action
          @TypeSpec.Rest.actionSeparator("/")
          @put op action1(@segment("things") @path thingId: string): string;

          @action
          @put op action2(@segment("things") @path thingId: string): string;
        }
      `);

      strictEqual(routes.length, 2);
      strictEqual(routes[0].path, "/things/{thingId}/action1"); // Uses operation-level "/"
      strictEqual(routes[1].path, "/things/{thingId}:action2"); // Uses interface-level ":"
    });

    it("interface-level separator overrides namespace-level separator", async () => {
      const routes = await getRoutesFor(`
        @TypeSpec.Rest.actionSeparator("/:")
        namespace TestNs {
          @autoRoute
          @TypeSpec.Rest.actionSeparator(":")
          interface Things {
            @action
            @put op action1(@segment("things") @path thingId: string): string;
          }
          
          @autoRoute
          interface Other {
            @action
            @put op action2(@segment("other") @path otherId: string): string;
          }
        }
      `);

      strictEqual(routes.length, 2);
      strictEqual(routes[0].path, "/things/{thingId}:action1"); // Uses interface-level ":"
      strictEqual(routes[1].path, "/other/{otherId}/:action2"); // Uses namespace-level "/:"
    });

    it("namespace separator applies to subnamespaces", async () => {
      const routes = await getRoutesFor(`
        @TypeSpec.Rest.actionSeparator(":")
        namespace Parent {
          namespace Child {
            @autoRoute
            interface Things {
              @action
              @put op action1(@segment("things") @path thingId: string): string;
            }
          }
        }
      `);

      strictEqual(routes.length, 1);
      strictEqual(routes[0].path, "/things/{thingId}:action1"); // Uses parent namespace-level ":"
    });

    it("operation in namespace without interface uses namespace separator", async () => {
      const routes = await getRoutesFor(`
        @TypeSpec.Rest.actionSeparator(":")
        namespace TestNs {
          @autoRoute
          @action
          @put op action1(@segment("things") @path thingId: string): string;
        }
      `);

      strictEqual(routes.length, 1);
      strictEqual(routes[0].path, "/things/{thingId}:action1");
    });
  });

  describe("invalid targets", () => {
    it("rejects Model", async () => {
      const diagnostics = await Tester.diagnose(`
        @TypeSpec.Rest.actionSeparator(":")
        model TestModel {
          id: string;
        }
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message:
            "Cannot apply @actionSeparator decorator to TestModel since it is not assignable to Operation | Interface | Namespace",
        },
      ]);
    });

    it("rejects ModelProperty", async () => {
      const diagnostics = await Tester.diagnose(`
        model TestModel {
          @TypeSpec.Rest.actionSeparator(":")
          id: string;
        }
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message:
            /Cannot apply @actionSeparator decorator to .* since it is not assignable to Operation \| Interface \| Namespace/,
        },
      ]);
    });

    it("rejects invalid separator values", async () => {
      const diagnostics = await Tester.diagnose(`
        @TypeSpec.Rest.actionSeparator("invalid")
        op test(): void;
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-argument",
        },
      ]);
    });
  });
});
