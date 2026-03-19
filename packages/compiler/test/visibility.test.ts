// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { VisibilityFilter } from "../src/core/visibility/core.js";
import type { EnumMember, EnumValue, FunctionContext } from "../src/index.js";
import {
  $visibility,
  addVisibilityModifiers,
  clearVisibilityModifiersForClass,
  EmptyVisibilityProvider,
  getLifecycleVisibilityEnum,
  getParameterVisibilityFilter,
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
import { applyLifecycleUpdate, applyVisibilityFilter } from "../src/lib/visibility.js";
import { expectDiagnosticEmpty, expectDiagnostics, t } from "../src/testing/index.js";
import { $ } from "../src/typekit/index.js";
import { Tester } from "./tester.js";

function assertSetsEqual<T>(a: Set<T>, b: Set<T>): void {
  strictEqual(a.size, b.size);

  for (const item of a) {
    ok(b.has(item));
  }
}

function enumMemberToValue(member: EnumMember): EnumValue {
  return {
    entityKind: "Value",
    valueKind: "EnumValue",
    value: member,
    type: member.enum,
  };
}

function anyFilter(...members: EnumMember[]): Parameters<typeof applyVisibilityFilter>[2] {
  return {
    any: members.map((m) => enumMemberToValue(m)),
  };
}

describe("compiler: visibility core", () => {
  it("default visibility", async () => {
    const { name, Dummy, program } = await Tester.compile(t.code`
        @defaultVisibility(Dummy.B)
        enum ${t.enum("Dummy")} {
          A,
          B,
        }

        model TestModel {
          ${t.modelProperty("name")}: string;
        }`);

    const LifecycleEnum = getLifecycleVisibilityEnum(program);

    const Lifecycle = {
      Read: LifecycleEnum.members.get("Read")!,
      Create: LifecycleEnum.members.get("Create")!,
      Update: LifecycleEnum.members.get("Update")!,
      Delete: LifecycleEnum.members.get("Delete")!,
      Query: LifecycleEnum.members.get("Query")!,
    };

    assertSetsEqual(
      getVisibilityForClass(program, name, LifecycleEnum),
      new Set([
        Lifecycle.Read,
        Lifecycle.Create,
        Lifecycle.Update,
        Lifecycle.Delete,
        Lifecycle.Query,
      ]),
    );

    assertSetsEqual(
      getVisibilityForClass(program, name, Dummy),
      new Set([Dummy.members.get("B")!]),
    );
  });

  it("produces correct lifecycle visibility enum reference", async () => {
    const { lifecycle, program } = await Tester.compile(t.code`
      model X {
        ${t.modelProperty("lifecycle")}: TypeSpec.Lifecycle;
      }
    `);

    const lifecycleEnum = getLifecycleVisibilityEnum(program);

    strictEqual(lifecycleEnum, lifecycle.type);
    strictEqual(lifecycleEnum, program.resolveTypeReference("TypeSpec.Lifecycle")[0]);
  });

  describe("visibility seals", () => {
    it("seals visibility modifiers for a program", async () => {
      const { Example, Dummy, program } = await Tester.compile(t.code`
        model ${t.model("Example")} {
          x: string;
        }

        enum ${t.enum("Dummy")} {}
      `);

      const x = Example.properties.get("x")!;

      const lifecycle = getLifecycleVisibilityEnum(program);

      ok(!isSealed(program, x));
      ok(!isSealed(program, x, lifecycle));
      ok(!isSealed(program, x, Dummy));

      sealVisibilityModifiersForProgram(program);

      ok(isSealed(program, x));
      ok(isSealed(program, x, lifecycle));
      ok(isSealed(program, x, Dummy));
    });

    it("seals visibility modifiers for a visibility class", async () => {
      const { Example, Dummy, program } = await Tester.compile(t.code`
        model ${t.model("Example")} {
          x: string;
        }

        enum ${t.enum("Dummy")} {}
      `);

      const x = Example.properties.get("x")!;

      const lifecycle = getLifecycleVisibilityEnum(program);

      ok(!isSealed(program, x));
      ok(!isSealed(program, x, lifecycle));
      ok(!isSealed(program, x, Dummy));

      sealVisibilityModifiers(program, x, lifecycle);

      ok(!isSealed(program, x));
      ok(isSealed(program, x, lifecycle));
      ok(!isSealed(program, x, Dummy));
    });

    it("seals visibility modifiers for a property", async () => {
      const { Example, Dummy, program } = await Tester.compile(t.code`
        model ${t.model("Example")} {
          x: string;
          y: string;
        }

        enum ${t.enum("Dummy")} {}
      `);

      const x = Example.properties.get("x")!;
      const y = Example.properties.get("y")!;

      const lifecycle = getLifecycleVisibilityEnum(program);

      ok(!isSealed(program, x));
      ok(!isSealed(program, x, lifecycle));
      ok(!isSealed(program, x, Dummy));

      ok(!isSealed(program, y));
      ok(!isSealed(program, y, lifecycle));
      ok(!isSealed(program, y, Dummy));

      sealVisibilityModifiers(program, x);

      ok(isSealed(program, x));
      ok(isSealed(program, x, lifecycle));
      ok(isSealed(program, x, Dummy));

      ok(!isSealed(program, y));
      ok(!isSealed(program, y, lifecycle));
      ok(!isSealed(program, y, Dummy));
    });

    it("correctly diagnoses modifying sealed visibility", async () => {
      const { Example, program } = await Tester.compile(t.code`
        model ${t.model("Example")} {
          x: string;
        }
      `);

      const x = Example.properties.get("x")!;

      const Lifecycle = getLifecycleVisibilityEnum(program);
      const Create = Lifecycle.members.get("Create")!;

      sealVisibilityModifiersForProgram(program);

      addVisibilityModifiers(program, x, [Create]);
      removeVisibilityModifiers(program, x, [Create]);
      clearVisibilityModifiersForClass(program, x, Lifecycle);

      strictEqual(program.diagnostics.length, 3);

      expectDiagnostics(program.diagnostics, [
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
      const { Example, Dummy, program } = await Tester.compile(t.code`
        model ${t.model("Example")} {
          x: string;
        }

        @defaultVisibility(Dummy.A)
        enum ${t.enum("Dummy")} {
          A,
          B,
        }
      `);

      const x = Example.properties.get("x")!;

      const Lifecycle = getLifecycleVisibilityEnum(program);

      const visibility = getVisibilityForClass(program, x, Lifecycle);

      strictEqual(visibility.size, Lifecycle.members.size);
      for (const member of Lifecycle.members.values()) {
        ok(visibility.has(member));
        ok(hasVisibility(program, x, member));
      }

      const dummyVisibility = getVisibilityForClass(program, x, Dummy);

      strictEqual(dummyVisibility.size, 1);
      ok(dummyVisibility.has(Dummy.members.get("A")!));
      ok(hasVisibility(program, x, Dummy.members.get("A")!));
      ok(!dummyVisibility.has(Dummy.members.get("B")!));
      ok(!hasVisibility(program, x, Dummy.members.get("B")!));
    });

    it("adds a visibility modifier", async () => {
      const { Example, program } = await Tester.compile(t.code`
        model ${t.model("Example")} {
          x: string;
        }
      `);

      const x = Example.properties.get("x")!;

      const Lifecycle = getLifecycleVisibilityEnum(program);
      const Create = Lifecycle.members.get("Create")!;

      addVisibilityModifiers(program, x, [Create]);

      const visibility = getVisibilityForClass(program, x, Lifecycle);

      strictEqual(visibility.size, 1);

      for (const member of Lifecycle.members.values()) {
        if (member !== Create) {
          ok(!visibility.has(member));
          ok(!hasVisibility(program, x, member));
        } else {
          ok(visibility.has(member));
          ok(hasVisibility(program, x, member));
        }
      }
    });

    it("removes a visibility modifier", async () => {
      const { Example, program } = await Tester.compile(t.code`
        model ${t.model("Example")} {
          x: string;
        }
      `);

      const x = Example.properties.get("x")!;
      const Lifecycle = getLifecycleVisibilityEnum(program);
      const Create = Lifecycle.members.get("Create")!;

      removeVisibilityModifiers(program, x, [Create]);

      const visibility = getVisibilityForClass(program, x, Lifecycle);

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
      const { Example, program } = await Tester.compile(t.code`
        model ${t.model("Example")} {
          x: string;
        }
      `);

      const x = Example.properties.get("x")!;
      const Lifecycle = getLifecycleVisibilityEnum(program);

      clearVisibilityModifiersForClass(program, x, Lifecycle);

      const visibility = getVisibilityForClass(program, x, Lifecycle);

      strictEqual(visibility.size, 0);

      for (const member of Lifecycle.members.values()) {
        ok(!visibility.has(member));
        ok(!hasVisibility(program, x, member));
      }
    });

    it("resets visibility modifiers for a class", async () => {
      const { Example, program } = await Tester.compile(t.code`
        model ${t.model("Example")} {
          @visibility(Lifecycle.Create)
          x: string;
        }
      `);

      const x = Example.properties.get("x")!;

      const Lifecycle = getLifecycleVisibilityEnum(program);

      const visibility = getVisibilityForClass(program, x, Lifecycle);

      strictEqual(visibility.size, 1);
      ok(visibility.has(Lifecycle.members.get("Create")!));
      ok(hasVisibility(program, x, Lifecycle.members.get("Create")!));

      resetVisibilityModifiersForClass(program, x, Lifecycle);

      const resetVisibility = getVisibilityForClass(program, x, Lifecycle);

      strictEqual(resetVisibility.size, 5);

      for (const member of Lifecycle.members.values()) {
        ok(resetVisibility.has(member));
        ok(hasVisibility(program, x, member));
      }
    });

    it("preserves visibility for other classes", async () => {
      const { Example, Dummy, program } = await Tester.compile(t.code`
        model ${t.model("Example")} {
          x: string;
        }

        enum ${t.enum("Dummy")} {
          A,
          B,
        }
      `);

      const x = Example.properties.get("x")!;
      const Lifecycle = getLifecycleVisibilityEnum(program);

      clearVisibilityModifiersForClass(program, x, Dummy);

      const visibility = getVisibilityForClass(program, x, Lifecycle);

      strictEqual(visibility.size, Lifecycle.members.size);

      for (const member of Lifecycle.members.values()) {
        ok(visibility.has(member));
        ok(hasVisibility(program, x, member));
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
        const { Example, program } = await Tester.compile(t.code`
          model ${t.model("Example")} {
            ${visibilityDecorator}
            x: string;
          }
        `);

        const x = Example.properties.get("x")!;
        const Lifecycle = getLifecycleVisibilityEnum(program);

        const filter = Object.fromEntries(
          Object.entries(scenario.filter).map(([k, vis]) => [
            k,
            new Set((vis as LifecycleVisibilityName[]).map((v) => Lifecycle.members.get(v)!)),
          ]),
        ) as VisibilityFilter;

        strictEqual(isVisible(program, x, filter), scenario.expect);
      });
    }

    it("mixed visibility classes in filter", async () => {
      const {
        Example,
        Dummy: DummyEnum,
        program,
      } = await Tester.compile(t.code`
        model ${t.model("Example")} {
          @visibility(Lifecycle.Create, Dummy.B)
          x: string;
        }
        
        @defaultVisibility(Dummy.A)
        enum ${t.enum("Dummy")} {
          A,
          B,
        }
      `);

      const x = Example.properties.get("x")!;
      const LifecycleEnum = getLifecycleVisibilityEnum(program);

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
        isVisible(program, x, {
          all: new Set([Lifecycle.Create, Dummy.B]),
        }),
        true,
      );

      strictEqual(
        isVisible(program, x, {
          any: new Set([Dummy.A]),
        }),
        false,
      );

      strictEqual(
        isVisible(program, x, {
          none: new Set([Lifecycle.Update]),
        }),
        true,
      );

      strictEqual(
        isVisible(program, x, {
          all: new Set([Lifecycle.Create]),
          none: new Set([Dummy.A]),
        }),
        true,
      );

      strictEqual(
        isVisible(program, x, {
          all: new Set([Lifecycle.Create, Dummy.B]),
          none: new Set([Dummy.A]),
        }),
        true,
      );

      strictEqual(
        isVisible(program, x, {
          all: new Set([Lifecycle.Create]),
          any: new Set([Dummy.A, Dummy.B]),
          none: new Set([Lifecycle.Update]),
        }),
        true,
      );
    });

    describe("parameter visibility filters", () => {
      it("correctly provides empty default visibility filter", async () => {
        const { Example, foo, program } = await Tester.compile(t.code`
          model ${t.model("Example")} {
            @visibility(Lifecycle.Create)
            x: string;
          }

          op ${t.op("foo")}(example: Example): void;
        `);

        const x = Example.properties.get("x")!;

        const filter = getParameterVisibilityFilter(program, foo, EmptyVisibilityProvider);

        strictEqual(filter.all, undefined);
        strictEqual(filter.any, undefined);
        strictEqual(filter.none, undefined);

        strictEqual(isVisible(program, x, filter), true);
      });

      it("correctly provides visibility filter from operation", async () => {
        const { Example, foo, program } = await Tester.compile(t.code`
          model ${t.model("Example")} {
            @visibility(Lifecycle.Create)
            x: string;
          }

          @parameterVisibility(Lifecycle.Update)
          op ${t.op("foo")}(
            example: Example
          ): void;
        `);

        const x = Example.properties.get("x")!;

        const filter = getParameterVisibilityFilter(program, foo, EmptyVisibilityProvider);

        const Lifecycle = getLifecycleVisibilityEnum(program);

        strictEqual(filter.all, undefined);
        strictEqual(filter.any?.size, 1);
        strictEqual(filter.any.has(Lifecycle.members.get("Update")!), true);
        strictEqual(filter.none, undefined);

        strictEqual(isVisible(program, x, filter), false);
      });

      it("does not allow empty operation visibility constraints", async () => {
        const diagnostics = await Tester.diagnose(`
          model Example {
            @visibility(Lifecycle.Create)
            x: string;
          }

          @parameterVisibility
          @returnTypeVisibility
          op foo(
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
      const [{ Result }, diagnostics] = await Tester.compileAndDiagnose(t.code`
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

          nested: Nested;
        }

        model Nested {
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

        // This ensures the transforms are non-side-effecting.
        model ReadExample is Read<Example>;

        model ${t.model("Result")} is ${transform}<Example>;
      `);

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

    it("correctly applies Update transform via applyLifecycleUpdate", async () => {
      const Lifecycle = {
        Read: "Lifecycle.Read",
        Create: "Lifecycle.Create",
        Update: "Lifecycle.Update",
      };

      const { Example, program } = await Tester.compile(t.code`
        model ${t.model("Example")} {
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

          nested: Nested;
        }

        model Nested {
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
      `);

      const fnContext = { program } satisfies Pick<FunctionContext, "program">;
      const Result = applyLifecycleUpdate(fnContext, Example, "Update{name}");
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
      const { Result } = await Tester.compile(t.code`
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

        model ${t.model("Result")} is Read<Example>;
      `);

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
      const { Result } = await Tester.compile(t.code`
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

        model ${t.model("Result")} is Create<Example>;
      `);

      const example = Result.properties.get("a");

      ok(example);

      const ref = example.type;

      strictEqual(ref.kind, "ModelProperty");

      const A = ref.type;

      strictEqual(A.kind, "Model");

      const a = A.properties.get("a");
      const b = A.properties.get("b");

      strictEqual(a, undefined);
      ok(b);
    });

    it("correctly transforms a tuple", async () => {
      const { Result } = await Tester.compile(t.code`
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

        model ${t.model("Result")} is Read<Example>;
      `);

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
      const { ExampleRead, ExampleReadCreate } = await Tester.compile(t.code`
        model Example {
          @visibility(Lifecycle.Read)
          id: string;
        }
          
        model ${t.model("ExampleRead")} is Read<Example>;
        
        model ${t.model("ExampleReadCreate")} is Create<ExampleRead>;
      `);

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
    const { DataA, DataB } = await Tester.compile(t.code`
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

      #suppress "deprecated"
      @withVisibilityFilter(#{ any: #[Example.A] }, "{name}A")
      model ${t.model("DataA")} {
        ...Data
      }

      #suppress "deprecated"
      @withVisibilityFilter(#{ any: #[Example.B] }, "{name}B")
      model ${t.model("DataB")} {
        ...Data
      }
    `);

    ok(DataA);
    ok(DataB);

    ok(DataA.properties.has("data_a"));
    ok(!DataA.properties.has("data_b"));
    ok(DataB.properties.has("data_b"));
    ok(!DataB.properties.has("data_a"));

    const dataA = DataA.properties.get("data_a")!;
    const dataB = DataB.properties.get("data_b")!;

    strictEqual(dataA.type.kind, "Model");
    strictEqual(dataB.type.kind, "Model");

    const FooA = dataA.type as Model;
    const FooB = dataB.type as Model;

    strictEqual(FooA.name, "FooA");
    strictEqual(FooB.name, "FooB");

    ok(FooA.properties.has("foo_a"));
    ok(!FooA.properties.has("foo_b"));
    ok(FooB.properties.has("foo_b"));
    ok(!FooB.properties.has("foo_a"));
  });

  it("deeply renames types using the name template via applyVisibilityFilter", async () => {
    const { Data, Example, program } = await Tester.compile(t.code`
      enum ${t.enum("Example")} {
        A,
        B,
      }

      model ${t.model("Data")} {
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
    `);

    const fnContext = { program } satisfies Pick<FunctionContext, "program">;
    const DataA = applyVisibilityFilter(
      fnContext,
      Data,
      anyFilter(Example.members.get("A")!),
      "{name}A",
    );
    const DataB = applyVisibilityFilter(
      fnContext,
      Data,
      anyFilter(Example.members.get("B")!),
      "{name}B",
    );

    ok(DataA);
    ok(DataB);

    ok(DataA.properties.has("data_a"));
    ok(!DataA.properties.has("data_b"));
    ok(DataB.properties.has("data_b"));
    ok(!DataB.properties.has("data_a"));

    const dataA = DataA.properties.get("data_a")!;
    const dataB = DataB.properties.get("data_b")!;

    strictEqual(dataA.type.kind, "Model");
    strictEqual(dataB.type.kind, "Model");

    const FooA = dataA.type as Model;
    const FooB = dataB.type as Model;

    strictEqual(FooA.name, "FooA");
    strictEqual(FooB.name, "FooB");

    ok(FooA.properties.has("foo_a"));
    ok(!FooA.properties.has("foo_b"));
    ok(FooB.properties.has("foo_b"));
    ok(!FooB.properties.has("foo_a"));
  });

  it("deeply renames types using FilterVisibility", async () => {
    const { DataA, DataB } = await Tester.compile(t.code`
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

      @test model ${t.model("DataA")} is FilterVisibility<Data, #{ any: #[Example.A] }, "{name}A">;
      @test model ${t.model("DataB")} is FilterVisibility<Data, #{ any: #[Example.B] }, "{name}B">;
    `);

    ok(DataA);
    ok(DataB);

    ok(DataA.properties.has("data_a"));
    ok(!DataA.properties.has("data_b"));
    ok(DataB.properties.has("data_b"));
    ok(!DataB.properties.has("data_a"));

    const dataA = DataA.properties.get("data_a")!;
    const dataB = DataB.properties.get("data_b")!;

    strictEqual(dataA.type.kind, "Model");
    strictEqual(dataB.type.kind, "Model");

    const FooA = dataA.type as Model;
    const FooB = dataB.type as Model;

    strictEqual(FooA.name, "FooA");
    strictEqual(FooB.name, "FooB");

    ok(FooA.properties.has("foo_a"));
    ok(!FooA.properties.has("foo_b"));
    ok(FooB.properties.has("foo_b"));
    ok(!FooB.properties.has("foo_a"));
  });

  it("correctly transforms arrays and records via FilterVisibility", async () => {
    const { Result, program } = await Tester.compile(t.code`
      model A {
        @visibility(Lifecycle.Read)
        a: string;

        @visibility(Lifecycle.Create)
        invisible: string;
      }

      model Input {
        array: A[];
        record: Record<A>;
      }

      model ${t.model("Result")} is FilterVisibility<Input, #{ any: #[Lifecycle.Read] }, "{name}Transform">;
    `);

    ok(Result);

    const array = Result.properties.get("array");
    const record = Result.properties.get("record");

    ok(array);
    ok(record);

    const arrayType = array.type;
    const recordType = record.type;

    strictEqual(arrayType.kind, "Model");
    strictEqual(recordType.kind, "Model");

    ok($(program).array.is(arrayType));
    ok($(program).record.is(recordType));

    const arrayA = (arrayType as Model).indexer!.value as Model;
    const recordA = (recordType as Model).indexer!.value as Model;

    strictEqual(arrayA.kind, "Model");
    strictEqual(recordA.kind, "Model");

    strictEqual(arrayA.name, "ATransform");
    strictEqual(recordA.name, "ATransform");

    strictEqual(arrayA, recordA);

    ok(arrayA.properties.has("a"));
    ok(!arrayA.properties.has("invisible"));
  });

  it("correctly caches and deduplicates transformed instances", async () => {
    const { Out } = await Tester.compile(t.code`
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

      model ${t.model("Out")} {
        a: Read<A>;
        b: Read<B>;
      }
    `);

    ok(Out);

    const a = Out.properties.get("a");
    const b = Out.properties.get("b");

    ok(a);
    ok(b);

    strictEqual(a.type.kind, "Model");
    strictEqual(b.type.kind, "Model");

    const A = a.type as Model;
    const B = b.type as Model;

    ok(A.name === "ReadA");
    ok(B.name === "ReadB");

    ok(A.properties.has("a"));
    ok(!A.properties.has("invisible"));

    ok(B.properties.has("b"));
    ok(!B.properties.has("invisible"));

    const aC = A.properties.get("c");
    const bC = B.properties.get("c");

    ok(aC);
    ok(bC);

    strictEqual(aC.type, bC.type);

    let C = aC.type as Model;

    strictEqual(C.kind, "Model");
    strictEqual(C.name, "ReadC");

    ok(!C.properties.has("invisible"));
    ok(C.properties.has("c"));

    C = bC.type as Model;

    strictEqual(C.kind, "Model");
    strictEqual(C.name, "ReadC");

    ok(!C.properties.has("invisible"));
    ok(C.properties.has("c"));
  });

  it("correctly caches and deduplicates instances that are not transformed", async () => {
    const { example, B } = await Tester.compile(t.code`
      op ${t.op("example")}(): Read<A>;

      model A {
        b: B;
      }
      
      model ${t.model("B")} {
        c: string;
      }
    `);

    ok(example);
    strictEqual(example.kind, "Operation");

    const ReadA = example.returnType as Model;

    strictEqual(ReadA.kind, "Model");

    const aB = ReadA.properties.get("b")!.type as Model;

    strictEqual(aB.kind, "Model");

    strictEqual(aB, B);
  });

  it("correctly transforms arrays and records", async () => {
    const { Result, program } = await Tester.compile(t.code`
      model A {
        @visibility(Lifecycle.Read)
        a: string;

        @visibility(Lifecycle.Create)
        invisible: string;
      }

      #suppress "deprecated"
      @withVisibilityFilter(#{ any: #[Lifecycle.Read] }, "{name}Transform")
      model ${t.model("Result")} {
        array: A[];
        record: Record<A>;
      }
    `);

    ok(Result);

    const array = Result.properties.get("array");
    const record = Result.properties.get("record");

    ok(array);
    ok(record);

    const arrayType = array.type;
    const recordType = record.type;

    strictEqual(arrayType.kind, "Model");
    strictEqual(recordType.kind, "Model");

    ok($(program).array.is(arrayType));
    ok($(program).record.is(recordType));

    const arrayA = (arrayType as Model).indexer!.value as Model;
    const recordA = (recordType as Model).indexer!.value as Model;

    strictEqual(arrayA.kind, "Model");
    strictEqual(recordA.kind, "Model");

    strictEqual(arrayA.name, "ATransform");
    strictEqual(recordA.name, "ATransform");

    strictEqual(arrayA, recordA);

    ok(arrayA.properties.has("a"));
    ok(!arrayA.properties.has("invisible"));
  });

  it("correctly transforms arrays and records via applyVisibilityFilter", async () => {
    const { Result, program } = await Tester.compile(t.code`
      model A {
        @visibility(Lifecycle.Read)
        a: string;

        @visibility(Lifecycle.Create)
        invisible: string;
      }

     model ${t.model("Result")} {
        array: A[];
        record: Record<A>;
      }
    `);

    const fnContext = { program } satisfies Pick<FunctionContext, "program">;
    const lifecycle = getLifecycleVisibilityEnum(program);
    const transformed = applyVisibilityFilter(
      fnContext,
      Result,
      anyFilter(lifecycle.members.get("Read")!),
      "{name}Transform",
    );

    ok(transformed);

    const array = transformed.properties.get("array");
    const record = transformed.properties.get("record");

    ok(array);
    ok(record);

    const arrayType = array.type;
    const recordType = record.type;

    strictEqual(arrayType.kind, "Model");
    strictEqual(recordType.kind, "Model");

    ok($(program).array.is(arrayType));
    ok($(program).record.is(recordType));

    const arrayA = (arrayType as Model).indexer!.value as Model;
    const recordA = (recordType as Model).indexer!.value as Model;

    strictEqual(arrayA.kind, "Model");
    strictEqual(recordA.kind, "Model");

    strictEqual(arrayA.name, "ATransform");
    strictEqual(recordA.name, "ATransform");

    strictEqual(arrayA, recordA);

    ok(arrayA.properties.has("a"));
    ok(!arrayA.properties.has("invisible"));
  });

  it("correctly transforms 'model is' declarations of arrays and records", async () => {
    const { Result, program } = await Tester.compile(t.code`
      model A {
        @visibility(Lifecycle.Read)
        a: string;

        @visibility(Lifecycle.Create)
        invisible: string;
      }

      model B is Array<A>;

      model C is Record<A>;

      #suppress "deprecated"
      @withVisibilityFilter(#{ any: #[Lifecycle.Read] }, "{name}Transform")
      model ${t.model("Result")} {
        arr: B;
        rec: C;
      }
    `);

    ok(Result);

    const arr = Result.properties.get("arr");
    const rec = Result.properties.get("rec");

    ok(arr);
    ok(rec);

    const arrType = arr.type;
    const recType = rec.type;

    strictEqual(arrType.kind, "Model");
    strictEqual(recType.kind, "Model");

    ok($(program).array.is(arrType));
    ok($(program).record.is(recType));

    strictEqual(arrType.name, "BTransform");
    strictEqual(recType.name, "CTransform");

    const arrA = (arrType as Model).indexer!.value as Model;
    const recA = (recType as Model).indexer!.value as Model;

    strictEqual(arrA, recA);

    strictEqual(arrA.kind, "Model");
    strictEqual(arrA.name, "ATransform");

    ok(arrA.properties.has("a"));
    ok(!arrA.properties.has("invisible"));
  });

  it("correctly transforms 'model is' declarations of arrays and records via applyVisibilityFilter", async () => {
    const { Result, program } = await Tester.compile(t.code`
      model A {
        @visibility(Lifecycle.Read)
        a: string;

        @visibility(Lifecycle.Create)
        invisible: string;
      }

      model B is Array<A>;

      model C is Record<A>;

      model ${t.model("Result")} {
        arr: B;
        rec: C;
      }
    `);

    const fnContext = { program } satisfies Pick<FunctionContext, "program">;
    const lifecycle = getLifecycleVisibilityEnum(program);
    const transformed = applyVisibilityFilter(
      fnContext,
      Result,
      anyFilter(lifecycle.members.get("Read")!),
      "{name}Transform",
    );

    ok(transformed);

    const arr = transformed.properties.get("arr");
    const rec = transformed.properties.get("rec");

    ok(arr);
    ok(rec);

    const arrType = arr.type;
    const recType = rec.type;

    strictEqual(arrType.kind, "Model");
    strictEqual(recType.kind, "Model");

    ok($(program).array.is(arrType));
    ok($(program).record.is(recType));

    strictEqual(arrType.name, "BTransform");
    strictEqual(recType.name, "CTransform");

    const arrA = (arrType as Model).indexer!.value as Model;
    const recA = (recType as Model).indexer!.value as Model;

    strictEqual(arrA, recA);

    strictEqual(arrA.kind, "Model");
    strictEqual(arrA.name, "ATransform");

    ok(arrA.properties.has("a"));
    ok(!arrA.properties.has("invisible"));
  });

  it("does not duplicate encodedName metadata", async () => {
    const diagnostics = await Tester.diagnose(`
      model SomeModel {
        @visibility(Lifecycle.Read)
        @encodedName("application/json", "some_other_name")
        someOtherName: string;
      }

      alias ReadModel = Read<SomeModel>;
    `);

    expectDiagnosticEmpty(diagnostics);
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
  strictEqual(nested.type.kind, "Model");
  strictEqual(nested.type.name, "CreateOrUpdateNested");

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
  strictEqual(nested.type.kind, "Model");
  strictEqual(nested.type.name, "UpdateNested");

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
  strictEqual(nested.type.kind, "Model");
  strictEqual(nested.type.name, "CreateNested");

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
  strictEqual(nested.type.kind, "Model");
  strictEqual(nested.type.name, "ReadNested");

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
