import { deepStrictEqual, fail, ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { getSourceLocation } from "../../src/core/diagnostics.js";
import { DecoratorContext, Diagnostic, Model, StringLiteral, Type } from "../../src/core/types.js";
import { isUnknownType } from "../../src/index.js";
import {
  expectDiagnosticEmpty,
  expectDiagnostics,
  expectTypeEquals,
  extractCursor,
  extractSquiggles,
  mockFile,
  t,
} from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: templates", () => {
  function getLineAndCharOfDiagnostic(diagnostic: Diagnostic) {
    const source = getSourceLocation(diagnostic.target);
    if (source === undefined) {
      fail(`Couldn't resolve the source of diagnostic ${diagnostic}`);
    }
    return source.file.getLineAndCharacterOfPosition(source.pos);
  }

  it("emit diagnostics when using template params on non templated model", async () => {
    const diagnostics = await Tester.diagnose(`
        model A {}
        model B { 
          foo: A<string>
        };
      `);
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
    const diagnostics = await Tester.diagnose(`
        model A<T> {}
        model B { 
          foo: A
        };
      `);
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
    const diagnostics = await Tester.diagnose(`
        model A<T> {}
        model B { 
          foo: A<string, string>
        };
      `);
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
    const { B } = await Tester.compile(t.code`
        model A<T, U = "hi"> { a: T, b: U }
        model ${t.model("B")} { 
          foo: A<"bye">
        };
      `);

    const A = B.properties.get("foo")!.type as Model;
    const a = A.properties.get("a")!;
    const b = A.properties.get("b")!;
    strictEqual(a.type.kind, "String");
    strictEqual((a.type as StringLiteral).value, "bye");
    strictEqual(b.type.kind, "String");
    strictEqual((b.type as StringLiteral).value, "hi");
  });

  it("indeterminate defaults", async () => {
    const diagnostics = await Tester.diagnose(`
        model B<T extends valueof string> {}
        model A<T extends valueof string = ""> {
          b: B<T>
        }
        alias Test = A;
      `);

    expectDiagnosticEmpty(diagnostics);
  });

  it("cache indeterminate types", async () => {
    const { Test } = await Tester.compile(t.code`
        model Template<T> {t: T}
        model ${t.model("Test")} {
          a: Template<"a">;
          b: Template<"a">;
        }
      `);

    expectTypeEquals(Test.properties.get("a")!.type, Test.properties.get("b")!.type);
  });

  it("allows default template parameters that are models", async () => {
    const { B } = await Tester.compile(t.code`
        model A<T = string> { a: T }
        model ${t.model("B")} { 
          foo: A
        };
      `);

    const A = B.properties.get("foo")!.type as Model;
    const a = A.properties.get("a")!;
    strictEqual(a.type.kind, "Scalar");
    strictEqual(a.type.name, "string");
  });

  it("template instance should be the exact same when passing value that is the same as the default", async () => {
    const { Test } = await Tester.compile(t.code`
        model Foo<A = string, B=string> { a: A, b: B }
        model ${t.model("Test")} { 
          a: Foo;
          b: Foo<string>;
          c: Foo<string, string>;
        };
      `);

    const a = Test.properties.get("a")!;
    const b = Test.properties.get("b")!;
    const c = Test.properties.get("c")!;
    strictEqual(a.type, b.type);
    strictEqual(a.type, c.type);
  });

  it("emits diagnostics when using too few template parameters", async () => {
    const diagnostics = await Tester.diagnose(`
        model A<T, U, V = "hi"> { a: T, b: U, c: V }
        model B { 
          foo: A<"bye">
        };
      `);

    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "invalid-template-args");
    strictEqual(diagnostics[0].message, "Template argument 'U' is required and not specified.");
  });

  it("emits diagnostics when non-defaulted template parameter comes after defaulted one", async () => {
    const diagnostics = await Tester.diagnose(`
        model A<T = "hi", U> { a: T, b: U }
      `);

    expectDiagnostics(diagnostics, { code: "default-required" });
  });

  it("emits diagnostics when defaulted template use later template parameter", async () => {
    const diagnostics = await Tester.diagnose(`
        model A<A = B, B = "hi"> { a: A, b: B }
      `);

    expectDiagnostics(diagnostics, {
      code: "invalid-template-default",
      message:
        "Template parameter defaults can only reference previously declared type parameters.",
    });
  });

  it("emits diagnostics when defaulted template use later template parameter in complex type", async () => {
    const diagnostics = await Tester.diagnose(`
        model A<A = "one" | B, B = "hi"> { a: A, b: B }
      `);

    expectDiagnostics(diagnostics, {
      code: "invalid-template-default",
      message:
        "Template parameter defaults can only reference previously declared type parameters.",
    });
  });

  it("emits diagnostics for template parameter defaults that are incorrect", async () => {
    const diagnostics = await Tester.diagnose(`
        model A<T = Record> { a: T }
      `);

    expectDiagnostics(diagnostics, {
      code: "invalid-template-args",
      message: "Template argument 'Element' is required and not specified.",
    });
  });

  it("emits diagnostics when passing value to template parameter without constraint", async () => {
    const diagnostics = await Tester.diagnose(`
        model A<T> { }
        const a = "abc";
        alias B = A<a>;
      `);

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
      const diagnostics = await Tester.diagnose(source);
      // Only one error, Bar<T> can't be created as T is not constraint to object
      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument of type 'T' is not assignable to parameter of type '{}'",
        pos,
      });
    });

    it("an error type should revert to unknown", async () => {
      const [{ Bar }, diagnostics] = await Tester.compileAndDiagnose(t.code`
          model Test<T> {
            prop: T;
          }
          
          model ${t.model("Bar")} {
            a: Test<notExists>;
          }
        `);
      // Only one error
      expectDiagnostics(diagnostics, {
        code: "invalid-ref",
        message: "Unknown identifier notExists",
      });

      const testInstance = Bar.properties.get("a")!.type as Model;
      const prop = testInstance.properties.get("prop")!;

      strictEqual(prop.kind, "ModelProperty");
      ok(isUnknownType(prop.type), "Prop type should be unknown");
    });

    it("operation should still be able to be used(no extra diagnostic)", async () => {
      const { pos, source } = extractCursor(`
    op Action<T extends {}>(): T;

    op foo is Action<┆"abc">;
  `);
      const diagnostics = await Tester.diagnose(source);
      // Only one error, Bar<T> can't be created as T is not constraint to object
      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: `Argument of type '"abc"' is not assignable to parameter of type '{}'`,
        pos,
      });
    });
  });

  it("can reference other parameters", async () => {
    const { B } = await Tester.compile(t.code`
        model A<T, X = T> { a: T, b: X }
        model ${t.model("B")} { 
          foo: A<"bye">
        };
      `);

    const A = B.properties.get("foo")!.type as Model;
    const a = A.properties.get("a")!;
    const b = A.properties.get("b")!;
    strictEqual(a.type.kind, "String");
    strictEqual((a.type as StringLiteral).value, "bye");
    strictEqual(b.type.kind, "String");
    strictEqual((b.type as StringLiteral).value, "bye");
  });

  it("can reference other parameters in default in a model expression", async () => {
    const { B } = await Tester.compile(t.code`
        model A<T, X = {t: T}> { b: X }
        model ${t.model("B")} { 
          foo: A<"bye">
        };
      `);

    const A = B.properties.get("foo")!.type as Model;
    const b = A.properties.get("b")!;
    strictEqual(b.type.kind, "Model" as const);
    const tp = (b.type as Model).properties.get("t")!.type;
    strictEqual(tp.kind, "String" as const);
    strictEqual((tp as StringLiteral).value, "bye");
  });

  it("can reference other parameters in default via another template", async () => {
    const { B } = await Tester.compile(t.code`
        model A<T, X = Foo<T>> { b: X }
        model ${t.model("B")} {
          foo: A<"bye">
        };

        model Foo<T> {
          t: T;
        }
      `);

    const A = B.properties.get("foo")!.type as Model;
    const b = A.properties.get("b")!;
    strictEqual(b.type.kind, "Model" as const);
    const tp = (b.type as Model).properties.get("t")!.type;
    strictEqual(tp.kind, "String" as const);
    strictEqual((tp as StringLiteral).value, "bye");
  });

  it("can reference parent parameters in default", async () => {
    const { MyOp } = await Tester.compile(t.code`
        interface A<T> {
          op foo<R = T, P = R>(params: P): R;
        }
        alias B = A<string>;
        op ${t.op("MyOp")} is B.foo;
      `);
    const params = MyOp.parameters.properties.get("params");
    ok(params, "Expected params to be defined");
    strictEqual(params.type.kind, "Scalar");
    strictEqual(params.type.name, "string");
    strictEqual(MyOp.returnType.kind, "Scalar");
    strictEqual(MyOp.returnType.name, "string");
  });

  it("can use parent parameters default in default", async () => {
    const { MyOp } = await Tester.compile(t.code`
        interface MyInterface<A, B = string> {
          op foo<R = B, P = R>(params: P): R;
        }
        alias AliasedInterface = MyInterface<string>;
        op ${t.op("MyOp")} is AliasedInterface.foo;
      `);
    const params = MyOp.parameters.properties.get("params");
    ok(params, "Expected params to be defined");
    strictEqual(params.type.kind, "Scalar");
    strictEqual(params.type.name, "string");
    strictEqual(MyOp.returnType.kind, "Scalar");
    strictEqual(MyOp.returnType.name, "string");
  });

  it("can override default provided by parent parameters", async () => {
    const { MyOp } = await Tester.compile(t.code`
        interface A<T> {
          op foo<U = T>(): U;
        }
        alias B = A<string>;
        op ${t.op("MyOp")} is B.foo<bytes>;
      `);
    strictEqual(MyOp.returnType.kind, "Scalar");
    strictEqual(MyOp.returnType.name, "bytes");
  });

  it("emit diagnostics if referencing itself", async () => {
    const diagnostics = await Tester.diagnose(`
        model A<T = T> { a: T }
        model B { 
          foo: A
        };
      `);

    expectDiagnostics(diagnostics, {
      code: "invalid-template-default",
      message:
        "Template parameter defaults can only reference previously declared type parameters.",
    });
  });

  it("emit diagnostics if args reference each other", async () => {
    const diagnostics = await Tester.diagnose(`
        model A<T = K, K = T> { a: T }
        model B { 
          foo: A
        };
      `);

    expectDiagnostics(diagnostics, {
      code: "invalid-template-default",
      message:
        "Template parameter defaults can only reference previously declared type parameters.",
    });
  });

  it("emit diagnostics if referencing itself nested", async () => {
    const diagnostics = await Tester.diagnose(`
        model A<T = {foo: T}> { a: T }
        model B { 
          foo: A
        };
      `);

    expectDiagnostics(diagnostics, {
      code: "invalid-template-default",
      message:
        "Template parameter defaults can only reference previously declared type parameters.",
    });
  });

  describe("constraints", () => {
    it("compile when the constrain is satisfied in the default value", async () => {
      await Tester.compile(`
        model A<T extends string = "abc"> { a: T }
      `);
    });

    it("compile when the constrain is satisfied in template arg", async () => {
      await Tester.compile(`
        model A<T extends string> { a: T }

        model B {
          a: A<"def">
        }
      `);
    });

    it("emits diagnostic when constraint reference itself", async () => {
      const diagnostics = await Tester.diagnose(`model Test<A extends A> {}`);
      expectDiagnostics(diagnostics, {
        code: "circular-constraint",
        message: "Type parameter 'A' has a circular constraint.",
      });
    });

    it("emits diagnostic when constraint reference other parameter in circular constraint", async () => {
      const diagnostics = await Tester.diagnose(`model Test<A extends B, B extends A> {}`);
      expectDiagnostics(diagnostics, {
        code: "circular-constraint",
        message: "Type parameter 'A' has a circular constraint.",
      });
    });

    it("emits diagnostic when constraint reference itself inside an expression", async () => {
      const diagnostics = await Tester.diagnose(`model Test<A extends {name: A}> {}`);
      expectDiagnostics(diagnostics, {
        code: "circular-constraint",
        message: "Type parameter 'A' has a circular constraint.",
      });
    });

    it("emit diagnostics if template default is not assignable to constraint", async () => {
      const { source, pos, end } = extractSquiggles(`
        model A<T extends string = ~~~123~~~> { a: T }
      `);
      const diagnostics = await Tester.diagnose(source);
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
      const diagnostics = await Tester.diagnose(source);
      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument of type '456' is not assignable to parameter of type 'string'",
        pos,
        end,
      });
    });

    it("use constrain as type when referencing another template", async () => {
      await Tester.compile(`
        model A<T extends string> { b: B<T> }
        model B<T extends string> {}
      `);
    });

    it("use constrain as type when referencing another template parameter", async () => {
      await Tester.compile(`
        model Foo<A extends string, B extends string = A> { b: B }
      `);
    });

    it("emit diagnostics if using another template with a constraint but template parameter constraint is not compatible", async () => {
      const { source, pos, end } = extractSquiggles(`
        model A<T> { b: B<~~~T~~~> }
        model B<T extends string> {}
      `);
      const diagnostics = await Tester.diagnose(source);
      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument of type 'T' is not assignable to parameter of type 'string'",
        pos,
        end,
      });
    });
  });

  describe("doesn't run decorators when checking template declarations", () => {
    async function expectMarkDecoratorNotCalled(code: string) {
      await Tester.files({
        "mark.js": mockFile.js({
          $mark: () => {
            fail("Should not have called decorator");
          },
        }),
      })
        .import("./mark.js")
        .compile(code);
    }

    it("on model", async () => {
      await expectMarkDecoratorNotCalled(`
        @mark(T)
        model Foo<T> {}
      `);
    });

    it("on interface", async () => {
      await expectMarkDecoratorNotCalled(`
        @mark(T)
        interface Foo<T> {}
      `);
    });

    it("on operation", async () => {
      await expectMarkDecoratorNotCalled(`
        @mark(T)
        op foo<T>(): void;
      `);
    });

    it("on union", async () => {
      await expectMarkDecoratorNotCalled(`
        @mark(T)
        union Foo<T> {}
      `);
    });

    describe("within aliases", () => {
      it("on model property", async () => {
        await expectMarkDecoratorNotCalled(`
          alias Foo<T> = {
            @mark(T) prop: string;
          };
        `);
      });

      it("on model property, when no argument is provided", async () => {
        await expectMarkDecoratorNotCalled(`
          alias Foo<T> = {
            @mark prop: string;
          };
        `);
      });

      it("when instantiation is indirect", async () => {
        await expectMarkDecoratorNotCalled(`
          alias Bar<T> = Foo<T>;

          alias Foo<T> = {
            @mark(T) prop: string;
          };
        `);
      });

      it("when instantiation is indirect and nested", async () => {
        await expectMarkDecoratorNotCalled(`
          alias Bar<T> = {
            nested: Foo<T>;
          };

          alias Foo<T> = {
            @mark(T) prop: string;
          };
        `);
      });
    });

    describe("on model properties", () => {
      it("under model", async () => {
        await expectMarkDecoratorNotCalled(`
          model Foo<T> {
            @mark(T)
            prop: string;
          }
        `);
      });

      it("under operation returnType", async () => {
        await expectMarkDecoratorNotCalled(`
          op foo<T>(): {
            @mark(T)
            prop: string;
          };
        `);
      });

      it("in operation in interface", async () => {
        await expectMarkDecoratorNotCalled(`
          interface Test<T> {
            foo(@mark(T) prop: string;): void;
          }
        `);
      });

      it("nested", async () => {
        await expectMarkDecoratorNotCalled(`
          model Foo<T> {
            nested: {
              @mark(T)
              prop: string;
            }
          }
        `);
      });

      it("nested in union", async () => {
        await expectMarkDecoratorNotCalled(`
          model Foo<T> {
            nested: string | {
              @mark(T)
              prop: string;
            }
          }
        `);
      });
    });
  });

  describe("named template argument instantiations", () => {
    it("with named arguments", async () => {
      const { B } = await Tester.compile(t.code`
          model A<T> { a: T }
          model ${t.model("B")} {
            foo: A<T = string>
          };
        `);

      const foo = B.properties.get("foo")!.type;
      strictEqual(foo.kind, "Model");
      const a = foo.properties.get("a")!;
      strictEqual(a.type.kind, "Scalar");
      strictEqual(a.type.name, "string");
    });

    it("with named arguments out of order", async () => {
      const { B } = await Tester.compile(t.code`
          model A<T, U> { a: T, b: U }
          model ${t.model("B")} {
            foo: A<U = int32, T = string>
          };
        `);

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
      const { B } = await Tester.compile(t.code`
          model A<T = int32, U = string> { a: T, b: U }
          model ${t.model("B")} {
            foo: A<U = "bar">
          };
        `);

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
      const { B } = await Tester.compile(t.code`
          model A<T, U = T> { a: T, b: U }
          model ${t.model("B")} {
            foo: A<T = string>
          };
        `);

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
      const { B, C } = await Tester.compile(t.code`
          model A<T, U = int32, V extends string = string> { a: T, b: U, c: V }

          model ${t.model("B")} {
            foo: A<boolean, V = "bar">
          }

          model ${t.model("C")} {
            foo: A<T = boolean, V = "bar">
          }
        `);

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

      model B {
        foo: A<string, ~~~U = "bar"~~~>
      }
    `);

      const [{ program }, diagnostics] = await Tester.compileAndDiagnose(source);
      const B = program.getGlobalNamespaceType().models.get("B")!;

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

      model B {
        foo: A<string, ~~~T = "bar"~~~>
      }
    `);

      const [{ program }, diagnostics] = await Tester.compileAndDiagnose(source);
      const B = program.getGlobalNamespaceType().models.get("B")!;

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

      model B {
        foo: A<T = string, ~~~T = "bar"~~~>
      }
    `);

      const [{ program }, diagnostics] = await Tester.compileAndDiagnose(source);
      const B = program.getGlobalNamespaceType().models.get("B")!;

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

      model B {
        foo: ~~~A<boolean, V = "bar", string>~~~
      }
    `);

      const [{ program }, diagnostics] = await Tester.compileAndDiagnose(source);
      const B = program.getGlobalNamespaceType().models.get("B")!;

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

      model B {
        foo: A<boolean, V = "bar", ~~~string~~~>
      }
    `);

      const [{ program }, diagnostics] = await Tester.compileAndDiagnose(source);
      const B = program.getGlobalNamespaceType().models.get("B")!;

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

      model B {
        foo: A<~~~T<string>~~~ = string>
      }
    `);

      const diagnostics = await Tester.diagnose(source);

      expectDiagnostics(diagnostics, {
        code: "invalid-template-argument-name",
        message: "Template parameter argument names must be valid, bare identifiers.",
        pos,
        end,
      });
    });

    it("template arguments are evaluated in the correct order", async () => {
      const members: [Type, Type][] = [];

      const { B } = await Tester.files({
        "effect.js": mockFile.js({
          $effect: (_: DecoratorContext, target: Type, value: Type) => {
            members.push([target, value]);
          },
        }),
      }).import("./effect.js").compile(t.code`
          @effect(T)
          model Dec<T> { t: T }

          model A<T, U> { a: T, b: U }

          model ${t.model("B")} {
            bar: A<U = Dec<string>, T = Dec<int32>>
          }
        `);

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

  describe("template declaration passing values", () => {
    it("allows passing to a decorator expecting that value", async () => {
      const diagnostics = await Tester.files({
        "effect.js": mockFile.js({
          $call: () => null,
        }),
      }).import("./effect.js").diagnose(`
        extern dec call(target, arg: valueof string);
        @call(T) model Dec<T extends valueof string> {}
        `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("allows passing to a decorator expecting a composed value", async () => {
      const diagnostics = await Tester.files({
        "effect.js": mockFile.js({
          $call: () => null,
        }),
      }).import("./effect.js").diagnose(`
        extern dec call(target, arg: valueof unknown);
        @call(#{foo: T}) model Dec<T extends valueof string> {}
        `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("validate incompatible composed values", async () => {
      const diagnostics = await Tester.files({
        "effect.js": mockFile.js({
          $call: () => null,
        }),
      }).import("./effect.js").diagnose(`
        extern dec call(target, arg: valueof {foo: int32});
        @call(#{foo: T}) model Dec<T extends valueof string> {}
        `);
      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message:
          "Argument of type '{ foo: string }' is not assignable to parameter of type '{ foo: int32 }'",
      });
    });
  });
});

describe("ensure default pointing back to template are resolved correctly", () => {
  it("declared before", async () => {
    const { B } = await Tester.compile(t.code`
      model A<T = B> {
        t: T;
      }

      model ${t.model("B")} {
        a: A;
      }
    `);
    const A = B.properties.get("a")?.type;
    strictEqual(A?.kind, "Model");
    expectTypeEquals(A.properties.get("t")?.type, B);
  });

  it("declared after", async () => {
    const { B } = await Tester.compile(t.code`
      model ${t.model("B")} {
        a: A;
      }

      model A<T = B> {
        t: T;
      }
    `);
    const A = B.properties.get("a")?.type;
    strictEqual(A?.kind, "Model");
    expectTypeEquals(A.properties.get("t")?.type, B);
  });
});
