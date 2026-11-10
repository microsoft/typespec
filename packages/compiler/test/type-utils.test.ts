import { ok } from "assert";
import { describe, it } from "vitest";
import type { Enum, Interface, Model, Namespace, Operation, Type } from "../src/index.js";
import {
  isDeclaredInNamespace,
  isTemplateDeclaration,
  isTemplateDeclarationOrInstance,
  isTemplateInstance,
} from "../src/index.js";
import { t } from "../src/testing/index.js";
import { Tester } from "./tester.js";

describe("template utils", () => {
  it("check model is a template declaration", async () => {
    const { program } = await Tester.compile(`
       model Foo<T> {t: T};
    `);
    const Foo = program.checker.getGlobalNamespaceType().models.get("Foo")!;
    ok(isTemplateDeclarationOrInstance(Foo));
    ok(isTemplateDeclaration(Foo), "Should BE a template declaration");
    ok(!isTemplateInstance(Foo), "Should NOT be a template instance");
  });

  it("check model reference is a template instance", async () => {
    const { Bar } = await Tester.compile(t.code`
      model Foo<T> {t: T};

      model ${t.model("Bar")} {
        foo: Foo<string> 
      }
      `);
    const Foo = Bar.properties.get("foo")!.type as Model;

    ok(isTemplateDeclarationOrInstance(Foo));
    ok(isTemplateInstance(Foo), "Should BE a template instance");
    ok(!isTemplateDeclaration(Foo), "Should NOT be a template declaration");
  });

  it("check model expression inside a template instance is also a template instance", async () => {
    const { Bar } = await Tester.compile(t.code`
      model Foo<T> {a: { b: T }};

      model ${t.model("Bar")} {
        foo: Foo<string> 
      }
      `);
    const Foo = Bar.properties.get("foo")!.type as Model;
    const expr = Foo.properties.get("a")!.type;

    ok(isTemplateInstance(expr), "Should BE a template instance");
    ok(!isTemplateDeclaration(expr), "Should NOT be a template declaration");
  });

  it("check union expression inside a template instance is also a template instance", async () => {
    const { Bar } = await Tester.compile(t.code`
      model Foo<T> {a: int32 | T};

      model ${t.model("Bar")} {
        foo: Foo<string> 
      }
      `);
    const Foo = Bar.properties.get("foo")!.type as Model;
    const expr = Foo.properties.get("a")!.type;

    ok(isTemplateInstance(expr), "Should BE a template instance");
    ok(!isTemplateDeclaration(expr), "Should NOT be a template declaration");
  });

  it("accepts generic Type for ordinary non-templated types", async () => {
    const { program } = await Tester.compile(`
      model Bar { x: string };
      enum Color { Red, Blue };
    `);
    const globalNs = program.checker.getGlobalNamespaceType();
    const Bar: Type = globalNs.models.get("Bar")!;
    const Color: Type = globalNs.enums.get("Color")!;
    const prop: Type = (Bar as Model).properties.get("x")!;
    const stringType: Type = program.checker.getStdType("string");

    ok(!isTemplateDeclaration(Bar), "Plain model should NOT be a template declaration");
    ok(
      !isTemplateDeclarationOrInstance(Bar),
      "Plain model should NOT be a template declaration or instance",
    );

    ok(!isTemplateDeclaration(Color), "Enum should NOT be a template declaration");
    ok(
      !isTemplateDeclarationOrInstance(Color),
      "Enum should NOT be a template declaration or instance",
    );

    ok(!isTemplateDeclaration(prop), "Property should NOT be a template declaration");
    ok(
      !isTemplateDeclarationOrInstance(prop),
      "Property should NOT be a template declaration or instance",
    );

    ok(!isTemplateDeclaration(stringType), "Std type should NOT be a template declaration");
    ok(
      !isTemplateDeclarationOrInstance(stringType),
      "Std type should NOT be a template declaration or instance",
    );
  });

  it("accepts generic Type for template declarations of all templated kinds", async () => {
    const { program } = await Tester.compile(`
      model M<T> { t: T };
      op O<T>(): T;
      interface I<T> {};
      union U<T> { a: T };
      scalar S<T>;
    `);
    const globalNs = program.checker.getGlobalNamespaceType();
    const M: Type = globalNs.models.get("M")!;
    const O: Type = globalNs.operations.get("O")!;
    const I: Type = globalNs.interfaces.get("I")!;
    const U: Type = globalNs.unions.get("U")!;
    const S: Type = globalNs.scalars.get("S")!;

    for (const [name, type] of [
      ["Model", M],
      ["Operation", O],
      ["Interface", I],
      ["Union", U],
      ["Scalar", S],
    ] as const) {
      ok(isTemplateDeclaration(type), `${name} should BE a template declaration`);
      ok(
        isTemplateDeclarationOrInstance(type),
        `${name} should BE a template declaration or instance`,
      );
      ok(!isTemplateInstance(type), `${name} should NOT be a template instance`);
    }
  });

  it("accepts generic Type for template instances", async () => {
    const { Bar } = await Tester.compile(t.code`
      model Foo<T> { t: T };

      model ${t.model("Bar")} {
        foo: Foo<string>
      }
    `);
    const Foo: Type = Bar.properties.get("foo")!.type;

    ok(!isTemplateDeclaration(Foo), "Template instance should NOT be a template declaration");
    ok(
      isTemplateDeclarationOrInstance(Foo),
      "Template instance should BE a template declaration or instance",
    );
    ok(isTemplateInstance(Foo), "Template instance should BE a template instance");
  });
});

describe("definition utils", () => {
  it("checks if a type is defined in a particular namespace or its child namespaces", async () => {
    const {
      Alpha,
      SubAlpha,
      Beta,
      FooModel,
      FooEnum,
      FooOperation,
      BarOperation,
      FooNamespace,
      FooInterface,
    } = await Tester.compile(t.code`
          namespace ${t.namespace("Alpha")} {
            namespace ${t.namespace("SubAlpha")} {
              model ${t.model("FooModel")} {}
              enum ${t.enum("FooEnum")} {}
              op ${t.op("FooOperation")}(): unknown;
              namespace ${t.namespace("FooNamespace")} {}
              interface ${t.interface("FooInterface")} {
                op ${t.op("BarOperation")}(): unknown;
              }
            }
          }

          namespace ${t.namespace("Beta")} {}
`);

    const candidates: [string, Model | Enum | Operation | Namespace | Interface][] = [
      ["FooModel", FooModel],
      ["FooEnum", FooEnum],
      ["FooOperation", FooOperation],
      ["BarOperation", BarOperation],
      ["FooNamespace", FooNamespace],
      ["FooInterface", FooInterface],
    ];

    for (const [name, type] of candidates) {
      ok(isDeclaredInNamespace(type, Alpha), `${name} was not found recursively under Alpha`);
      ok(isDeclaredInNamespace(type, SubAlpha), `${name} was not found under SubAlpha`);
      ok(
        !isDeclaredInNamespace(type, Alpha, { recursive: false }),
        `${name} should not be found when recursive: false`,
      );
      ok(
        !isDeclaredInNamespace(type, Beta, { recursive: false }),
        `${name} should not be found in namespace Beta`,
      );
    }
  });
});
