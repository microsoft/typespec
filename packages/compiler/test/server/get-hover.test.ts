import { deepStrictEqual, ok } from "assert";
import { describe, it } from "vitest";
import { Hover, MarkupKind } from "vscode-languageserver";
import { fileRef } from "../../src/core/file-ref.js";
import { createLinterRule, createTypeSpecLibrary } from "../../src/core/library.js";
import { extractCursor } from "../../src/testing/source-utils.js";
import { createTestServerHost } from "../../src/testing/test-server-host.js";

describe("scalar", () => {
  it("scalar declaration", async () => {
    const hover = await getHoverAtCursor(
      `
          scalar myStr┆ing;
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "scalar myString\n" + "```",
      },
    });
  });

  it("scalar reference", async () => {
    const hover = await getHoverAtCursor(
      `
          scalar myString;
          scalar myStringEx extends myStr┆ing;
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "scalar myString\n" + "```",
      },
    });
  });

  it("scalar init with object literal argument", async () => {
    const hover = await getHoverAtCursor(`          
      model MyModel {
        /**
         * name of the model
         */
        name: string;
      }
      scalar MyString extends string{
        init createFromModel(arg: MyModel);
      }
      const abc = MyString.createFromModel(#{ na┆me: "hello" });
      `);
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "(model property)\n```typespec\nMyModel.name: string\n```\n\nname of the model",
      },
    });
  });
});

describe("enum", () => {
  it("normal enum", async () => {
    const hover = await getHoverAtCursor(
      `
        enum Direc┆tion {
          North,
          East,
          South,
          West,
        }
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "enum Direction\n" + "```",
      },
    });
  });

  it("normal enum member in namespace", async () => {
    const hover = await getHoverAtCursor(
      `
        namespace TestNS;
        enum Direction {
          Nor┆th,
          East,
          South,
          West,
        }
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "(enum member)\n" + "```typespec\n" + "TestNS.Direction.North\n" + "```",
      },
    });
  });
});

describe("alias", () => {
  it("test alias declaration", async () => {
    const hover = await getHoverAtCursor(
      `
          namespace TestNS;
          alias Mix┆ed<T> = string | int16 | Array<T>;
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "alias TestNS.Mixed<T>\n" + "```",
      },
    });
  });

  it("test alias reference", async () => {
    const hover = await getHoverAtCursor(
      `
          namespace TestNS;
          alias myString = string;
          alias myStringEx = myStr┆ing;
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "alias TestNS.myString\n" + "```",
      },
    });
  });
});

describe("decorator", () => {
  it("test decorator", async () => {
    const hover = await getHoverAtCursor(
      `
          import "./dec-types.js";

          /**
           * description of single decorator
           */
          extern dec single(context);

          @si┆ngle
          namespace TestNS;
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value:
          "```typespec\n" +
          "dec single(context: unknown)\n" +
          "```\n\n" +
          "description of single decorator",
      },
    });
  });

  const decArgModelDef = `
    import "./dec-types.js";

    /**
     * my log context
     */
    model MyLogContext<T> {
      /**
       * name of log context 
       */
      name: string;
      /**
       * items of context
       */
      item: Record<T>;
    }

    /**
     * my log argument
     */
    model MyLogArg{
      /**
       * my log message
       */
      msg: string;
      /**
       * my log id
       */
      id: int16;
      /**
       * my log context
       */
      context: MyLogContext<string>;
    }

    extern dec single(target, arg: MyLogArg);`;

  it("test model expression as decorator parameter value", async () => {
    const hover = await getHoverAtCursor(
      `
          ${decArgModelDef}
          @single({
            ms┆g: "hello",
            id: 1,
            context: {
              name: "my context",
              item: {
                key: "value"
              }
            }
          
          })
          namespace TestNS;
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value:
          "(model property)\n" +
          "```typespec\n" +
          "MyLogArg.msg: string\n" +
          "```\n" +
          "\n" +
          "my log message",
      },
    });
  });

  it("test nested model expression as decorator parameter value", async () => {
    const hover = await getHoverAtCursor(
      `
          ${decArgModelDef}
          @single({
            msg: "hello",
            id: 1,
            context: {
              name: "my context",
              it┆em: {
                key: "value"
              }
            }
          
          })
          namespace TestNS;
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value:
          "(model property)\n" +
          "```typespec\n" +
          "MyLogContext<T>.item: Record<Element>\n" +
          "```\n" +
          "\n" +
          "items of context",
      },
    });
  });
});

