// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { deepStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { getVisibility, VisibilityFilter } from "../src/core/visibility/core.js";
import {
  $visibility,
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

  describe("legacy compatibility", () => {
    it("converts legacy visibility strings to modifiers", async () => {
      const { Example } = (await runner.compile(`
        @test model Example {
          @visibility("create")
          x: string;
        }
      `)) as { Example: Model };

      const x = Example.properties.get("x")!;

      const Lifecycle = getLifecycleVisibilityEnum(runner.program);

      const visibility = getVisibilityForClass(runner.program, x, Lifecycle);

      strictEqual(visibility.size, 1);

      for (const member of Lifecycle.members.values()) {
        if (member.name === "Create") {
          ok(visibility.has(member));
          ok(hasVisibility(runner.program, x, member));
        } else {
          ok(!visibility.has(member));
          ok(!hasVisibility(runner.program, x, member));
        }
      }
    });

    it("isVisible correctly coerces legacy visibility modifiers", async () => {
      const { Example } = (await runner.compile(`
        @test model Example {
          @visibility(Lifecycle.Create, Lifecycle.Update)
          x: string;
          y: string;
        }
      `)) as { Example: Model };

      const x = Example.properties.get("x")!;

      ok(isVisible(runner.program, x, ["create"]));
      ok(isVisible(runner.program, x, ["update"]));
      ok(!isVisible(runner.program, x, ["read"]));

      const y = Example.properties.get("y")!;

      ok(isVisible(runner.program, y, ["create", "update"]));
      ok(isVisible(runner.program, y, ["read"]));
    });

    it("getVisibility correctly coerces visibility modifiers", async () => {
      const { Example } = (await runner.compile(`
        @test model Example {
          @visibility(Lifecycle.Create, Lifecycle.Update)
          x: string;
          y: string;
          @invisible(Lifecycle)
          z: string;
          @visibility(Lifecycle.Create, Lifecycle.Update, Lifecycle.Read)
          a: string;
        }
      `)) as { Example: Model };

      const x = Example.properties.get("x")!;
      const y = Example.properties.get("y")!;
      const z = Example.properties.get("z")!;
      const a = Example.properties.get("a")!;

      const xVisibility = getVisibility(runner.program, x);
      const yVisibility = getVisibility(runner.program, y);
      const zVisibility = getVisibility(runner.program, z);
      const aVisibility = getVisibility(runner.program, a);

      deepStrictEqual(xVisibility, ["create", "update"]);
      strictEqual(yVisibility, undefined);
      deepStrictEqual(zVisibility, ["none"]);
      deepStrictEqual(aVisibility, ["create", "update", "read"]);
    });
  });

  describe("lifecycle transforms", () => {
    async function compileWithTransform(
      transform: "Create" | "Read" | "Update" | "CreateOrUpdate",
    ) {
      const { Result } = (await runner.compile(`
        model Example {
          @visibility(Lifecycle.Read)
          r: string;

          cru: string;

          @visibility(Lifecycle.Create, Lifecycle.Read)
          cr: string;

          @visibility(Lifecycle.Create, Lifecycle.Update)
          cu: string;

          @visibility(Lifecycle.Create)
          c: string;

          @visibility(Lifecycle.Update, Lifecycle.Read)
          ru: string;

          @visibility(Lifecycle.Update)
          u: string;

          @invisible(Lifecycle)
          invisible: string;

          nested: {
            @visibility(Lifecycle.Read)
            r: string;

            cru: string;

            @visibility(Lifecycle.Create, Lifecycle.Read)
            cr: string;

            @visibility(Lifecycle.Create, Lifecycle.Update)
            cu: string;

            @visibility(Lifecycle.Create)
            c: string;

            @visibility(Lifecycle.Update, Lifecycle.Read)
            ru: string;

            @visibility(Lifecycle.Update)
            u: string;

            @invisible(Lifecycle)
            invisible: string;
          };
        }

        model ReadExample is Read<Example>;

        @test model Result is ${transform}<Example>;
      `)) as { Result: Model };

      return Result;
    }

    function getProperties(model: Model) {
      return {
        c: model.properties.get("c"),
        cr: model.properties.get("cr"),
        cu: model.properties.get("cu"),
        cru: model.properties.get("cru"),
        r: model.properties.get("r"),
        ru: model.properties.get("ru"),
        u: model.properties.get("u"),
        invisible: model.properties.get("invisible"),
      };
    }

    it("correctly applies Read transform", async () => {
      const Result = await compileWithTransform("Read");
      const props = getProperties(Result);

      // All properties that do not have Read visibility are removed
      strictEqual(props.c, undefined);
      strictEqual(props.cu, undefined);
      strictEqual(props.u, undefined);

      strictEqual(props.invisible, undefined);

      // All properties that have Read visibility are preserved
      ok(props.r);
      ok(props.cr);
      ok(props.cru);
      ok(props.ru);

      const nested = Result.properties.get("nested");

      ok(nested);
      ok(nested.type.kind === "Model");

      const nestedProps = getProperties(nested.type);

      strictEqual(nestedProps.c, undefined);
      strictEqual(nestedProps.cu, undefined);
      strictEqual(nestedProps.u, undefined);

      strictEqual(nestedProps.invisible, undefined);

      ok(nestedProps.r);
      ok(nestedProps.cr);
      ok(nestedProps.cru);
      ok(nestedProps.ru);
    });

    it.only("correctly applies Create transform", async () => {
      const Result = await compileWithTransform("Create");
      const props = getProperties(Result);

      // Properties without Create visibility are removed
      strictEqual(props.r, undefined);
      strictEqual(props.ru, undefined);
      strictEqual(props.u, undefined);

      strictEqual(props.invisible, undefined);

      ok(props.c);
      ok(props.cr);
      ok(props.cu);
      ok(props.cru);

      const nested = Result.properties.get("nested");

      ok(nested);
      ok(nested.type.kind === "Model");

      const nestedProps = getProperties(nested.type);

      strictEqual(nestedProps.r, undefined);
      strictEqual(nestedProps.ru, undefined);
      strictEqual(nestedProps.u, undefined);

      strictEqual(nestedProps.invisible, undefined);

      ok(nestedProps.c);
      ok(nestedProps.cr);
      ok(nestedProps.cu);
      ok(nestedProps.cru);
    });

    it("correctly applies Update transform", async () => {
      const Result = await compileWithTransform("Update");
      const props = getProperties(Result);

      // Properties without Update visibility are removed
      strictEqual(props.r, undefined);
      strictEqual(props.c, undefined);
      strictEqual(props.cr, undefined);

      strictEqual(props.invisible, undefined);

      ok(props.cu);
      ok(props.cru);
      ok(props.ru);
      ok(props.u);

      const nested = Result.properties.get("nested");

      ok(nested);
      ok(nested.type.kind === "Model");

      // Nested properties work differently in Lifecycle Update transforms, requiring nested create-only properties to
      // additionally be visible
      const nestedProps = getProperties(nested.type);

      strictEqual(nestedProps.r, undefined);

      strictEqual(nestedProps.invisible, undefined);

      ok(nestedProps.c);
      ok(nestedProps.cr);
      ok(nestedProps.cu);
      ok(nestedProps.cru);
      ok(nestedProps.ru);
      ok(nestedProps.u);
    });

    it("correctly applies CreateOrUpdate transform", async () => {
      const Result = await compileWithTransform("CreateOrUpdate");
      const props = getProperties(Result);

      // Properties that only have read visibility are removed
      strictEqual(props.r, undefined);

      strictEqual(props.invisible, undefined);

      // All other visible properties are preserved
      ok(props.c);
      ok(props.cr);
      ok(props.cu);
      ok(props.cru);
      ok(props.ru);
      ok(props.u);

      const nested = Result.properties.get("nested");

      ok(nested);
      ok(nested.type.kind === "Model");

      const nestedProps = getProperties(nested.type);

      strictEqual(nestedProps.r, undefined);

      ok(nestedProps.c);
      ok(nestedProps.cr);
      ok(nestedProps.cu);
      ok(nestedProps.cru);
      ok(nestedProps.ru);
      ok(nestedProps.u);

      strictEqual(nestedProps.invisible, undefined);
    });
  });

  describe("withVisibilityFilter transforms", () => {
    it("correctly makes transformed models immune from further transformation", async () => {
      const { ExampleRead, ExampleReadCreate } = (await runner.compile(`
        model Example {
          @visibility(Lifecycle.Read)
          id: string;
        }
          
        @test model ExampleRead is Read<Example>;
        
        @test model ExampleReadCreate is Create<ExampleRead>;
      `)) as { ExampleRead: Model; ExampleReadCreate: Model };

      const idRead = ExampleRead.properties.get("id")!;

      ok(idRead);

      ok(!idRead.decorators.some((d) => d.decorator === $visibility));

      // Property should remain present in the Create transform of this model.
      const idReadCreate = ExampleReadCreate.properties.get("id")!;

      ok(idReadCreate);

      strictEqual(idRead.type, idReadCreate.type);
    });
  });
});