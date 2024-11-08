// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { deepStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { DecoratorContext, Enum, Model, ModelProperty } from "../../src/core/types.js";
import { getVisibility, getVisibilityForClass } from "../../src/core/visibility/core.js";
import { $visibility, getLifecycleVisibilityEnum } from "../../src/index.js";
import { BasicTestRunner, createTestRunner } from "../../src/testing/index.js";

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
    };

    assertSetsEqual(
      getVisibilityForClass(runner.program, name, LifecycleEnum),
      new Set([Lifecycle.Read, Lifecycle.Create, Lifecycle.Update]),
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
      const { TestModel } = (await runner.compile(
        `
        model OriginalModel {
          @key
          name: string;
        }

        @test
        model TestModel is DefaultKeyVisibility<OriginalModel, "read"> {
        } `,
      )) as { TestModel: Model };

      deepStrictEqual(getVisibility(runner.program, TestModel.properties.get("name")!), ["read"]);
    });

    it("allows visibility applied to a key property to override the default", async () => {
      const { TestModel } = (await runner.compile(
        `
        model OriginalModel {
          @key
          @visibility("read", "update")
          name: string;
        }

        @test
        model TestModel is DefaultKeyVisibility<OriginalModel, "create"> {
        } `,
      )) as { TestModel: Model };

      deepStrictEqual(getVisibility(runner.program, TestModel.properties.get("name")!), [
        "read",
        "update",
      ]);
    });

    it("allows overriding legacy visibility", async () => {
      const { Example } = (await runner.compile(`
        @test model Example {
          @visibility("read")
          name: string
        }
        `)) as { Example: Model };

      const name = Example.properties.get("name")!;

      const decCtx = {
        program: runner.program,
      } as DecoratorContext;

      $visibility(decCtx, name, "create");

      deepStrictEqual(getVisibility(runner.program, name), ["create"]);
    });
  });
});
