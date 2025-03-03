// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { deepStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import {
  DecoratorContext,
  Diagnostic,
  DiagnosticTarget,
  Enum,
  Model,
  ModelProperty,
  NoTarget,
} from "../../src/core/types.js";
import { getVisibility, getVisibilityForClass } from "../../src/core/visibility/core.js";
import { $visibility, getLifecycleVisibilityEnum } from "../../src/index.js";
import { BasicTestRunner, createTestRunner, expectDiagnostics } from "../../src/testing/index.js";

function assertSetsEqual<T>(a: Set<T>, b: Set<T>): void {
  strictEqual(a.size, b.size);

  for (const item of a) {
    ok(b.has(item));
  }
}

describe("visibility", function () {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  it("default visibility", async () => {
    const { name, Dummy } = (await runner.compile(`
        @test
        @defaultVisibility(Dummy.B)
        enum Dummy {
          A,
          B,
        }

        model TestModel {
          @test
          name: string;
        }`)) as { name: ModelProperty; Dummy: Enum };

    const LifecycleEnum = getLifecycleVisibilityEnum(runner.program);

    const Lifecycle = {
      Read: LifecycleEnum.members.get("Read")!,
      Create: LifecycleEnum.members.get("Create")!,
      Update: LifecycleEnum.members.get("Update")!,
      Delete: LifecycleEnum.members.get("Delete")!,
      Query: LifecycleEnum.members.get("Query")!,
    };

    assertSetsEqual(
      getVisibilityForClass(runner.program, name, LifecycleEnum),
      new Set([
        Lifecycle.Read,
        Lifecycle.Create,
        Lifecycle.Update,
        Lifecycle.Delete,
        Lifecycle.Query,
      ]),
    );

    assertSetsEqual(
      getVisibilityForClass(runner.program, name, Dummy),
      new Set([Dummy.members.get("B")!]),
    );
  });
});

describe("visibility (legacy)", function () {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  describe("@withDefaultKeyVisibility", () => {
    it("sets the default visibility on a key property when not already present", async () => {
      const [{ TestModel }, diagnostics] = (await runner.compileAndDiagnose(
        `
        model OriginalModel {
          @key
          name: string;
        }

        @test
        model TestModel is DefaultKeyVisibility<OriginalModel, "read"> {
        } `,
      )) as [{ TestModel: Model }, Diagnostic[]];

      deepStrictEqual(getVisibility(runner.program, TestModel.properties.get("name")!), ["read"]);

      expectDiagnostics(
        diagnostics,
        Array(2).fill({
          code: "visibility-legacy",
          severity: "warning",
        }),
      );
    });

    it("allows visibility applied to a key property to override the default", async () => {
      const [{ TestModel }, diagnostics] = (await runner.compileAndDiagnose(
        `
        model OriginalModel {
          @key
          @visibility("read", "update")
          name: string;
        }

        @test
        model TestModel is DefaultKeyVisibility<OriginalModel, "create"> {
        } `,
      )) as [{ TestModel: Model }, Diagnostic[]];

      deepStrictEqual(getVisibility(runner.program, TestModel.properties.get("name")!), [
        "read",
        "update",
      ]);

      expectDiagnostics(
        diagnostics,
        // 6 diagnostics. 2 for the original property, 2 for the key property cloned by DefaultKeyVisibility, and 2
        // for the property cloned by `model is`.
        Array(6).fill({
          code: "visibility-legacy",
          severity: "warning",
        }),
      );
    });

    it("allows overriding legacy visibility", async () => {
      const [{ Example }, diagnostics] = (await runner.compileAndDiagnose(`
        @test model Example {
          @visibility("read")
          name: string
        }
        `)) as [{ Example: Model }, Diagnostic[]];

      expectDiagnostics(diagnostics, {
        code: "visibility-legacy",
        severity: "warning",
      });

      const name = Example.properties.get("name")!;

      const decCtx = {
        program: runner.program,
        getArgumentTarget(_) {
          return NoTarget as unknown as DiagnosticTarget;
        },
      } as DecoratorContext;

      $visibility(decCtx, name, "create");

      deepStrictEqual(getVisibility(runner.program, name), ["create"]);

      expectDiagnostics(
        runner.program.diagnostics,
        Array(2).fill({ code: "visibility-legacy", severity: "warning" }),
      );
    });
  });
});