describe("namespace", () => {
  it("normal namespace", async () => {
    const hover = await getHoverAtCursor(
      `
          namespace Test┆NS;
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "namespace TestNS\n" + "```",
      },
    });
  });

  it("nested namespace", async () => {
    const hover = await getHoverAtCursor(
      `
        namespace Foo {
          namespace Bar {
            namespace B┆az {
              model SampleModel {}
            }
          }
        }
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "namespace Foo.Bar.Baz\n" + "```",
      },
    });
  });
});

describe("model", () => {
  it("model declaration", async () => {
    const hover = await getHoverAtCursor(
      `
          model Ani┆mal{
              name: string;
              age: int16;
          }
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "model Animal\n" + "```",
      },
    });
  });

  it("model property with function type", async () => {
    const hover = await getHoverAtCursor(`
        model Test {
          fu┆nc: fn(v: valueof string) => valueof string;
        }
      `);

    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value:
          "(model property)\n```typespec\nTest.func: fn (v: valueof string) => valueof string\n```",
      },
    });
  });

  it("model reference", async () => {
    const hover = await getHoverAtCursor(
      `
          model Animal{
            name: string;
            age: int16;
          }
          model Cat is Ani┆mal{
          }
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "model Animal\n" + "```",
      },
    });
  });

  it("model in namespace", async () => {
    const hover = await getHoverAtCursor(
      `
          @service(#{title: "RT"})
          namespace TestNs;
          
          model Ani┆mal{
              name: string;
              age: int16;
          }
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "model TestNs.Animal\n" + "```",
      },
    });
  });

  it("model with one template arg", async () => {
    const hover = await getHoverAtCursor(
      `
          @service(#{title: "RT"})
          namespace TestNs;
          
          model Ani┆mal<T>{
              name: string;
              age: int16;
              tTag: T;
          }
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "model TestNs.Animal<T>\n" + "```",
      },
    });
  });

  it("model with two template args", async () => {
    const hover = await getHoverAtCursor(
      `
          @service(#{title: "RT"})
          namespace TestNs;
          
          model Ani┆mal<T, P>{
              name: string;
              age: int16;
              tTag: T;
          }
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "model TestNs.Animal<T, P>\n" + "```",
      },
    });
  });

  it("model with extends and is (full definition expected)", async () => {
    const hover = await getHoverAtCursor(
      `
          namespace TestNs;
          
          model Do┆g is Animal<string, DogProperties> {
              barkVolume: int32;
          }

          model Animal<T, P> extends AnimalBase<P>{
              name: string;
              age: int16;
              tTag: T;
          }

          model AnimalBase<P> {
              id: string;
              properties: P;
          }


          model DogProperties {
              breed: string;
              color: string;
          }
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: `\`\`\`typespec
model TestNs.Dog
\`\`\`

*Full Definition:*

\`\`\`typespec
model TestNs.Dog{
  name: string;
  age: int16;
  tTag: string;
  barkVolume: int32;
  id: string;
  properties: TestNs.DogProperties;
}
\`\`\``,
      },
    });
  });
});

