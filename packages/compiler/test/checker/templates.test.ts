import { deepStrictEqual, fail, strictEqual } from "assert";
import { getSourceLocation } from "../../core/diagnostics.js";
import { Diagnostic, Model, StringLiteral } from "../../core/types.js";
import {
  BasicTestRunner,
  createTestHost,
  createTestRunner,
  expectDiagnostics,
  extractCursor,
  extractSquiggles,
  TestHost,
} from "../../testing/index.js";

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
      `
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
      `
    );
    const diagnostics = await testHost.diagnose("main.tsp");
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "invalid-template-args");
    strictEqual(diagnostics[0].message, "Too few template arguments provided.");
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
      `
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
      `
    );

    const { A } = (await testHost.compile("main.tsp")) as { A: Model };
    const a = A.properties.get("a")!;
    const b = A.properties.get("b")!;
    strictEqual(a.type.kind, "String");
    strictEqual((a.type as StringLiteral).value, "bye");
    strictEqual(b.type.kind, "String");
    strictEqual((b.type as StringLiteral).value, "hi");
  });

  it("allows default template parameters that are models", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        @test model A<T = string> { a: T }
        model B { 
          foo: A
        };
      `
    );

    const { A } = (await testHost.compile("main.tsp")) as { A: Model };
    const a = A.properties.get("a")!;
    strictEqual(a.type.kind, "Scalar");
    strictEqual((a.type as Model).name, "string");
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
      `
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
      `
    );

    const diagnostics = await testHost.diagnose("main.tsp");
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "invalid-template-args");
    strictEqual(diagnostics[0].message, "Too few template arguments provided.");
  });

  it("emits diagnostics when non-defaulted template parameter comes after defaulted one", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        @test model A<T = "hi", U> { a: T, b: U }
      `
    );

    const diagnostics = await testHost.diagnose("main.tsp");
    expectDiagnostics(diagnostics, { code: "default-required" });
  });

  it("emits diagnostics when defaulted template use later template parameter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        @test model A<A = B, B = "hi"> { a: A, b: B }
      `
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
      `
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
      `
    );

    const diagnostics = await testHost.diagnose("main.tsp");
    expectDiagnostics(diagnostics, {
      code: "invalid-template-args",
      message: "Too few template arguments provided.",
    });
  });

  describe("instantiating a template with invalid args", () => {
    it("shouldn't pass thru the invalid args", async () => {
      const { pos, source } = extractCursor(`
    model AnObject<T extends object> { t: T }
    
    alias Bar<T extends object>  = AnObject<T>;
    
    alias NoConstaint<T> = Bar<┆T>;
  `);
      testHost.addTypeSpecFile("main.tsp", source);
      const diagnostics = await testHost.diagnose("main.tsp");
      // Only one error, Bar<T> can't be created as T is not constraint to object
      expectDiagnostics(diagnostics, {
        code: "unassignable",
        message: "Type 'unknown' is not assignable to type 'object'",
        pos,
      });
    });

    it("operation should still be able to be used(no extra diagnostic)", async () => {
      const { pos, source } = extractCursor(`
    op Action<T extends object>(): T;

    op foo is Action<┆"abc">;
  `);
      testHost.addTypeSpecFile("main.tsp", source);
      const diagnostics = await testHost.diagnose("main.tsp");
      // Only one error, Bar<T> can't be created as T is not constraint to object
      expectDiagnostics(diagnostics, {
        code: "unassignable",
        message: "Type 'abc' is not assignable to type 'object'",
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
      `
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
      `
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
      `
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
      `
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
      `
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
      `
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
        code: "unassignable",
        message: "Type '456' is not assignable to type 'string'",
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
        code: "unassignable",
        message: "Type 'unknown' is not assignable to type 'string'",
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
     `
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
});
