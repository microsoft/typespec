import { deepStrictEqual, fail, ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { getSourceLocation } from "../../src/core/diagnostics.js";
import { Diagnostic, Model, StringLiteral, Type } from "../../src/core/types.js";
import { isUnknownType } from "../../src/index.js";
import {
  BasicTestRunner,
  TestHost,
  createTestHost,
  createTestRunner,
  expectDiagnosticEmpty,
  expectDiagnostics,
  extractCursor,
  extractSquiggles,
} from "../../src/testing/index.js";

describe("compiler: templates", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  function getLineAndCharOfDiagnostic(diagnostic: Diagnostic) {
    const source = getSourceLocation(diagnostic.target);
    if (source === undefined) {
      fail(`Couldn't resolve the source of diagnostic ${diagnostic}`);
    }
    return source.file.getLineAndCharacterOfPosition(source.pos);
  }

  it("emit diagnostics when using template params on non templated model", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        model A {}
        model B { 
          foo: A<string>
        };
      `,
    );
    const diagnostics = await testHost.diagnose("main.tsp");
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "invalid-template-args");
    strictEqual(diagnostics[0].message, "Can't pass template arguments to non-templated type");
    // Should point to the start of A<string>
    deepStrictEqual(getLineAndCharOfDiagnostic(diagnostics[0]), {
      line: 3,
      character: 15,
    });
  });

  it("emit diagnostics when using template without passing any arguments", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        model A<T> {}
        model B { 
          foo: A
        };
      `,
    );
    const diagnostics = await testHost.diagnose("main.tsp");
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "invalid-template-args");
    strictEqual(diagnostics[0].message, "Template argument 'T' is required and not specified.");
    // Should point to the start of A
    deepStrictEqual(getLineAndCharOfDiagnostic(diagnostics[0]), {
      line: 3,
      character: 15,
    });
  });

  it("emit diagnostics when using template with too many arguments", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        model A<T> {}
        model B { 
          foo: A<string, string>
        };
      `,
    );
    const diagnostics = await testHost.diagnose("main.tsp");
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "invalid-template-args");
    strictEqual(diagnostics[0].message, "Too many template arguments provided.");

    // Should point to the start of A<string, string>
    deepStrictEqual(getLineAndCharOfDiagnostic(diagnostics[0]), {
      line: 3,
      character: 15,
    });
  });

  it("allows default template parameters", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        @test model A<T, U = "hi"> { a: T, b: U }
        model B { 
          foo: A<"bye">
        };
      `,
    );

    const { A } = (await testHost.compile("main.tsp")) as { A: Model };
    const a = A.properties.get("a")!;
    const b = A.properties.get("b")!;
    strictEqual(a.type.kind, "String");
    strictEqual((a.type as StringLiteral).value, "bye");
    strictEqual(b.type.kind, "String");
    strictEqual((b.type as StringLiteral).value, "hi");
  });

  it("indeterminate defaults", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        model B<T extends valueof string> {}
        @test model A<T extends valueof string = ""> {
          b: B<T>
        }
        alias Test = A;
      `,
    );

    const diagnostics = await testHost.diagnose("main.tsp");
    expectDiagnosticEmpty(diagnostics);
  });

  it("allows default template parameters that are models", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        @test model A<T = string> { a: T }
        model B { 
          foo: A
        };
      `,
    );

    const { A } = (await testHost.compile("main.tsp")) as { A: Model };
    const a = A.properties.get("a")!;
    strictEqual(a.type.kind, "Scalar");
    strictEqual(a.type.name, "string");
  });

  it("template instance should be the exact same when passing value that is the same as the default", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        model Foo<A = string, B=string> { a: A, b: B }
        @test model Test { 
          a: Foo;
          b: Foo<string>;
          c: Foo<string, string>;
        };
      `,
    );

    const { Test } = (await testHost.compile("main.tsp")) as { Test: Model };
    const a = Test.properties.get("a")!;
    const b = Test.properties.get("b")!;
    const c = Test.properties.get("c")!;
    strictEqual(a.type, b.type);
    strictEqual(a.type, c.type);
  });

  it("emits diagnostics when using too few template parameters", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        @test model A<T, U, V = "hi"> { a: T, b: U, c: V }
        model B { 
          foo: A<"bye">
        };
      `,
    );

    const diagnostics = await testHost.diagnose("main.tsp");
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "invalid-template-args");
    strictEqual(diagnostics[0].message, "Template argument 'U' is required and not specified.");
  });

  it("emits diagnostics when non-defaulted template parameter comes after defaulted one", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        @test model A<T = "hi", U> { a: T, b: U }
      `,
    );

    const diagnostics = await testHost.diagnose("main.tsp");
    expectDiagnostics(diagnostics, { code: "default-required" });
  });

  it("emits diagnostics when defaulted template use later template parameter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        @test model A<A = B, B = "hi"> { a: A, b: B }
      `,
    );

    const diagnostics = await testHost.diagnose("main.tsp");
    expectDiagnostics(diagnostics, {
      code: "invalid-template-default",
      message:
        "Template parameter defaults can only reference previously declared type parameters.",
    });
  });

  it("emits diagnostics when defaulted template use later template parameter in complex type", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        @test model A<A = "one" | B, B = "hi"> { a: A, b: B }
      `,
    );

    const diagnostics = await testHost.diagnose("main.tsp");
    expectDiagnostics(diagnostics, {
      code: "invalid-template-default",
      message:
        "Template parameter defaults can only reference previously declared type parameters.",
    });
  });

  it("emits diagnostics for template parameter defaults that are incorrect", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        @test model A<T = Record> { a: T }
      `,
    );

    const diagnostics = await testHost.diagnose("main.tsp");
    expectDiagnostics(diagnostics, {
      code: "invalid-template-args",
      message: "Template argument 'Element' is required and not specified.",
    });
  });

  it("emits diagnostics when passing value to template parameter without constraint", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        model A<T> { }
        const a = "abc";
        alias B = A<a>;
      `,
    );

    const diagnostics = await testHost.diagnose("main.tsp");
    expectDiagnostics(diagnostics, {
      code: "value-in-type",
      message:
        "Template parameter has no constraint but a value is passed. Add `extends valueof unknown` to accept any value.",
    });
  });

  describe("instantiating a template with invalid args", () => {
    it("shouldn't pass thru the invalid args", async () => {
      const { pos, source } = extractCursor(`
    model AnObject<T extends {}> { t: T }
    
    alias Bar<T extends {}>  = AnObject<T>;
    
    alias NoConstaint<T> = Bar<┆T>;
  `);
      testHost.addTypeSpecFile("main.tsp", source);
      const diagnostics = await testHost.diagnose("main.tsp");
      // Only one error, Bar<T> can't be created as T is not constraint to object
      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument of type 'T' is not assignable to parameter of type '{}'",
        pos,
      });
    });

    it("an error type should revert to unknown", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
          model Test<T> {
            @test prop: T;
          }
          
          model Bar {
            a: Test<notExists>;
          }
        `,
      );
      const [{ prop }, diagnostics] = await testHost.compileAndDiagnose("main.tsp");
      // Only one error
      expectDiagnostics(diagnostics, {
        code: "unknown-identifier",
        message: "Unknown identifier notExists",
      });

      strictEqual(prop.kind, "ModelProperty");
      ok(isUnknownType(prop.type), "Prop type should be unknown");
    });

    it("operation should still be able to be used(no extra diagnostic)", async () => {
      const { pos, source } = extractCursor(`
    op Action<T extends {}>(): T;

    op foo is Action<┆"abc">;
  `);
      testHost.addTypeSpecFile("main.tsp", source);
      const diagnostics = await testHost.diagnose("main.tsp");
      // Only one error, Bar<T> can't be created as T is not constraint to object
      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: `Argument of type '"abc"' is not assignable to parameter of type '{}'`,
        pos,
      });
    });
  });

  it("can reference other parameters", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        @test model A<T, X = T> { a: T, b: X }
        model B { 
          foo: A<"bye">
        };
      `,
    );

    const { A } = (await testHost.compile("main.tsp")) as { A: Model };
    const a = A.properties.get("a")!;
    const b = A.properties.get("b")!;
    strictEqual(a.type.kind, "String");
    strictEqual((a.type as StringLiteral).value, "bye");
    strictEqual(b.type.kind, "String");
    strictEqual((b.type as StringLiteral).value, "bye");
  });

  it("can reference other parameters in default in a model expression", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        @test model A<T, X = {t: T}> { b: X }
        model B { 
          foo: A<"bye">
        };
      `,
    );

    const { A } = (await testHost.compile("main.tsp")) as { A: Model };
    const b = A.properties.get("b")!;
    strictEqual(b.type.kind, "Model" as const);
    const t = b.type.properties.get("t")!.type;
    strictEqual(t.kind, "String" as const);
    strictEqual(t.value, "bye");
  });

  it("can reference other parameters in default via another template", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        @test model A<T, X = Foo<T>> { b: X }
        model B {
          foo: A<"bye">
        };

        model Foo<T> {
          t: T;
        }
      `,
    );

    const { A } = (await testHost.compile("main.tsp")) as { A: Model };
    const b = A.properties.get("b")!;
    strictEqual(b.type.kind, "Model" as const);
    const t = b.type.properties.get("t")!.type;
    strictEqual(t.kind, "String" as const);
    strictEqual(t.value, "bye");
  });

  it("emit diagnostics if referencing itself", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        @test model A<T = T> { a: T }
        model B { 
          foo: A
        };
      `,
    );

    const diagnostics = await testHost.diagnose("main.tsp");
    expectDiagnostics(diagnostics, {
      code: "invalid-template-default",
      message:
        "Template parameter defaults can only reference previously declared type parameters.",
    });
  });

  it("emit diagnostics if args reference each other", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        @test model A<T = K, K = T> { a: T }
        model B { 
          foo: A
        };
      `,
    );

    const diagnostics = await testHost.diagnose("main.tsp");
    expectDiagnostics(diagnostics, {
      code: "invalid-template-default",
      message:
        "Template parameter defaults can only reference previously declared type parameters.",
    });
  });

  it("emit diagnostics if referencing itself nested", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        @test model A<T = {foo: T}> { a: T }
        model B { 
          foo: A
        };
      `,
    );

    const diagnostics = await testHost.diagnose("main.tsp");
    expectDiagnostics(diagnostics, {
      code: "invalid-template-default",
      message:
        "Template parameter defaults can only reference previously declared type parameters.",
    });
  });

  describe("constraints", () => {
    let runner: BasicTestRunner;

    beforeEach(async () => {
      runner = await createTestRunner();
    });

    it("compile when the constrain is satisfied in the default value", async () => {
      await runner.compile(`
        model A<T extends string = "abc"> { a: T }
      `);
    });

    it("compile when the constrain is satisfied in template arg", async () => {
      await runner.compile(`
        model A<T extends string> { a: T }

        model B {
          a: A<"def">
        }
      `);
    });

    it("emits diagnostic when constraint reference itself", async () => {
      testHost.addTypeSpecFile("main.tsp", `model Test<A extends A> {}`);

      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "circular-constraint",
        message: "Type parameter 'A' has a circular constraint.",
      });
    });

    it("emits diagnostic when constraint reference other parameter in circular constraint", async () => {
      testHost.addTypeSpecFile("main.tsp", `model Test<A extends B, B extends A> {}`);

      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "circular-constraint",
        message: "Type parameter 'A' has a circular constraint.",
      });
    });

    it("emits diagnostic when constraint reference itself inside an expression", async () => {
      testHost.addTypeSpecFile("main.tsp", `model Test<A extends {name: A}> {}`);

      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "circular-constraint",
        message: "Type parameter 'A' has a circular constraint.",
      });
    });

    it("emit diagnostics if template default is not assignable to constraint", async () => {
      const { source, pos, end } = extractSquiggles(`
        model A<T extends string = ~~~123~~~> { a: T }
      `);
      const diagnostics = await runner.diagnose(source);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
        message: "Type '123' is not assignable to type 'string'",
        pos,
        end,
      });
    });

    it("emit diagnostics if template reference arg is not assignable to constraint", async () => {
      const { source, pos, end } = extractSquiggles(`
        model A<T extends string> { a: T }

        model B {
          a: A<~~~456~~~>
        }
      `);
      const diagnostics = await runner.diagnose(source);
      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument of type '456' is not assignable to parameter of type 'string'",
        pos,
        end,
      });
    });

    it("use constrain as type when referencing another template", async () => {
      await runner.compile(`
        model A<T extends string> { b: B<T> }
        model B<T extends string> {}
      `);
    });

    it("use constrain as type when referencing another template parameter", async () => {
      await runner.compile(`
        model Foo<A extends string, B extends string = A> { b: B }
      `);
    });

    it("emit diagnostics if using another template with a constraint but template parameter constraint is not compatible", async () => {
      const { source, pos, end } = extractSquiggles(`
        model A<T> { b: B<~~~T~~~> }
        model B<T extends string> {}
      `);
      const diagnostics = await runner.diagnose(source);
      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument of type 'T' is not assignable to parameter of type 'string'",
        pos,
        end,
      });
    });
  });

  describe("doesn't run decorators on model properties when projecting template declarations", () => {
    async function expectMarkDecoratorNotCalled(code: string) {
      testHost.addJsFile("mark.js", {
        $mark: () => fail("Should not have called decorator"),
      });

      testHost.addTypeSpecFile(
        "main.tsp",
        `
      import "./mark.js";
      ${code}
     `,
      );

      await testHost.compile("main.tsp");
    }

    it("on model", async () => {
      await expectMarkDecoratorNotCalled(`
          model Foo<T> {
            @mark(T)
            prop: string;
          }
        `);
    });

    it("on model properties", async () => {
      await expectMarkDecoratorNotCalled(`
          model Foo<T> {
            @mark(T)
            prop: string;
          }
        `);
    });

    it("on model properties (on operation)", async () => {
      await expectMarkDecoratorNotCalled(`
          op foo<T>(): {
            @mark(T)
            prop: string;
          };
        `);
    });

    it("on model properties (nested)", async () => {
      await expectMarkDecoratorNotCalled(`
          model Foo<T> {
            nested: {
              @mark(T)
              prop: string;
            }
          }
        `);
    });
  });

  describe("named template argument instantiations", () => {
    it("with named arguments", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
          model A<T> { a: T }
          @test model B {
            foo: A<T = string>
          };
        `,
      );

      const { B } = (await testHost.compile("main.tsp")) as { B: Model };
      const foo = B.properties.get("foo")!.type;
      strictEqual(foo.kind, "Model");
      const a = foo.properties.get("a")!;
      strictEqual(a.type.kind, "Scalar");
      strictEqual(a.type.name, "string");
    });

    it("with named arguments out of order", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
          model A<T, U> { a: T, b: U }
          @test model B {
            foo: A<U = int32, T = string>
          };
        `,
      );

      const { B } = (await testHost.compile("main.tsp")) as { B: Model };
      const foo = B.properties.get("foo")!.type;
      strictEqual(foo.kind, "Model");
      const a = foo.properties.get("a")!;
      const b = foo.properties.get("b")!;
      strictEqual(a.type.kind, "Scalar");
      strictEqual(a.type.name, "string");
      strictEqual(b.type.kind, "Scalar");
      strictEqual(b.type.name, "int32");
    });

    it("with named arguments and defaults", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
          model A<T = int32, U = string> { a: T, b: U }
          @test model B {
            foo: A<U = "bar">
          };
        `,
      );

      const { B } = (await testHost.compile("main.tsp")) as { B: Model };
      const foo = B.properties.get("foo")!.type;
      strictEqual(foo.kind, "Model");
      const a = foo.properties.get("a")!;
      const b = foo.properties.get("b")!;
      strictEqual(a.type.kind, "Scalar");
      strictEqual(a.type.name, "int32");
      strictEqual(b.type.kind, "String");
      strictEqual(b.type.value, "bar");
    });

    it("with named arguments and defaults bound to other parameters", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
          model A<T, U = T> { a: T, b: U }
          @test model B {
            foo: A<T = string>
          };
        `,
      );

      const { B } = (await testHost.compile("main.tsp")) as { B: Model };
      const foo = B.properties.get("foo")!.type;
      strictEqual(foo.kind, "Model");
      const a = foo.properties.get("a")!;
      const b = foo.properties.get("b")!;
      strictEqual(a.type.kind, "Scalar");
      strictEqual(a.type.name, "string");
      strictEqual(b.type.kind, "Scalar");
      strictEqual(b.type.name, "string");
    });

    it("with named and positional arguments", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
          model A<T, U = int32, V extends string = string> { a: T, b: U, c: V }

          @test model B {
            foo: A<boolean, V = "bar">
          }

          @test model C {
            foo: A<T = boolean, V = "bar">
          }
        `,
      );

      const { B, C } = (await testHost.compile("main.tsp")) as { B: Model; C: Model };

      for (const M of [B, C]) {
        const foo = M.properties.get("foo")!.type;
        strictEqual(foo.kind, "Model");
        const a = foo.properties.get("a")!;
        const b = foo.properties.get("b")!;
        const c = foo.properties.get("c")!;
        strictEqual(a.type.kind, "Scalar");
        strictEqual(a.type.name, "boolean");
        strictEqual(b.type.kind, "Scalar");
        strictEqual(b.type.name, "int32");
        strictEqual(c.type.kind, "String");
        strictEqual(c.type.value, "bar");
      }
    });

    it("cannot specify name of nonexistent parameter", async () => {
      const { pos, end, source } = extractSquiggles(`
      model A<T> { a: T }

      @test model B {
        foo: A<string, ~~~U = "bar"~~~>
      }
    `);

      testHost.addTypeSpecFile("main.tsp", source);

      const [{ B }, diagnostics] = (await testHost.compileAndDiagnose("main.tsp")) as [
        { B: Model },
        Diagnostic[],
      ];

      const foo = B.properties.get("foo")!.type;
      strictEqual(foo.kind, "Model");
      const a = foo.properties.get("a")!;
      strictEqual(a.type.kind, "Scalar");
      strictEqual(a.type.name, "string");

      expectDiagnostics(diagnostics, {
        code: "invalid-template-args",
        message: "No parameter named 'U' exists in the target template.",
        pos,
        end,
      });
    });

    it("cannot specify argument twice", async () => {
      const { pos, end, source } = extractSquiggles(`
      model A<T> { a: T }

      @test model B {
        foo: A<string, ~~~T = "bar"~~~>
      }
    `);

      testHost.addTypeSpecFile("main.tsp", source);

      const [{ B }, diagnostics] = (await testHost.compileAndDiagnose("main.tsp")) as [
        { B: Model },
        Diagnostic[],
      ];

      const foo = B.properties.get("foo")!.type;
      strictEqual(foo.kind, "Model");
      const a = foo.properties.get("a")!;
      strictEqual(a.type.kind, "Scalar");
      strictEqual(a.type.name, "string");

      expectDiagnostics(diagnostics, {
        code: "invalid-template-args",
        message: "Cannot specify template argument 'T' again.",
        pos,
        end,
      });
    });

    it("cannot specify argument twice by name", async () => {
      const { pos, end, source } = extractSquiggles(`
      model A<T> { a: T }

      @test model B {
        foo: A<T = string, ~~~T = "bar"~~~>
      }
    `);

      testHost.addTypeSpecFile("main.tsp", source);

      const [{ B }, diagnostics] = (await testHost.compileAndDiagnose("main.tsp")) as [
        { B: Model },
        Diagnostic[],
      ];

      const foo = B.properties.get("foo")!.type;
      strictEqual(foo.kind, "Model");
      const a = foo.properties.get("a")!;
      strictEqual(a.type.kind, "Scalar");
      strictEqual(a.type.name, "string");

      expectDiagnostics(diagnostics, {
        code: "invalid-template-args",
        message: "Cannot specify template argument 'T' again.",
        pos,
        end,
      });
    });

    it("cannot specify positional argument after named argument", async () => {
      const { pos, end, source } = extractSquiggles(`
      model A<T, U, V extends string = string> { a: T, b: U, c: V }

      @test model B {
        foo: ~~~A<boolean, V = "bar", string>~~~
      }
    `);

      testHost.addTypeSpecFile("main.tsp", source);

      const [{ B }, diagnostics] = (await testHost.compileAndDiagnose("main.tsp")) as [
        { B: Model },
        Diagnostic[],
      ];

      const foo = B.properties.get("foo")!.type;
      strictEqual(foo.kind, "Model");
      const a = foo.properties.get("a")!;
      const b = foo.properties.get("b")!;
      const c = foo.properties.get("c")!;
      strictEqual(a.type.kind, "Scalar");
      strictEqual(a.type.name, "boolean");
      strictEqual(b.type.kind, "Intrinsic");
      strictEqual(b.type.name, "unknown");
      strictEqual(c.type.kind, "String");
      strictEqual(c.type.value, "bar");

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-template-args",
          message:
            "Positional template arguments cannot follow named arguments in the same argument list.",
          pos: pos + 22,
          end: end - 1,
        },
        {
          code: "invalid-template-args",
          message: "Template argument 'U' is required and not specified.",
          pos,
          end,
        },
      ]);
    });

    it("cannot specify positional argument after named argument with default omitted", async () => {
      const { pos, end, source } = extractSquiggles(`
      model A<T, U = int32, V extends string = string> { a: T, b: U, c: V }

      @test model B {
        foo: A<boolean, V = "bar", ~~~string~~~>
      }
    `);

      testHost.addTypeSpecFile("main.tsp", source);

      const [{ B }, diagnostics] = (await testHost.compileAndDiagnose("main.tsp")) as [
        { B: Model },
        Diagnostic[],
      ];

      const foo = B.properties.get("foo")!.type;
      strictEqual(foo.kind, "Model");
      const a = foo.properties.get("a")!;
      const b = foo.properties.get("b")!;
      const c = foo.properties.get("c")!;
      strictEqual(a.type.kind, "Scalar");
      strictEqual(a.type.name, "boolean");
      strictEqual(b.type.kind, "Scalar");
      strictEqual(b.type.name, "int32");
      strictEqual(c.type.kind, "String");
      strictEqual(c.type.value, "bar");

      expectDiagnostics(diagnostics, {
        code: "invalid-template-args",
        message:
          "Positional template arguments cannot follow named arguments in the same argument list.",
        pos: pos,
        end: end,
      });
    });

    it("cannot specify a typereference with args as a parameter name", async () => {
      const { pos, end, source } = extractSquiggles(`
      model A<T> { a: T }

      @test model B {
        foo: A<~~~T<string>~~~ = string>
      }
    `);

      testHost.addTypeSpecFile("main.tsp", source);

      const diagnostics = await testHost.diagnose("main.tsp");

      expectDiagnostics(diagnostics, {
        code: "invalid-template-argument-name",
        message: "Template parameter argument names must be valid, bare identifiers.",
        pos,
        end,
      });
    });

    it("template arguments are evaluated in the correct order", async () => {
      const members: [Type, Type][] = [];

      testHost.addJsFile("effect.js", {
        $effect: (_: DecoratorContext, target: Type, value: Type) => {
          members.push([target, value]);
        },
      });

      testHost.addTypeSpecFile(
        "main.tsp",
        `
        import "./effect.js";

        @effect(T)
        model Dec<T> { t: T }

        model A<T, U> { a: T, b: U }

        @test model B {
          bar: A<U = Dec<string>, T = Dec<int32>>
        }
        `,
      );

      const { B } = (await testHost.compile("main.tsp")) as { B: Model };
      const bar = B.properties.get("bar")!.type;
      strictEqual(bar.kind, "Model");
      const a = bar.properties.get("a")!;
      const b = bar.properties.get("b")!;
      strictEqual(a.type.kind, "Model");
      strictEqual(a.type.name, "Dec");
      strictEqual(b.type.kind, "Model");
      strictEqual(b.type.name, "Dec");

      // Assert that the members are added (decorators executed) in _declaration_ order
      // rather than in the order they appear in the template instantiation.
      strictEqual(members.length, 2);
      strictEqual(members[0][0], a.type);
      strictEqual(members[0][1].kind, "Scalar");
      strictEqual(members[0][1].name, "int32");
      strictEqual(members[1][0], b.type);
      strictEqual(members[1][1].kind, "Scalar");
      strictEqual(members[1][1].name, "string");
    });
  });
});
