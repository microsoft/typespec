import { ok } from "assert";
import { describe, it } from "vitest";
import {
  Enum,
  Interface,
  Model,
  Namespace,
  Operation,
  isDeclaredInNamespace,
  isTemplateDeclaration,
  isTemplateDeclarationOrInstance,
  isTemplateInstance,
} from "../src/index.js";
import { t } from "../src/testing/index.js";
import { Tester } from "./tester.js";

describe("compiler: type-utils", () => {
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
});
