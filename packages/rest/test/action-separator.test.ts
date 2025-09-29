import { expectDiagnostics } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { getActionSeparator } from "../src/rest.js";
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

    it("works on Interface and affects contained operations", async () => {
      const routes = await getRoutesFor(`
        @TypeSpec.Rest.actionSeparator(":")
        @autoRoute
        interface Things {
          @action
          @put op customAction(@segment("things") @path thingId: string): string;
        }
      `);

      strictEqual(routes.length, 1);
      strictEqual(routes[0].path, "/things/{thingId}:customAction");
    });

    it("stores separator value correctly", async () => {
      const { op1, program } = await Tester.compile(`
        @TypeSpec.Rest.actionSeparator(":")
        op op1(): void;
      `);

      const separator = getActionSeparator(program, op1);
      strictEqual(separator, ":");
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
            "Cannot apply @actionSeparator decorator to TestModel.id since it is not assignable to Operation | Interface | Namespace",
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