describe("interface", () => {
  it("interface declaration", async () => {
    const hover = await getHoverAtCursor(
      `
          interface IAct┆ions{
              fly(): void;
          }
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "interface IActions\n" + "```",
      },
    });
  });

  it("interface reference", async () => {
    const hover = await getHoverAtCursor(
      `
          interface IActions{
              fly(): void;
          }
          interface IActionsEx extends IAct┆ions{
          }
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "interface IActions\n" + "```",
      },
    });
  });

  it("interface in namespace", async () => {
    const hover = await getHoverAtCursor(
      `
          @service(#{title: "RT"})
          namespace TestNs;
          
          interface IAct┆ions{
            fly(): void;
        }
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "interface TestNs.IActions\n" + "```",
      },
    });
  });

  it("interface with extends", async () => {
    const hover = await getHoverAtCursor(
      `
          namespace TestNs;
          
          interface IActions{
            fly(): void;
          }

          interface Bi┆rd extends IActions {
            eat(): void;
          }
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: `\`\`\`typespec
interface TestNs.Bird
\`\`\`

*Full Definition:*

\`\`\`typespec
interface TestNs.Bird {
  op fly(): void;
  op eat(): void;
}
\`\`\``,
      },
    });
  });
});

describe("operation", () => {
  it("operation declaration", async () => {
    const hover = await getHoverAtCursor(
      `
          op Ea┆t(food: string): void;
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "op Eat(food: string): void\n" + "```",
      },
    });
  });

  it("operation reference", async () => {
    const hover = await getHoverAtCursor(
      `
          op Eat(food: string): void;
          op Swallow is Ea┆t;
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "op Eat(food: string): void\n" + "```",
      },
    });
  });

  it("operation in namespace", async () => {
    const hover = await getHoverAtCursor(
      `
          @service(#{title: "RT"})
          namespace TestNs;
          
          op Ea┆t(food: string): void;
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "op TestNs.Eat(food: string): void\n" + "```",
      },
    });
  });

  it("operation with one template arg", async () => {
    const hover = await getHoverAtCursor(
      `
          @service(#{title: "RT"})
          namespace TestNs;
          
          op Ea┆t<T>(food: string): void;
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "op TestNs.Eat<T>(food: string): void\n" + "```",
      },
    });
  });

  it("operation with two template args", async () => {
    const hover = await getHoverAtCursor(
      `
          @service(#{title: "RT"})
          namespace TestNs;
          
          op Ea┆t<T, P>(food: string): void;
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "op TestNs.Eat<T, P>(food: string): void\n" + "```",
      },
    });
  });

  it("operation in interface", async () => {
    const hover = await getHoverAtCursor(
      `
          @service(#{title: "RT"})
          namespace TestNs;
          
          interface IActions {
            op Ea┆t<T, P>(food: string): string;
          }
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "op TestNs.IActions.Eat<T, P>(food: string): string\n" + "```",
      },
    });
  });

  it("operation in interface with template", async () => {
    const hover = await getHoverAtCursor(
      `
          @service(#{title: "RT"})
          namespace TestNs;
          
          interface IActions<Q> {
            op Ea┆t<T, P>(food: string): string;
          }
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "op TestNs.IActions<Q>.Eat<T, P>(food: string): string\n" + "```",
      },
    });
  });
});

