// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { VisibilityFilter } from "../src/core/visibility/core.js";
import {
  addVisibilityModifiers,
  clearVisibilityModifiersForClass,
  Enum,
  getLifecycleVisibilityEnum,
  getVisibilityForClass,
  hasVisibility,
  isSealed,
  isVisible,
  Model,
  ModelProperty,
  removeVisibilityModifiers,
  resetVisibilityModifiersForClass,
  sealVisibilityModifiers,
  sealVisibilityModifiersForProgram,
} from "../src/index.js";
import { BasicTestRunner, createTestRunner, expectDiagnostics } from "../src/testing/index.js";

describe("compiler: visibility core", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  it("produces correct lifecycle visibility enum reference", async () => {
    const { lifecycle } = (await runner.compile(`
      model X {
        @test lifecycle: TypeSpec.Lifecycle;
      }
    `)) as { lifecycle: ModelProperty };

    const lifecycleEnum = getLifecycleVisibilityEnum(runner.program);

    strictEqual(lifecycleEnum, lifecycle.type);
    strictEqual(lifecycleEnum, runner.program.resolveTypeReference("TypeSpec.Lifecycle")[0]);
  });

  describe("visibility seals", () => {
    it("seals visibility modifiers for a program", async () => {
      const { Example, Dummy } = (await runner.compile(`
        @test model Example {
          x: string;
        }

        @test enum Dummy {}
      `)) as { Example: Model; Dummy: Enum };

      const x = Example.properties.get("x")!;

      const lifecycle = getLifecycleVisibilityEnum(runner.program);

      ok(!isSealed(runner.program, x));
      ok(!isSealed(runner.program, x, lifecycle));
      ok(!isSealed(runner.program, x, Dummy));

      sealVisibilityModifiersForProgram(runner.program);

      ok(isSealed(runner.program, x));
      ok(isSealed(runner.program, x, lifecycle));
      ok(isSealed(runner.program, x, Dummy));
    });

    it("seals visibility modifiers for a visibility class", async () => {
      const { Example, Dummy } = (await runner.compile(`
        @test model Example {
          x: string;
        }

        @test enum Dummy {}
      `)) as { Example: Model; Dummy: Enum };

      const x = Example.properties.get("x")!;

      const lifecycle = getLifecycleVisibilityEnum(runner.program);

      ok(!isSealed(runner.program, x));
      ok(!isSealed(runner.program, x, lifecycle));
      ok(!isSealed(runner.program, x, Dummy));

      sealVisibilityModifiers(runner.program, x, lifecycle);

      ok(!isSealed(runner.program, x));
      ok(isSealed(runner.program, x, lifecycle));
      ok(!isSealed(runner.program, x, Dummy));
    });

    it("seals visibility modifiers for a property", async () => {
      const { Example, Dummy } = (await runner.compile(`
        @test model Example {
          x: string;
          y: string;
        }

        @test enum Dummy {}
      `)) as { Example: Model; Dummy: Enum };

      const x = Example.properties.get("x")!;
      const y = Example.properties.get("y")!;

      const lifecycle = getLifecycleVisibilityEnum(runner.program);

      ok(!isSealed(runner.program, x));
      ok(!isSealed(runner.program, x, lifecycle));
      ok(!isSealed(runner.program, x, Dummy));

      ok(!isSealed(runner.program, y));
      ok(!isSealed(runner.program, y, lifecycle));
      ok(!isSealed(runner.program, y, Dummy));

      sealVisibilityModifiers(runner.program, x);

      ok(isSealed(runner.program, x));
      ok(isSealed(runner.program, x, lifecycle));
      ok(isSealed(runner.program, x, Dummy));

      ok(!isSealed(runner.program, y));
      ok(!isSealed(runner.program, y, lifecycle));
      ok(!isSealed(runner.program, y, Dummy));
    });

    it("correctly diagnoses modifying sealed visibility", async () => {
      const { Example } = (await runner.compile(`
        @test model Example {
          x: string;
        }
      `)) as { Example: Model };

      const x = Example.properties.get("x")!;

      const Lifecycle = getLifecycleVisibilityEnum(runner.program);
      const Create = Lifecycle.members.get("Create")!;

      sealVisibilityModifiersForProgram(runner.program);

      addVisibilityModifiers(runner.program, x, [Create]);
      removeVisibilityModifiers(runner.program, x, [Create]);
      clearVisibilityModifiersForClass(runner.program, x, Lifecycle);

      ok(runner.program.diagnostics.length === 3);

      expectDiagnostics(runner.program.diagnostics, [
        {
          code: "visibility-sealed",
          message: "Visibility of property 'x' is sealed and cannot be changed.",
        },
        {
          code: "visibility-sealed",
          message: "Visibility of property 'x' is sealed and cannot be changed.",
        },
        {
          code: "visibility-sealed",
          message: "Visibility of property 'x' is sealed and cannot be changed.",
        },
      ]);
    });
  });

  describe("visibility modifiers", () => {
    it("default visibility modifiers are all modifiers", async () => {
      const { Example, Dummy } = (await runner.compile(`
        @test model Example {
          x: string;
        }

        @test
        @defaultVisibility(Dummy.A)
        enum Dummy {
          A,
          B,
        }
      `)) as { Example: Model; Dummy: Enum };

      const x = Example.properties.get("x")!;

      const Lifecycle = getLifecycleVisibilityEnum(runner.program);

      const visibility = getVisibilityForClass(runner.program, x, Lifecycle);

      strictEqual(visibility.size, Lifecycle.members.size);
      for (const member of Lifecycle.members.values()) {
        ok(visibility.has(member));
        ok(hasVisibility(runner.program, x, member));
      }

      const dummyVisibility = getVisibilityForClass(runner.program, x, Dummy);

      strictEqual(dummyVisibility.size, 1);
      ok(dummyVisibility.has(Dummy.members.get("A")!));
      ok(hasVisibility(runner.program, x, Dummy.members.get("A")!));
      ok(!dummyVisibility.has(Dummy.members.get("B")!));
      ok(!hasVisibility(runner.program, x, Dummy.members.get("B")!));
    });

    it("adds a visibility modifier", async () => {
      const { Example } = (await runner.compile(`
        @test model Example {
          x: string;
        }
      `)) as { Example: Model };

      const x = Example.properties.get("x")!;

      const Lifecycle = getLifecycleVisibilityEnum(runner.program);
      const Create = Lifecycle.members.get("Create")!;

      addVisibilityModifiers(runner.program, x, [Create]);

      const visibility = getVisibilityForClass(runner.program, x, Lifecycle);

      strictEqual(visibility.size, 1);

      for (const member of Lifecycle.members.values()) {
        if (member !== Create) {
          ok(!visibility.has(member));
          ok(!hasVisibility(runner.program, x, member));
        } else {
          ok(visibility.has(member));
          ok(hasVisibility(runner.program, x, member));
        }
      }
    });

    it("removes a visibility modifier", async () => {
      const { Example } = (await runner.compile(`
        @test model Example {
          x: string;
        }
      `)) as { Example: Model };

      const x = Example.properties.get("x")!;
      const Lifecycle = getLifecycleVisibilityEnum(runner.program);
      const Create = Lifecycle.members.get("Create")!;

      removeVisibilityModifiers(runner.program, x, [Create]);

      const visibility = getVisibilityForClass(runner.program, x, Lifecycle);

      strictEqual(visibility.size, Lifecycle.members.size - 1);

      for (const member of Lifecycle.members.values()) {
        if (member !== Create) {
          ok(visibility.has(member));
        } else {
          ok(!visibility.has(member));
        }
      }
    });

    it("clears visibility modifiers for a class", async () => {
      const { Example } = (await runner.compile(`
        @test model Example {
          x: string;
        }
      `)) as { Example: Model };

      const x = Example.properties.get("x")!;
      const Lifecycle = getLifecycleVisibilityEnum(runner.program);

      clearVisibilityModifiersForClass(runner.program, x, Lifecycle);

      const visibility = getVisibilityForClass(runner.program, x, Lifecycle);

      strictEqual(visibility.size, 0);

      for (const member of Lifecycle.members.values()) {
        ok(!visibility.has(member));
        ok(!hasVisibility(runner.program, x, member));
      }
    });

    it("resets visibility modifiers for a class", async () => {
      const { Example } = (await runner.compile(`
        @test model Example {
          @visibility(Lifecycle.Create)
          x: string;
        }
      `)) as { Example: Model };

      const x = Example.properties.get("x")!;

      const Lifecycle = getLifecycleVisibilityEnum(runner.program);

      const visibility = getVisibilityForClass(runner.program, x, Lifecycle);

      strictEqual(visibility.size, 1);
      ok(visibility.has(Lifecycle.members.get("Create")!));
      ok(hasVisibility(runner.program, x, Lifecycle.members.get("Create")!));

      resetVisibilityModifiersForClass(runner.program, x, Lifecycle);

      const resetVisibility = getVisibilityForClass(runner.program, x, Lifecycle);

      strictEqual(resetVisibility.size, 3);

      for (const member of Lifecycle.members.values()) {
        ok(resetVisibility.has(member));
        ok(hasVisibility(runner.program, x, member));
      }
    });

    it("preserves visibility for other classes", async () => {
      const { Example, Dummy } = (await runner.compile(`
        @test model Example {
          x: string;
        }

        @test enum Dummy {
          A,
          B,
        }
      `)) as { Example: Model; Dummy: Enum };

      const x = Example.properties.get("x")!;
      const Lifecycle = getLifecycleVisibilityEnum(runner.program);

      clearVisibilityModifiersForClass(runner.program, x, Dummy);

      const visibility = getVisibilityForClass(runner.program, x, Lifecycle);

      strictEqual(visibility.size, Lifecycle.members.size);

      for (const member of Lifecycle.members.values()) {
        ok(visibility.has(member));
        ok(hasVisibility(runner.program, x, member));
      }
    });
  });

  describe("visibility filters", () => {
    type LifecycleVisibilityName = "Create" | "Read" | "Update";
    interface VisibilityFilterScenario {
      name: string;
      expect: boolean;
      visibility: Array<LifecycleVisibilityName>;
      filter: StringVisibilityFilter;
    }

    interface StringVisibilityFilter {
      all?: LifecycleVisibilityName[];
      any?: LifecycleVisibilityName[];
      none?: LifecycleVisibilityName[];
    }

    const SCENARIOS: VisibilityFilterScenario[] = [
      {
        name: "simple property - all - visible",
        expect: true,
        visibility: ["Create", "Read"],
        filter: { all: ["Read"] },
      },
      {
        name: "simple property - all - not visible",
        expect: false,
        visibility: ["Create", "Read"],
        filter: { all: ["Update"] },
      },
      {
        name: "simple property - partial all - not visible",
        expect: false,
        visibility: ["Create", "Read"],
        filter: { all: ["Create", "Update"] },
      },
      {
        name: "unmodified visibility - all - visible",
        expect: true,
        visibility: [],
        filter: { all: ["Create", "Read", "Update"] },
      },
      {
        name: "simple property - any - visible",
        expect: true,
        visibility: ["Create", "Read"],
        filter: { any: ["Read"] },
      },
      {
        name: "simple property - partial any - visible",
        expect: true,
        visibility: ["Create", "Read"],
        filter: { any: ["Create", "Update"] },
      },
      {
        name: "simple property - any - not visible",
        expect: false,
        visibility: ["Create", "Read"],
        filter: { any: ["Update"] },
      },
      {
        name: "simple property - none - visible",
        expect: true,
        visibility: ["Create", "Read"],
        filter: { none: ["Update"] },
      },
      {
        name: "simple property - none - not visible",
        expect: false,
        visibility: ["Create", "Read"],
        filter: { none: ["Create"] },
      },
      {
        name: "simple property - partial none - not visible",
        expect: false,
        visibility: ["Create", "Read"],
        filter: { none: ["Create", "Update"] },
      },
      {
        name: "unmodified visibility - none - not visible",
        expect: false,
        visibility: [],
        filter: { none: ["Create"] },
      },
      {
        name: "simple property - all/any - visible",
        expect: true,
        visibility: ["Create", "Read"],
        filter: { all: ["Read"], any: ["Create"] },
      },
      {
        name: "simple property - all/any - not visible",
        expect: false,
        visibility: ["Create", "Read"],
        filter: { all: ["Read"], any: ["Update"] },
      },
      {
        name: "simple property - all/none - visible",
        expect: true,
        visibility: ["Create", "Read"],
        filter: { all: ["Read"], none: ["Update"] },
      },
      {
        name: "simple property - all/none - not visible",
        expect: false,
        visibility: ["Create", "Read"],
        filter: { all: ["Read"], none: ["Create"] },
      },
      {
        name: "simple property - any/none - visible",
        expect: true,
        visibility: ["Create", "Read"],
        filter: { any: ["Read"], none: ["Update"] },
      },
      {
        name: "simple property - any/none - not visible",
        expect: false,
        visibility: ["Create", "Read"],
        filter: { any: ["Read"], none: ["Create"] },
      },
      {
        name: "simple property - all/any/none - visible",
        expect: true,
        visibility: ["Create", "Read"],
        filter: { all: ["Read"], any: ["Create"], none: ["Update"] },
      },
      {
        name: "simple property - all/any/none - not visible",
        expect: false,
        visibility: ["Create", "Read"],
        filter: { all: ["Read"], any: ["Create"], none: ["Create"] },
      },
    ];

    for (const scenario of SCENARIOS) {
      it(scenario.name, async () => {
        const visibilityDecorator =
          scenario.visibility.length > 0
            ? `@visibility(${scenario.visibility.map((v) => `Lifecycle.${v}`).join(", ")})`
            : "";
        const { Example } = (await runner.compile(`
          @test model Example {
            ${visibilityDecorator}
            x: string;
          }
        `)) as { Example: Model };

        const x = Example.properties.get("x")!;
        const Lifecycle = getLifecycleVisibilityEnum(runner.program);

        const filter = Object.fromEntries(
          Object.entries(scenario.filter).map(([k, vis]) => [
            k,
            new Set((vis as LifecycleVisibilityName[]).map((v) => Lifecycle.members.get(v)!)),
          ]),
        ) as VisibilityFilter;

        strictEqual(isVisible(runner.program, x, filter), scenario.expect);
      });
    }

    it("mixed visibility classes in filter", async () => {
      const { Example, Dummy: DummyEnum } = (await runner.compile(`
        @test model Example {
          @visibility(Lifecycle.Create, Dummy.B)
          x: string;
        }
        
        @test
        @defaultVisibility(Dummy.A)
        enum Dummy {
          A,
          B,
        }
      `)) as { Example: Model; Dummy: Enum };

      const x = Example.properties.get("x")!;
      const LifecycleEnum = getLifecycleVisibilityEnum(runner.program);

      const Lifecycle = {
        Create: LifecycleEnum.members.get("Create")!,
        Read: LifecycleEnum.members.get("Read")!,
        Update: LifecycleEnum.members.get("Update")!,
      };

      const Dummy = {
        A: DummyEnum.members.get("A")!,
        B: DummyEnum.members.get("B")!,
      };

      strictEqual(
        isVisible(runner.program, x, {
          all: new Set([Lifecycle.Create, Dummy.B]),
        }),
        true,
      );

      strictEqual(
        isVisible(runner.program, x, {
          any: new Set([Dummy.A]),
        }),
        false,
      );

      strictEqual(
        isVisible(runner.program, x, {
          none: new Set([Lifecycle.Update]),
        }),
        true,
      );

      strictEqual(
        isVisible(runner.program, x, {
          all: new Set([Lifecycle.Create]),
          none: new Set([Dummy.A]),
        }),
        true,
      );

      strictEqual(
        isVisible(runner.program, x, {
          all: new Set([Lifecycle.Create, Dummy.B]),
          none: new Set([Dummy.A]),
        }),
        true,
      );

      strictEqual(
        isVisible(runner.program, x, {
          all: new Set([Lifecycle.Create]),
          any: new Set([Dummy.A, Dummy.B]),
          none: new Set([Lifecycle.Update]),
        }),
        true,
      );
    });
  });
});
