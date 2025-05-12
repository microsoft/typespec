// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { VisibilityFilter } from "../src/core/visibility/core.js";
import {
  $visibility,
  addVisibilityModifiers,
  clearVisibilityModifiersForClass,
  Diagnostic,
  EmptyVisibilityProvider,
  Enum,
  getFriendlyName,
  getLifecycleVisibilityEnum,
  getParameterVisibilityFilter,
  getVisibilityForClass,
  hasVisibility,
  isSealed,
  isVisible,
  Model,
  ModelProperty,
  Operation,
  removeVisibilityModifiers,
  resetVisibilityModifiersForClass,
  sealVisibilityModifiers,
  sealVisibilityModifiersForProgram,
} from "../src/index.js";
import {
  BasicTestRunner,
  createTestRunner,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "../src/testing/index.js";

function assertSetsEqual<T>(a: Set<T>, b: Set<T>): void {
  strictEqual(a.size, b.size);

  for (const item of a) {
    ok(b.has(item));
  }
}

describe("compiler: visibility core", () => {
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

      strictEqual(resetVisibility.size, 5);

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

    describe("parameter visibility filters", () => {
      it("correctly provides empty default visibility filter", async () => {
        const { Example, foo } = (await runner.compile(`
          @test model Example {
            @visibility(Lifecycle.Create)
            x: string;
          }

          @test op foo(example: Example): void;
        `)) as { Example: Model; foo: Operation };

        const x = Example.properties.get("x")!;

        const filter = getParameterVisibilityFilter(runner.program, foo, EmptyVisibilityProvider);

        strictEqual(filter.all, undefined);
        strictEqual(filter.any, undefined);
        strictEqual(filter.none, undefined);

        strictEqual(isVisible(runner.program, x, filter), true);
      });

      it("correctly provides visibility filter from operation", async () => {
        const { Example, foo } = (await runner.compile(`
          @test model Example {
            @visibility(Lifecycle.Create)
            x: string;
          }

          @parameterVisibility(Lifecycle.Update)
          @test op foo(
            example: Example
          ): void;
        `)) as { Example: Model; foo: Operation };

        const x = Example.properties.get("x")!;

        const filter = getParameterVisibilityFilter(runner.program, foo, EmptyVisibilityProvider);

        const Lifecycle = getLifecycleVisibilityEnum(runner.program);

        strictEqual(filter.all, undefined);
        strictEqual(filter.any?.size, 1);
        strictEqual(filter.any.has(Lifecycle.members.get("Update")!), true);
        strictEqual(filter.none, undefined);

        strictEqual(isVisible(runner.program, x, filter), false);
      });

      it("does not allow empty operation visibility constraints", async () => {
        const diagnostics = await runner.diagnose(`
          @test model Example {
            @visibility(Lifecycle.Create)
            x: string;
          }

          @parameterVisibility
          @returnTypeVisibility
          @test op foo(
            example: Example
          ): Example;
        `);

        expectDiagnostics(
          diagnostics,
          Array(2).fill({
            code: "operation-visibility-constraint-empty",
            severity: "error",
          }),
        );
      });
    });
  });

  describe("lifecycle transforms", () => {
    async function compileWithTransform(
      transform: "Create" | "Read" | "Update" | "CreateOrUpdate",
    ) {
      const Lifecycle = {
        Read: "Lifecycle.Read",
        Create: "Lifecycle.Create",
        Update: "Lifecycle.Update",
      };
      const [{ Result }, diagnostics] = (await runner.compileAndDiagnose(`
        model Example {
          @visibility(${Lifecycle.Read})
          r: string;

          cru: string;

          @visibility(${Lifecycle.Create}, ${Lifecycle.Read})
          cr: string;

          @visibility(${Lifecycle.Create}, ${Lifecycle.Update})
          cu: string;

          @visibility(${Lifecycle.Create})
          c: string;

          @visibility(${Lifecycle.Update}, ${Lifecycle.Read})
          ru: string;

          @visibility(${Lifecycle.Update})
          u: string;

          @invisible(Lifecycle)
          invisible: string;

          nested: {
            @visibility(${Lifecycle.Read})
            r: string;

            cru: string;

            @visibility(${Lifecycle.Create}, ${Lifecycle.Read})
            cr: string;

            @visibility(${Lifecycle.Create}, ${Lifecycle.Update})
            cu: string;

            @visibility(${Lifecycle.Create})
            c: string;

            @visibility(${Lifecycle.Update}, ${Lifecycle.Read})
            ru: string;

            @visibility(${Lifecycle.Update})
            u: string;

            @invisible(Lifecycle)
            invisible: string;
          };
        }

        // This ensures the transforms are non-side-effecting.
        model ReadExample is Read<Example>;

        @test model Result is ${transform}<Example>;
      `)) as [{ Result: Model }, Diagnostic[]];

      expectDiagnosticEmpty(diagnostics);

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

      validateReadTransform(props, Result, getProperties);
    });

    it("correctly applies Create transform", async () => {
      const Result = await compileWithTransform("Create");
      const props = getProperties(Result);

      validateCreateTransform(props, Result, getProperties);
    });

    it("correctly applies Update transform", async () => {
      const Result = await compileWithTransform("Update");
      const props = getProperties(Result);

      validateUpdateTransform(props, Result, getProperties);
    });

    it("correctly applies CreateOrUpdate transform", async () => {
      const Result = await compileWithTransform("CreateOrUpdate");
      const props = getProperties(Result);

      // Properties that only have read visibility are removed
      validateCreateOrUpdateTransform(props, Result, getProperties);
    });

    it("correctly transforms a union", async () => {
      const { Result } = (await runner.compile(`
        model Example {
          example: A | B;
        }

        model A {
          @visibility(Lifecycle.Read)
          a: string;
        }

        model B {
          @invisible(Lifecycle)
          b: string;
        }

        @test
        model Result is Read<Example>;
      `)) as { Result: Model };

      const example = Result.properties.get("example");

      ok(example);

      const union = example.type;

      strictEqual(union.kind, "Union");

      const [A, B] = [...union.variants.values()].map((v) => v.type);

      strictEqual(A.kind, "Model");
      strictEqual(B.kind, "Model");

      const a = A.properties.get("a");
      const b = B.properties.get("b");

      ok(a);

      strictEqual(b, undefined);
    });

    it("correctly transforms a model property reference", async () => {
      const { Result } = (await runner.compile(`
        model Example {
          a: ExampleRef.a;
        }

        model ExampleRef {
          a: A;
        }

        model A {
          @visibility(Lifecycle.Read)
          a: string;
          @visibility(Lifecycle.Create)
          b: string;
        }

        @test
        model Result is Create<Example>;
      `)) as { Result: Model };

      const example = Result.properties.get("a");

      ok(example);

      const ref = example.type;

      strictEqual(ref.kind, "ModelProperty");

      const A = ref.type;

      ok(A.kind === "Model");

      const a = A.properties.get("a");
      const b = A.properties.get("b");

      strictEqual(a, undefined);
      ok(b);
    });

    it("correctly transforms a tuple", async () => {
      const { Result } = (await runner.compile(`
        model Example {
          example: [A, B];
        }

        model A {
          @visibility(Lifecycle.Read)
          a: string;
        }

        model B {
          @invisible(Lifecycle)
          b: string;
        }

        @test
        model Result is Read<Example>;
      `)) as { Result: Model };

      const example = Result.properties.get("example");

      ok(example);

      const tuple = example.type;

      strictEqual(tuple.kind, "Tuple");

      const [A, B] = tuple.values;

      strictEqual(A.kind, "Model");
      strictEqual(B.kind, "Model");

      const a = A.properties.get("a");
      const b = B.properties.get("b");

      ok(a);

      strictEqual(b, undefined);
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

  it("deeply renames types using the name template", async () => {
    const { DataA, DataB } = (await runner.compile(`
      enum Example {
        A,
        B,
      }

      model Data {
        @visibility(Example.A)
        data_a: Foo;

        @visibility(Example.B)
        data_b: Foo;
      }
        
      model Foo {
        @visibility(Example.B)
        foo_b: string;
        @visibility(Example.A)
        foo_a: string;
      }

      @withVisibilityFilter(#{ any: #[Example.A] }, "{name}A")
      @test model DataA {
        ...Data
      }

      @withVisibilityFilter(#{ any: #[Example.B] }, "{name}B")
      @test model DataB {
        ...Data
      }
    `)) as { DataA: Model; DataB: Model };

    ok(DataA);
    ok(DataB);

    ok(DataA.properties.has("data_a"));
    ok(!DataA.properties.has("data_b"));
    ok(DataB.properties.has("data_b"));
    ok(!DataB.properties.has("data_a"));

    const dataA = DataA.properties.get("data_a")!;
    const dataB = DataB.properties.get("data_b")!;

    ok(dataA.type.kind === "Model");
    ok(dataB.type.kind === "Model");

    const FooA = dataA.type as Model;
    const FooB = dataB.type as Model;

    ok(FooA.name === "FooA");
    ok(FooB.name === "FooB");

    ok(FooA.properties.has("foo_a"));
    ok(!FooA.properties.has("foo_b"));
    ok(FooB.properties.has("foo_b"));
    ok(!FooB.properties.has("foo_a"));
  });

  it("correctly caches and deduplicates transformed instances", async () => {
    const { Out } = (await runner.compile(`
      model A {
        @visibility(Lifecycle.Read)
        a: string;

        @visibility(Lifecycle.Create)
        invisible: string;

        c: C;
      }

      model B {
        @visibility(Lifecycle.Read)
        b: string;

        @visibility(Lifecycle.Create)
        invisible: string;

        c: C;
      }

      model C {
        @visibility(Lifecycle.Create)
        invisible: string;

        @visibility(Lifecycle.Read)
        c: string;
      }

      @test model Out {
        a: Read<A>;
        b: Read<B>;
      }
    `)) as { Out: Model };

    ok(Out);

    const a = Out.properties.get("a");
    const b = Out.properties.get("b");

    ok(a);
    ok(b);

    ok(a.type.kind === "Model");
    ok(b.type.kind === "Model");

    const A = a.type as Model;
    const B = b.type as Model;

    ok(getFriendlyName(runner.program, A) === "ReadA");
    ok(getFriendlyName(runner.program, B) === "ReadB");

    ok(A.properties.has("a"));
    ok(!A.properties.has("invisible"));

    ok(B.properties.has("b"));
    ok(!B.properties.has("invisible"));

    const aC = A.properties.get("c");
    const bC = B.properties.get("c");

    ok(aC);
    ok(bC);

    ok(aC.type === bC.type);

    let C = aC.type as Model;

    ok(C.kind === "Model");
    ok(C.name === "ReadC");

    ok(!C.properties.has("invisible"));
    ok(C.properties.has("c"));

    C = bC.type as Model;

    ok(C.kind === "Model");
    ok(C.name === "ReadC");

    ok(!C.properties.has("invisible"));
    ok(C.properties.has("c"));
  });

  it("correctly caches and deduplicates instances that are not transformed", async () => {
    const { example, B } = (await runner.compile(`
      @test op example(): Read<A>;

      model A {
        b: B;
      }
      
      @test
      model B {
        c: string;
      }
    `)) as { example: Operation; B: Model };

    ok(example);
    strictEqual(example.kind, "Operation");

    const ReadA = example.returnType as Model;

    strictEqual(ReadA.kind, "Model");

    const aB = ReadA.properties.get("b")!.type as Model;

    strictEqual(aB.kind, "Model");

    ok(aB === B);
  });

  it("correctly transforms arrays and records", async () => {
    const { Result } = (await runner.compile(`
      model A {
        @visibility(Lifecycle.Read)
        a: string;

        @visibility(Lifecycle.Create)
        invisible: string;
      }

      @withVisibilityFilter(#{ any: #[Lifecycle.Read] }, "{name}Transform")
      @test model Result {
        array: A[];
        record: Record<A>;
      }
    `)) as { Result: Model };

    ok(Result);

    const array = Result.properties.get("array");
    const record = Result.properties.get("record");

    ok(array);
    ok(record);

    const arrayType = array.type;
    const recordType = record.type;

    ok(arrayType.kind === "Model");
    ok(recordType.kind === "Model");

    const arrayA = (arrayType as Model).indexer!.value as Model;
    const recordA = (recordType as Model).indexer!.value as Model;

    ok(arrayA.kind === "Model");
    ok(recordA.kind === "Model");

    ok(arrayA.name === "ATransform");
    ok(recordA.name === "ATransform");

    ok(arrayA === recordA);

    ok(arrayA.properties.has("a"));
    ok(!arrayA.properties.has("invisible"));
  });
});

function validateCreateOrUpdateTransform(
  props: {
    c: ModelProperty | undefined;
    cr: ModelProperty | undefined;
    cu: ModelProperty | undefined;
    cru: ModelProperty | undefined;
    r: ModelProperty | undefined;
    ru: ModelProperty | undefined;
    u: ModelProperty | undefined;
    invisible: ModelProperty | undefined;
  },
  Result: Model,
  getProperties: (model: Model) => {
    c: ModelProperty | undefined;
    cr: ModelProperty | undefined;
    cu: ModelProperty | undefined;
    cru: ModelProperty | undefined;
    r: ModelProperty | undefined;
    ru: ModelProperty | undefined;
    u: ModelProperty | undefined;
    invisible: ModelProperty | undefined;
  },
) {
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
}

function validateUpdateTransform(
  props: {
    c: ModelProperty | undefined;
    cr: ModelProperty | undefined;
    cu: ModelProperty | undefined;
    cru: ModelProperty | undefined;
    r: ModelProperty | undefined;
    ru: ModelProperty | undefined;
    u: ModelProperty | undefined;
    invisible: ModelProperty | undefined;
  },
  Result: Model,
  getProperties: (model: Model) => {
    c: ModelProperty | undefined;
    cr: ModelProperty | undefined;
    cu: ModelProperty | undefined;
    cru: ModelProperty | undefined;
    r: ModelProperty | undefined;
    ru: ModelProperty | undefined;
    u: ModelProperty | undefined;
    invisible: ModelProperty | undefined;
  },
) {
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
}

function validateCreateTransform(
  props: {
    c: ModelProperty | undefined;
    cr: ModelProperty | undefined;
    cu: ModelProperty | undefined;
    cru: ModelProperty | undefined;
    r: ModelProperty | undefined;
    ru: ModelProperty | undefined;
    u: ModelProperty | undefined;
    invisible: ModelProperty | undefined;
  },
  Result: Model,
  getProperties: (model: Model) => {
    c: ModelProperty | undefined;
    cr: ModelProperty | undefined;
    cu: ModelProperty | undefined;
    cru: ModelProperty | undefined;
    r: ModelProperty | undefined;
    ru: ModelProperty | undefined;
    u: ModelProperty | undefined;
    invisible: ModelProperty | undefined;
  },
) {
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
}

function validateReadTransform(
  props: {
    c: ModelProperty | undefined;
    cr: ModelProperty | undefined;
    cu: ModelProperty | undefined;
    cru: ModelProperty | undefined;
    r: ModelProperty | undefined;
    ru: ModelProperty | undefined;
    u: ModelProperty | undefined;
    invisible: ModelProperty | undefined;
  },
  Result: Model,
  getProperties: (model: Model) => {
    c: ModelProperty | undefined;
    cr: ModelProperty | undefined;
    cu: ModelProperty | undefined;
    cru: ModelProperty | undefined;
    r: ModelProperty | undefined;
    ru: ModelProperty | undefined;
    u: ModelProperty | undefined;
    invisible: ModelProperty | undefined;
  },
) {
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
}