describe("const", () => {
  it("declaration", async () => {
    const hover = await getHoverAtCursor(
      `
          const a┆bc = #{ a: 123 };
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "const abc: { a: 123 }\n" + "```",
      },
    });
  });

  it("reference", async () => {
    const hover = await getHoverAtCursor(
      `
          const abc = #{ a: 123 };
          const def = a┆bc;
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "```typespec\n" + "const abc: { a: 123 }\n" + "```",
      },
    });
  });

  it("object literal property", async () => {
    const hover = await getHoverAtCursor(
      `
          model MyModel {
            /**
             * name of the model
             */
            name: string;
          }
          const abc : MyModel = #{ na┆me: "hello" };
        `,
    );
    deepStrictEqual(hover, {
      contents: {
        kind: MarkupKind.Markdown,
        value: "(model property)\n```typespec\nMyModel.name: string\n```\n\nname of the model",
      },
    });
  });
});

describe("template access", () => {
  it("shows template parameter hover using extends signature", async () => {
    const hover = await getHoverAtCursor(`
        model X<T extends string> {
          value: T┆;
        }
      `);

    const value = getHoverValue(hover);
    ok(value);
    ok(value.includes("(template parameter)"));
    ok(value.includes("T extends string"));
  });

  it("shows template access hover with concrete constraint information", async () => {
    const hover = await getHoverAtCursor(
      `
        model X {
          a: string;
        }
        model Y<M extends X> {
          p: M.a::ty┆pe;
        }
        `,
    );

    const value = getHoverValue(hover);
    ok(value);
    ok(value.includes("(template access)"));
    ok(value.includes("M.a::type extends string"));
  });

  it("shows template access hover for reflection-constrained metaproperties", async () => {
    const hover = await getHoverAtCursor(
      `
        model Y<P extends Reflection.ModelProperty> {
          p: P::ty┆pe;
        }
        `,
    );

    const value = getHoverValue(hover);
    ok(value);
    ok(value.includes("(template access)"));
    ok(value.includes("P::type extends unknown"));
  });

  it("keeps template access hover in template declarations with downstream instantiations", async () => {
    const memberHover = await getHoverAtCursor(`
        model X<s extends Reflection.Scalar> {
          y: s;
        }

        model A<M extends X<string>> {
          z: M.┆y::type;
        }

        op foo<s extends Reflection.Scalar>(): A<X<string>>;

        interface Operations<O extends Reflection.Operation> {
          get(): O::returnType;
        }

        interface Z extends Operations<foo<string>> {}
      `);
    const memberValue = getHoverValue(memberHover);
    ok(memberValue);
    ok(memberValue.includes("(template access)"));
    ok(memberValue.includes("M.y extends X<string>.y"));

    const metapropertyHover = await getHoverAtCursor(`
        model X<s extends Reflection.Scalar> {
          y: s;
        }

        model A<M extends X<string>> {
          z: M.y::ty┆pe;
        }

        op foo<s extends Reflection.Scalar>(): A<X<string>>;

        interface Operations<O extends Reflection.Operation> {
          get(): O::returnType;
        }

        interface Z extends Operations<foo<string>> {}
      `);
    const metapropertyValue = getHoverValue(metapropertyHover);
    ok(metapropertyValue);
    ok(metapropertyValue.includes("(template access)"));
    ok(metapropertyValue.includes("M.y::type extends string"));

    const returnTypeHover = await getHoverAtCursor(`
        model X<s extends Reflection.Scalar> {
          y: s;
        }

        model A<M extends X<string>> {
          z: M.y::type;
        }

        op foo<s extends Reflection.Scalar>(): A<X<string>>;

        interface Operations<O extends Reflection.Operation> {
          get(): O::ret┆urnType;
        }

        interface Z extends Operations<foo<string>> {}
      `);
    const returnTypeValue = getHoverValue(returnTypeHover);
    ok(returnTypeValue);
    ok(returnTypeValue.includes("(template access)"));
    ok(returnTypeValue.includes("O::returnType extends unknown"));
  });
});

describe("compiler: server: on hover: diagnostic docs", () => {
  it("shows the extended docs and reference link of a diagnostic reported at the position", async () => {
    const value = await getHoverValueWithLibDiagnostic({
      docs: "This is the **extended** documentation for always-error.",
      referenceDocsBaseUrl: "https://example.com/test-lib/reference",
    });
    ok(value);
    ok(
      value.includes("This is the **extended** documentation for always-error."),
      `Expected extended docs in hover, got:\n${value}`,
    );
    ok(
      value.includes(
        "[See documentation](https://example.com/test-lib/reference/diagnostics/always-error)",
      ),
      `Expected reference link in hover, got:\n${value}`,
    );
  });

  it("reads docs from a co-located file referenced with fileRef", async () => {
    const value = await getHoverValueWithLibDiagnostic({
      docs: fileRef.fromPackageRoot("docs/always-error.md"),
      docContent: "Documentation loaded from a file.",
    });
    ok(value);
    ok(
      value.includes("Documentation loaded from a file."),
      `Expected file-based docs in hover, got:\n${value}`,
    );
  });

  it("resolves fileRef docs from a dependency hoisted to an ancestor node_modules", async () => {
    const value = await getHoverValueWithLibDiagnostic({
      docs: fileRef.fromPackageRoot("docs/always-error.md"),
      docContent: "Documentation loaded from a hoisted package.",
      hoisted: true,
    });
    ok(value);
    ok(
      value.includes("Documentation loaded from a hoisted package."),
      `Expected hoisted file-based docs in hover, got:\n${value}`,
    );
  });

  it("does not show a dead reference link when the diagnostic has no docs", async () => {
    const value = await getHoverValueWithLibDiagnostic({
      referenceDocsBaseUrl: "https://example.com/test-lib/reference",
    });
    ok(value);
    ok(
      !value.includes("[See documentation]"),
      `Expected no reference link in hover, got:\n${value}`,
    );
  });

  // Regression: a library's `$linter` commonly lives only in its default entry (e.g. http's
  // `index.js`), while the entry imported by `.tsp` files (the `typespec` condition) exposes
  // only `$lib`. The hover must still resolve linter-rule docs from the default entry.
  it("shows linter rule docs whose $linter is only in the library's default entry", async () => {
    const testHost = await createTestServerHost();
    const packageRoot = "test/node_modules/linter-lib";

    const $lib = createTypeSpecLibrary({
      name: "linter-lib",
      referenceDocs: { baseUrl: "https://example.com/linter-lib/reference" },
      diagnostics: {},
    } as any);
    const noModelsRule = createLinterRule({
      name: "no-models",
      severity: "warning",
      description: "Models are not allowed.",
      docs: "Extended docs for the **no-models** rule (from the default entry).",
      messages: { default: "Models are not allowed." },
      create(context) {
        return { model: (model) => context.reportDiagnostic({ target: model }) };
      },
    });

    // `typespec` condition entry: only `$lib`, NO `$linter`.
    testHost.addJsFile(`${packageRoot}/tsp-index.js`, { $lib });
    // default/`import` condition entry: both `$lib` and `$linter`.
    testHost.addJsFile(`${packageRoot}/index.js`, { $lib, $linter: { rules: [noModelsRule] } });
    testHost.addTypeSpecFile(
      `${packageRoot}/package.json`,
      JSON.stringify({
        name: "linter-lib",
        version: "0.1.0",
        exports: { ".": { typespec: "./main.tsp", import: "./index.js" } },
        peerDependencies: { "@typespec/compiler": "*" },
      }),
    );
    testHost.addTypeSpecFile(
      `${packageRoot}/main.tsp`,
      `import "./tsp-index.js";\nnamespace LinterLib;\n`,
    );
    testHost.addTypeSpecFile(
      "test/package.json",
      JSON.stringify({ dependencies: { "linter-lib": "*" } }),
    );
    testHost.addTypeSpecFile(
      "test/tspconfig.yaml",
      "linter:\n  enable:\n    'linter-lib/no-models': true",
    );

    const { source, pos } = extractCursor(`
      import "linter-lib";

      model Fo┆o {}
    `);
    const document = testHost.addOrUpdateDocument("test/main.tsp", source);
    await testHost.server.compile(document, undefined, { mode: "full" });

    const value = getHoverValue(
      await testHost.server.getHover({
        textDocument: document,
        position: document.positionAt(pos),
      }),
    );
    ok(value);
    ok(
      value.includes("Extended docs for the **no-models** rule (from the default entry)."),
      `Expected linter rule docs in hover, got:\n${value}`,
    );
  });

  async function getHoverValueWithLibDiagnostic(options: {
    docs?: string | ReturnType<typeof fileRef.fromPackageRoot>;
    referenceDocsBaseUrl?: string;
    docContent?: string;
    hoisted?: boolean;
  }): Promise<string | undefined> {
    const testHost = await createTestServerHost();
    const projectRoot = options.hoisted ? "workspace/packages/test" : "test";
    const packageRoot = options.hoisted
      ? "workspace/node_modules/test-lib"
      : `${projectRoot}/node_modules/test-lib`;

    addTestLibrary(testHost, packageRoot, options);
    const { document, pos } = addTestProject(testHost, projectRoot, "Foo");

    // Full compile first so linter/library diagnostics are indexed for hover to pick up.
    await testHost.server.compile(document, undefined, { mode: "full" });

    return getHoverValue(
      await testHost.server.getHover({
        textDocument: document,
        position: document.positionAt(pos),
      }),
    );
  }

  function addTestLibrary(
    testHost: Awaited<ReturnType<typeof createTestServerHost>>,
    packageRoot: string,
    options: {
      docs?: string | ReturnType<typeof fileRef.fromPackageRoot>;
      referenceDocsBaseUrl?: string;
      docContent?: string;
    },
  ) {
    const $lib = createTypeSpecLibrary({
      name: "test-lib",
      ...(options.referenceDocsBaseUrl
        ? { referenceDocs: { baseUrl: options.referenceDocsBaseUrl } }
        : {}),
      diagnostics: {
        "always-error": {
          severity: "error",
          ...(options.docs !== undefined ? { docs: options.docs } : {}),
          messages: { default: "Always errors." },
        },
      },
    } as any);

    testHost.addJsFile(`${packageRoot}/index.js`, {
      $lib,
      $decorators: {
        TestLib: {
          alwaysError: (context: any, target: any) => {
            ($lib as any).reportDiagnostic(context.program, {
              code: "always-error",
              target,
            });
          },
        },
      },
    });
    testHost.addTypeSpecFile(
      `${packageRoot}/package.json`,
      JSON.stringify({
        name: "test-lib",
        version: "0.1.0",
        exports: {
          ".": {
            import: "./index.js",
            typespec: "./main.tsp",
          },
        },
        peerDependencies: { "@typespec/compiler": "*" },
      }),
    );
    testHost.addTypeSpecFile(
      `${packageRoot}/main.tsp`,
      `import "./index.js";\nnamespace TestLib;\nextern dec alwaysError(target: unknown);\n`,
    );
    if (options.docContent !== undefined) {
      testHost.addTypeSpecFile(`${packageRoot}/docs/always-error.md`, options.docContent);
    }
  }

  function addTestProject(
    testHost: Awaited<ReturnType<typeof createTestServerHost>>,
    projectRoot: string,
    modelName: string,
  ) {
    testHost.addTypeSpecFile(
      `${projectRoot}/package.json`,
      JSON.stringify({ dependencies: { "test-lib": "*" } }),
    );

    const { source, pos } = extractCursor(`
      import "test-lib";
      using TestLib;

      @alwaysError
      model ${modelName.slice(0, -1)}┆${modelName.slice(-1)} {}
    `);
    const document = testHost.addOrUpdateDocument(`${projectRoot}/main.tsp`, source);
    return { document, pos };
  }
});

async function getHoverAtCursor(sourceWithCursor: string): Promise<Hover | undefined> {
  const { source, pos } = extractCursor(sourceWithCursor);
  const testHost = await createTestServerHost();
  testHost.addJsFile("dec-types.js", {
    $single: () => {},
  });
  const textDocument = testHost.addOrUpdateDocument("test.tsp", source);
  return await testHost.server.getHover({
    textDocument,
    position: textDocument.positionAt(pos),
  });
}

/** Normalize hover contents into a single comparable string for assertions. */
function getHoverValue(hover: Hover | undefined): string | undefined {
  if (!hover) return undefined;
  const contents = hover.contents;
  if (typeof contents === "string") {
    return contents;
  }
  if (Array.isArray(contents)) {
    return contents.map((x) => (typeof x === "string" ? x : x.value)).join("\n");
  }
  return contents.value;
}
