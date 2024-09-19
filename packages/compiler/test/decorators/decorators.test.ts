import { deepStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import {
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Scalar,
  getVisibility,
  isSecret,
} from "../../src/index.js";
import {
  getDoc,
  getEncode,
  getErrorsDoc,
  getFriendlyName,
  getKeyName,
  getKnownValues,
  getOverloadedOperation,
  getOverloads,
  getPattern,
  getPatternData,
  getReturnsDoc,
  isErrorModel,
  resolveEncodedName,
} from "../../src/lib/decorators.js";
import {
  BasicTestRunner,
  createTestRunner,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "../../src/testing/index.js";

describe("compiler: built-in decorators", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  describe("dev comment /** */", () => {
    it("applies /** */ on blockless namespace", async () => {
      const { Foo } = await runner.compile(
        `
        @test
        /** doc for namespace Foo */
        namespace TestDoc.Foo;

        model A {}
        `,
      );

      strictEqual(getDoc(runner.program, Foo), "doc for namespace Foo");
    });

    it("applies /** */ on enclosed namespace", async () => {
      const { Foo } = await runner.compile(
        `
        @test
        /** doc for namespace Foo */
        namespace TestDoc.Foo {
           model A {}
        }
        `,
      );

      strictEqual(getDoc(runner.program, Foo), "doc for namespace Foo");
    });

    it("applies /** */ on nested enclosed namespace", async () => {
      const { Foo } = await runner.compile(
        // const { Foo, Foo_Bar } = await runner.compile(
        `
        @test
        /** doc for namespace Foo */
        namespace TestDoc.Foo {
          /** doc for namespace Bar */       
          namespace Bar {
            model A {};
          }
        }
        `,
      );

      const Bar = (Foo as Namespace).namespaces.get("Bar")!;
      strictEqual(getDoc(runner.program, Foo), "doc for namespace Foo");
      strictEqual(getDoc(runner.program, Bar), "doc for namespace Bar");
    });

    it("applies /** */ on nested blockless + enclosed namespace", async () => {
      const { Foo } = await runner.compile(
        `
        @test
        /** doc for namespace Foo */
        namespace TestDoc.Foo;

        /** doc for namespace Bar */       
        namespace Bar {
          model A {}
        }
        `,
      );

      const Bar = (Foo as Namespace).namespaces.get("Bar")!;
      strictEqual(getDoc(runner.program, Foo), "doc for namespace Foo");
      strictEqual(getDoc(runner.program, Bar), "doc for namespace Bar");
    });
  });

  describe("@doc", () => {
    it("applies @doc on model", async () => {
      const { A } = await runner.compile(
        `
        @test
        @doc("My Doc")
        model A { }
        `,
      );

      strictEqual(getDoc(runner.program, A), "My Doc");
    });

    it("formats @doc string using source object", async () => {
      const { A, B } = await runner.compile(
        `
        @doc("Templated {name}", T)
        model Template<T extends {}>  {
        }

        @test
        @doc("Model {name}", A)
        model A { }

        @test
        model B is Template<B> {
        }
        `,
      );
      strictEqual(getDoc(runner.program, A), "Model A");
      strictEqual(getDoc(runner.program, B), "Templated B");
    });

    it("applies @doc on namespace", async () => {
      const { TestDoc } = await runner.compile(
        `
        @test
        @doc("doc for namespace")
        namespace Foo.TestDoc {
        }
        `,
      );

      strictEqual(getDoc(runner.program, TestDoc), "doc for namespace");
    });

    it("applies @doc on enum", async () => {
      const { Color, Red } = await runner.compile(
        `
        @test
        @doc("doc for enum")
        enum Color {
          @test
          @doc("doc for enum element")
          Red: "red",
        }
        `,
      );

      strictEqual(getDoc(runner.program, Color), "doc for enum");
      strictEqual(getDoc(runner.program, Red), "doc for enum element");
    });

    it("applies @doc on union", async () => {
      const { AB } = await runner.compile(
        `
        model A { }
        model B { }

        @test
        @doc("doc for union")
        union AB { a: A, b: B }
        `,
      );

      strictEqual(getDoc(runner.program, AB), "doc for union");
    });

    it("applies @doc on interfaces", async () => {
      const { TestDoc, a } = await runner.compile(
        `
        @test
        @doc("doc for interface")
        interface TestDoc {
          @test
          @doc("doc for interface operation")
          a(): string;
        }
        `,
      );

      strictEqual(getDoc(runner.program, TestDoc), "doc for interface");
      strictEqual(getDoc(runner.program, a), "doc for interface operation");
    });

    it("applies @doc on operations", async () => {
      const { b } = await runner.compile(
        `
        @test
        @doc("doc for an operation")
        op b(): string;
        `,
      );

      strictEqual(getDoc(runner.program, b), "doc for an operation");
    });

    it("emit diagnostic if doc is not a string", async () => {
      const diagnostics = await runner.diagnose(`
        @doc(123)
        model A { }
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
      });
    });
  });

  describe("@pattern", () => {
    it("applies @pattern to scalar", async () => {
      const { A } = (await runner.compile(
        `
        @test
        @pattern("^[a-z]+$")
        scalar A extends string;
        `,
      )) as { A: Scalar };

      strictEqual(getPattern(runner.program, A), "^[a-z]+$");
    });

    it("applies @pattern to model property", async () => {
      const { A } = (await runner.compile(
        `
        @test
        model A {
          @test
          @pattern("^[a-z]+$")
          prop: string;
        }
        `,
      )) as { A: Model };

      const prop = A.properties.get("prop") as ModelProperty;
      strictEqual(prop.kind, "ModelProperty");
      strictEqual(getPattern(runner.program, prop), "^[a-z]+$");
    });

    it("emit diagnostic if pattern is not a string", async () => {
      const diagnostics = await runner.diagnose(`
        model A {
          @pattern(123)
          prop: string;
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
      });
    });

    it("optionally allows specifying a pattern validation message", async () => {
      const { A, B } = (await runner.compile(
        `
        @test
        @pattern("^[a-z]+$", "Must be all lowercase.")
        scalar A extends string;

        @test
        @pattern("^[a-z]+$")
        scalar B extends string;
        `,
      )) as { A: Scalar; B: Scalar };

      const pattern = getPattern(runner.program, A);
      strictEqual(pattern, "^[a-z]+$");
      const data = getPatternData(runner.program, A);
      strictEqual(data?.pattern, pattern);
      strictEqual(data?.validationMessage, "Must be all lowercase.");

      const pattern2 = getPattern(runner.program, B);
      strictEqual(pattern2, "^[a-z]+$");
      const data2 = getPatternData(runner.program, B);
      strictEqual(data2?.pattern, pattern2);
      strictEqual(data2?.validationMessage, undefined);
    });
  });

  describe("@returnsDoc", () => {
    it("applies @returnsDoc on operation", async () => {
      const { test } = (await runner.compile(
        `
        @test
        @returnsDoc("A string")
        op test(): string;
        `,
      )) as { test: Operation };

      strictEqual(getReturnsDoc(runner.program, test), "A string");
    });

    it("emit diagnostic if doc is not a string", async () => {
      const diagnostics = await runner.diagnose(`
        @test
        @returnsDoc(123)
        op test(): string;
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
      });
    });
  });

  describe("@errorsDoc", () => {
    it("applies @errorsDoc on operation", async () => {
      const { test } = (await runner.compile(
        `
        @test
        @errorsDoc("An error")
        op test(): string;
        `,
      )) as { test: Operation };

      strictEqual(getErrorsDoc(runner.program, test), "An error");
    });

    it("emit diagnostic if doc is not a string", async () => {
      const diagnostics = await runner.diagnose(`
        @test
        @errorsDoc(123)
        op test(): string;
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
      });
    });
  });

  describe("@friendlyName", () => {
    it("applies @friendlyName on model", async () => {
      const { A, B } = await runner.compile(`
        @test
        @friendlyName("MyNameIsA")
        model A { }

        @test
        @friendlyName("{name}Model", B)
        model B { }

        @friendlyName("Templated{name}", T)
        model Templated<T> {
          prop: T;
        }
        `);
      strictEqual(getFriendlyName(runner.program, A), "MyNameIsA");
      strictEqual(getFriendlyName(runner.program, B), "BModel");
    });

    it(" @friendlyName doesn't carry over to derived models", async () => {
      const { A, B } = await runner.compile(`
        @test
        @friendlyName("MyNameIsA")
        model A<T> { t: T; }

        @test
        model B is A<string> { }
        `);
      strictEqual(getFriendlyName(runner.program, A), "MyNameIsA");
      strictEqual(getFriendlyName(runner.program, B), undefined);
    });
  });

  describe("@error", () => {
    it("applies @error on model", async () => {
      const { A } = await runner.compile(`
        @test
        @error
        model A { }
      `);
      ok(isErrorModel(runner.program, A), "isError should be true");
    });

    it("applies @error on derived models", async () => {
      const { B, C } = await runner.compile(`
        @error model A { }
        @test model B extends A { }
        @test model C extends B { }
      `);
      ok(isErrorModel(runner.program, B), "isError should be true");
      ok(isErrorModel(runner.program, C), "isError should be true");
    });

    it("emit diagnostic if error is not applied to a model", async () => {
      const diagnostics = await runner.diagnose(`
        @error
        enum A { B, C }
        `);

      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].code, "decorator-wrong-target");
      strictEqual(
        diagnostics[0].message,
        `Cannot apply @error decorator to A since it is not assignable to Model`,
      );
    });
  });

  describe("@knownValues", () => {
    it("assign the known values to string scalar", async () => {
      const { Bar } = (await runner.compile(`
        enum Foo {one: "one", two: "two"}
        #suppress "deprecated" "For testing"
        @test
        @knownValues(Foo)
        scalar Bar extends string;
      `)) as { Bar: Scalar };

      ok(Bar.kind);
      const knownValues = getKnownValues(runner.program, Bar);
      ok(knownValues);
      strictEqual(knownValues.kind, "Enum");
    });

    it("assign the known values to number scalar", async () => {
      const { Bar } = (await runner.compile(`
        enum Foo {
          one: 1; 
          two: 2;
        }
        #suppress "deprecated" "For testing"
        @test
        @knownValues(Foo)
        scalar Bar extends int32;
      `)) as { Bar: Scalar };

      ok(Bar.kind);
      const knownValues = getKnownValues(runner.program, Bar);
      ok(knownValues);
      strictEqual(knownValues.kind, "Enum");
    });

    it("emit diagnostics when used on non model", async () => {
      const diagnostics = await runner.diagnose(`
        enum Foo {one, two}
        #suppress "deprecated" "For testing"
        @knownValues(Foo)
        enum Bar {}
      `);

      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message:
          "Cannot apply @knownValues decorator to Bar since it is not assignable to string | numeric | ModelProperty",
      });
    });

    it("emit diagnostics when enum has invalid members", async () => {
      const diagnostics = await runner.diagnose(`
         enum Foo {
          one: 1; 
          two: 2;
        }
        #suppress "deprecated" "For testing"
        @knownValues(Foo)
        scalar Bar extends string;
      `);

      expectDiagnostics(diagnostics, {
        code: "known-values-invalid-enum",
        message: "Enum cannot be used on this type. Member one is not assignable to type Bar.",
      });
    });

    it("emit diagnostics when used on non string model", async () => {
      const diagnostics = await runner.diagnose(`
        #suppress "deprecated" "For testing"
        enum Foo {one, two}
        @knownValues(Foo)
        model Bar {}
      `);

      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message:
          "Cannot apply @knownValues decorator to Bar since it is not assignable to string | numeric | ModelProperty",
      });
    });

    it("emit diagnostics when known values is not an enum", async () => {
      const diagnostics = await runner.diagnose(`
        model Foo {}
        #suppress "deprecated" "For testing"
        @knownValues(Foo)
        scalar Bar extends string;
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument of type 'Foo' is not assignable to parameter of type 'Enum'",
      });
    });
  });

  describe("@key", () => {
    it("emits diagnostic when argument is not a string", async () => {
      const diagnostics = await runner.diagnose(
        `model M {
          @key(4)
          prop: string;
        }`,
      );

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-argument",
        },
      ]);
    });

    it("emits diagnostic when not applied to model property", async () => {
      const diagnostics = await runner.diagnose(
        `@key
        model M {}`,
      );

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @key decorator to M since it is not assignable to ModelProperty",
        },
      ]);
    });

    it("sets key to property name by default", async () => {
      const { prop } = await runner.compile(
        `model M {
          @test
          @key
          prop: string;
        }`,
      );

      strictEqual(prop.kind, "ModelProperty" as const);
      strictEqual(getKeyName(runner.program, prop), "prop");
    });

    it("sets key to alternate name when provided", async () => {
      const { prop } = await runner.compile(
        `model M {
          @test
          @key("alternateName")
          prop: string;
        }`,
      );

      strictEqual(prop.kind, "ModelProperty" as const);
      strictEqual(getKeyName(runner.program, prop), "alternateName");
    });

    it("getKeyName returns undefined if used on property not annotated with @key", async () => {
      const { prop } = await runner.compile(
        `model M {
          @test prop: string;
        }`,
      );

      strictEqual(prop.kind, "ModelProperty" as const);
      strictEqual(getKeyName(runner.program, prop), undefined);
    });

    it("emits diagnostic when key property is marked as optional", async () => {
      const diagnostics = await runner.diagnose(
        `model M {
          @key
          prop?: string;
        }`,
      );

      expectDiagnostics(diagnostics, [
        {
          code: "no-optional-key",
          message: "Property 'prop' marked as key cannot be optional.",
        },
      ]);
    });
  });

  describe("@encode", () => {
    it(`set encoding on scalar`, async () => {
      const { s } = (await runner.compile(`
        @encode("rfc3339")
        @test
        scalar s extends utcDateTime;
      `)) as { s: Scalar };

      strictEqual(getEncode(runner.program, s)?.encoding, "rfc3339");
    });

    it(`set encoding on model property`, async () => {
      const { prop } = (await runner.compile(`
        model Foo {
          @encode("rfc3339")
          @test
          prop: utcDateTime;
        }
      `)) as { prop: ModelProperty };

      strictEqual(getEncode(runner.program, prop)?.encoding, "rfc3339");
    });

    it(`set encoding on model property of union type`, async () => {
      const { prop } = (await runner.compile(`
        model Foo {
          @encode("rfc3339")
          @test
          prop: utcDateTime | null; 
        }
      `)) as { prop: ModelProperty };

      strictEqual(getEncode(runner.program, prop)?.encoding, "rfc3339");
    });

    it(`encode type default to string`, async () => {
      const { s } = (await runner.compile(`
        @encode("rfc3339")
        @test
        scalar s extends utcDateTime;
      `)) as { s: Scalar };

      strictEqual(getEncode(runner.program, s)?.type.name, "string");
    });

    it(`change encode type`, async () => {
      const { s } = (await runner.compile(`
        @encode("unixTimestamp", int32)
        @test
        scalar s extends utcDateTime;
      `)) as { s: Scalar };

      strictEqual(getEncode(runner.program, s)?.type.name, "int32");
    });

    describe("known encoding validation", () => {
      const validCases = [
        ["utcDateTime", "rfc3339", undefined],
        ["utcDateTime", "rfc7231", undefined],
        ["offsetDateTime", "rfc3339", undefined],
        ["offsetDateTime", "rfc7231", undefined],
        ["utcDateTime", "unixTimestamp", "int32"],
        ["duration", "ISO8601", undefined],
        ["duration", "seconds", "int32"],
        ["bytes", "base64", undefined],
        ["bytes", "base64url", undefined],
        // Do not block unknown encoding
        ["utcDateTime", "custom-encoding", undefined],
        ["duration", "custom-encoding", "int32"],
      ];
      const invalidCases = [
        [
          "utcDateTime",
          "rfc3339",
          "int32",
          "invalid-encode",
          `Encoding 'rfc3339' on type 's' is expected to be serialized as 'string' but got 'int32'.`,
        ],
        [
          "offsetDateTime",
          "rfc7231",
          "int64",
          "invalid-encode",
          `Encoding 'rfc7231' on type 's' is expected to be serialized as 'string' but got 'int64'.`,
        ],
        [
          "offsetDateTime",
          "unixTimestamp",
          "int32",
          "invalid-encode",
          `Encoding 'unixTimestamp' cannot be used on type 's'. Expected: utcDateTime.`,
        ],
        [
          "utcDateTime",
          "unixTimestamp",
          "string",
          "invalid-encode",
          `Encoding 'unixTimestamp' on type 's' is expected to be serialized as 'integer' but got 'string'. Set '@encode' 2nd parameter to be of type integer. e.g. '@encode("unixTimestamp", int32)'`,
        ],
        [
          "duration",
          "seconds",
          undefined,
          "invalid-encode",
          `Encoding 'seconds' on type 's' is expected to be serialized as 'numeric' but got 'string'. Set '@encode' 2nd parameter to be of type numeric. e.g. '@encode("seconds", int32)'`,
        ],
        [
          "duration",
          "rfc3339",
          undefined,
          "invalid-encode",
          `Encoding 'rfc3339' cannot be used on type 's'. Expected: utcDateTime, offsetDateTime.`,
        ],
        [
          "bytes",
          "rfc3339",
          undefined,
          "invalid-encode",
          `Encoding 'rfc3339' cannot be used on type 's'. Expected: utcDateTime, offsetDateTime.`,
        ],
        [
          "duration",
          "seconds",
          '"int32"',
          // TODO: Arguably this should be improved.
          "invalid-argument",
          `Argument of type '"int32"' is not assignable to parameter of type 'Scalar'`,
        ],
      ];
      describe("valid", () => {
        validCases.forEach(([target, encoding, encodeAs]) => {
          it(`encoding '${encoding}' on ${target} encoded as ${encodeAs ?? "string"}`, async () => {
            const encodeAsParam = encodeAs ? `, ${encodeAs}` : "";
            const { s } = (await runner.compile(`
          @encode("${encoding}"${encodeAsParam})
          @test
          scalar s extends ${target};
        `)) as { s: Scalar };

            const encodeData = getEncode(runner.program, s);
            ok(encodeData);
            strictEqual(encodeData.encoding, encoding);
            strictEqual(encodeData.type.name, encodeAs ?? "string");
          });
        });

        it(`@encode(string) on numeric scalar`, async () => {
          const { s } = (await runner.compile(`
            @encode(string)
            @test
            scalar s extends int64;
          `)) as { s: Scalar };

          const encodeData = getEncode(runner.program, s);
          ok(encodeData);
          strictEqual(encodeData.encoding, undefined);
          strictEqual(encodeData.type.name, "string");
        });
      });
      describe("invalid", () => {
        invalidCases.forEach(([target, encoding, encodeAs, expectedCode, expectedMessage]) => {
          it(`encoding '${encoding}' on ${target}  encoded as ${
            encodeAs ?? "string"
          }`, async () => {
            const encodeAsParam = encodeAs ? `, ${encodeAs}` : "";
            const diagnostics = await runner.diagnose(`
          @encode("${encoding}"${encodeAsParam})
          @test
          scalar s extends ${target};
        `);
            expectDiagnostics(diagnostics, {
              code: expectedCode,
              severity: "error",
              message: expectedMessage,
            });
          });
        });

        it(`@encode(string) on non-numeric scalar`, async () => {
          const diagnostics = await runner.diagnose(`
            @encode(string)
            @test
            scalar s extends utcDateTime;
          `);

          expectDiagnostics(diagnostics, {
            code: "invalid-encode",
            severity: "error",
            message: "Encoding 'string' cannot be used on type 's'. Expected: numeric.",
          });
        });
      });
    });
  });

  describe("@withoutOmittedProperties", () => {
    it("removes a model property when given a string literal", async () => {
      const { TestModel } = await runner.compile(
        `
        model OriginalModel {
          removeMe: string;
          notMe: string;
        }

        @test
        model TestModel is OmitProperties<OriginalModel, "removeMe"> {
        }`,
      );

      const properties = TestModel.kind === "Model" ? Array.from(TestModel.properties.keys()) : [];
      deepStrictEqual(properties, ["notMe"]);
    });

    it("removes model properties when given a union containing strings", async () => {
      const { TestModel } = await runner.compile(
        `
        model OriginalModel {
          removeMe: string;
          removeMeToo: string;
          notMe: string;
        }

        @test
        model TestModel is OmitProperties<OriginalModel, "removeMe" | "removeMeToo"> {
        }`,
      );

      const properties = TestModel.kind === "Model" ? Array.from(TestModel.properties.keys()) : [];
      deepStrictEqual(properties, ["notMe"]);
    });
  });

  describe("@withPickedProperties", () => {
    it("picks a model property when given a string literal", async () => {
      const { TestModel } = await runner.compile(
        `
        model OriginalModel {
          pickMe: string;
          notMe: string;
        }

        @test
        model TestModel is PickProperties<OriginalModel, "pickMe"> {
        }`,
      );

      const properties = TestModel.kind === "Model" ? Array.from(TestModel.properties.keys()) : [];
      deepStrictEqual(properties, ["pickMe"]);
    });

    it("picks model properties when given a union containing strings", async () => {
      const { TestModel } = await runner.compile(
        `
        model OriginalModel {
          pickMe: string;
          pickMeToo: string;
          notMe: string;
        }

        @test
        model TestModel is PickProperties<OriginalModel, "pickMe" | "pickMeToo"> {
        }`,
      );

      const properties = TestModel.kind === "Model" ? Array.from(TestModel.properties.keys()) : [];
      deepStrictEqual(properties, ["pickMe", "pickMeToo"]);
    });
  });

  describe("@withDefaultKeyVisibility", () => {
    it("sets the default visibility on a key property when not already present", async () => {
      const { TestModel } = (await runner.compile(
        `
        model OriginalModel {
          @key
          name: string;
        }

        @test
        model TestModel is DefaultKeyVisibility<OriginalModel, "read"> {
        } `,
      )) as { TestModel: Model };

      deepStrictEqual(getVisibility(runner.program, TestModel.properties.get("name")!), ["read"]);
    });

    it("allows visibility applied to a key property to override the default", async () => {
      const { TestModel } = (await runner.compile(
        `
        model OriginalModel {
          @key
          @visibility("read", "update")
          name: string;
        }

        @test
        model TestModel is DefaultKeyVisibility<OriginalModel, "create"> {
        } `,
      )) as { TestModel: Model };

      deepStrictEqual(getVisibility(runner.program, TestModel.properties.get("name")!), [
        "read",
        "update",
      ]);
    });
  });

  describe("@overload", () => {
    it("emits an error when @overload is given something other than an operation", async () => {
      const diagnostics = await runner.diagnose(`
        @overload("foo")
        op someStringThing(param: string): string;
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: `Argument of type '"foo"' is not assignable to parameter of type 'Operation'`,
        severity: "error",
      });
    });

    it("emits an error when the overload's parameters are unrelated to the overloaded operation", async () => {
      const diagnostics = await runner.diagnose(`
        op someThing(param: string | int32): string | int32;

        @overload(someThing)
        op someUnrelatedThing(foo: boolean): string;

        @overload(someThing)
        op anotherUnrelatedThing(param: boolean): string;

        @overload(someThing)
        op thisOneWorks(param: string, foo: int32): string;
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "missing-property",
          message:
            "Property 'param' is missing on type '{ foo: boolean }' but required in '{ param: string | int32 }'",
          severity: "error",
        },
        {
          code: "unassignable",
          message: "Type 'boolean' is not assignable to type 'string | int32'",
          severity: "error",
        },
      ]);
    });

    it("can define operation overloads outside of a namespace or interface", async () => {
      const compiled = (await runner.compile(`
        @test
        op someThing(param: string | int32): string | int32;

        @test
        @overload(someThing)
        op someStringThing(param: string): string;

        @test
        @overload(someThing)
        op someNumberThing(param: int32): int32;

        @test
        op someUnrelatedThing(): void;

      `)) as {
        someThing: Operation;
        someStringThing: Operation;
        someNumberThing: Operation;
        someUnrelatedThing: Operation;
      };

      strictEqual(compiled.someThing.kind, "Operation");
      ok(getOverloadedOperation(runner.program, compiled.someStringThing));
      ok(getOverloadedOperation(runner.program, compiled.someNumberThing));
      ok(!getOverloadedOperation(runner.program, compiled.someThing));
      ok(!getOverloadedOperation(runner.program, compiled.someUnrelatedThing));
      const overloadedBy = getOverloads(runner.program, compiled.someThing)?.map((op) => op.name);
      ok(overloadedBy?.length === 2);
      ok(overloadedBy?.includes("someStringThing"));
      ok(overloadedBy?.includes("someNumberThing"));
      ok(getOverloads(runner.program, compiled.someUnrelatedThing) === undefined);
    });

    it("can overload operations defined in a namespace", async () => {
      const compiled = (await runner.compile(`
        namespace MyArea {
          @test
          op someThing(param: string | int32): string | int32;

          @test
          @overload(someThing)
          op someStringThing(param: string): string;

          @test
          @overload(MyArea.someThing)
          op someNumberThing(param: int32): int32;
        }

      `)) as {
        someThing: Operation;
        someStringThing: Operation;
        someNumberThing: Operation;
      };

      strictEqual(compiled.someThing.kind, "Operation");
      ok(getOverloadedOperation(runner.program, compiled.someStringThing));
      ok(getOverloadedOperation(runner.program, compiled.someNumberThing));
      ok(!getOverloadedOperation(runner.program, compiled.someThing));
      const overloadedBy = getOverloads(runner.program, compiled.someThing)?.map((op) => op.name);
      ok(overloadedBy?.length === 2);
      ok(overloadedBy?.includes("someStringThing"));
      ok(overloadedBy?.includes("someNumberThing"));
    });

    it("can overload operations defined in an interface", async () => {
      const compiled = (await runner.compile(`
        interface SomeInterface {
          @test
          op someThing(param: string | int32): string | int32;

          @test
          @overload(SomeInterface.someThing)
          op someStringThing(param: string): string;

          @test
          @overload(SomeInterface.someThing)
          op someNumberThing(param: int32): int32;
        }
      `)) as {
        someThing: Operation;
        someStringThing: Operation;
        someNumberThing: Operation;
      };

      strictEqual(compiled.someThing.kind, "Operation");
      ok(getOverloadedOperation(runner.program, compiled.someStringThing));
      ok(getOverloadedOperation(runner.program, compiled.someNumberThing));
      ok(!getOverloadedOperation(runner.program, compiled.someThing));
      const overloadedBy = getOverloads(runner.program, compiled.someThing)?.map((op) => op.name);
      ok(overloadedBy?.length === 2);
      ok(overloadedBy?.includes("someStringThing"));
      ok(overloadedBy?.includes("someNumberThing"));
    });

    describe("overloads must have the same parent as the overload base", () => {
      it("emit diagnostic if outside of interface", async () => {
        const diagnostics = await runner.diagnose(`
          interface SomeInterface {
            someThing(param: string | int32): string | int32;
          }
  
          @overload(SomeInterface.someThing)
          op someStringThing(param: string): string;
        `);
        expectDiagnostics(diagnostics, {
          code: "overload-same-parent",
          message: "Overload must be in the same interface or namespace.",
        });
      });

      it("emit diagnostic if outside of namespace", async () => {
        const diagnostics = await runner.diagnose(`
          namespace SomeNamespace {
            op someThing(param: string | int32): string | int32;
          }
  
          @overload(SomeNamespace.someThing)
          op someStringThing(param: string): string;
        `);
        expectDiagnostics(diagnostics, {
          code: "overload-same-parent",
          message: "Overload must be in the same interface or namespace.",
        });
      });

      it("emit diagnostic if different interface", async () => {
        const diagnostics = await runner.diagnose(`
          interface SomeInterface {
            someThing(param: string | int32): string | int32;
          }
  
          interface OtherInterface {
            @overload(SomeInterface.someThing)
            someStringThing(param: string): string;
          }
        `);
        expectDiagnostics(diagnostics, {
          code: "overload-same-parent",
          message: "Overload must be in the same interface or namespace.",
        });
      });

      it("emit diagnostic if different namespace", async () => {
        const diagnostics = await runner.diagnose(`
          namespace SomeNamespace {
            op someThing(param: string | int32): string | int32;
          }
  
          namespace OtherNamespace {
            @overload(SomeNamespace.someThing)
            op someStringThing(param: string): string;
          }
        `);
        expectDiagnostics(diagnostics, {
          code: "overload-same-parent",
          message: "Overload must be in the same interface or namespace.",
        });
      });

      it("emit diagnostic if in an interface but base isn't", async () => {
        const diagnostics = await runner.diagnose(`
          op someThing(param: string | int32): string | int32;
  
          interface OtherInterface {
            @overload(someThing)
            someStringThing(param: string): string;
          }
        `);
        expectDiagnostics(diagnostics, {
          code: "overload-same-parent",
          message: "Overload must be in the same interface or namespace.",
        });
      });
    });
  });

  describe("@secret", () => {
    it("can be applied on a string model", async () => {
      const { A } = await runner.compile(
        `
        @test
        @secret
        scalar A extends string;
        `,
      );

      ok(isSecret(runner.program, A));
    });

    it("can be applied on a model property with string type", async () => {
      const { A } = (await runner.compile(
        `
        @test
        model A {
          @secret
          a: string;
        }
        `,
      )) as { A: Model };

      ok(isSecret(runner.program, A.properties.get("a")!));
    });

    it("can be applied on a model property with stringlike model as type", async () => {
      const { A } = (await runner.compile(
        `
        scalar CustomStr extends string;

        @test
        model A {
          @secret
          a: CustomStr;
        }
        `,
      )) as { A: Model };

      ok(isSecret(runner.program, A.properties.get("a")!));
    });

    it("emit diagnostic if model is not a string", async () => {
      const diagnostics = await runner.diagnose(
        `
        @test
        @secret
        model A {}
        `,
      );

      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message:
          "Cannot apply @secret decorator to A since it is not assignable to string | ModelProperty",
      });
    });

    it("emit diagnostic if model is a different intrinsic type(not a string)", async () => {
      const diagnostics = await runner.diagnose(
        `
        @test
        @secret
        scalar A extends int32;
        `,
      );

      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message:
          "Cannot apply @secret decorator to A since it is not assignable to string | ModelProperty",
      });
    });

    it("emit diagnostic if model property is not a string type", async () => {
      const diagnostics = await runner.diagnose(
        `
        @test
        model A {
          @secret
          a: int32;
        }
        `,
      );

      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message: "Cannot apply @secret decorator to type it is not a string",
      });
    });
  });

  describe("@discriminator on unions", () => {
    it("requires variants to be models", async () => {
      const diagnostics = await runner.diagnose(`
        @discriminator("kind")
        union Foo {
          a: "hi"
        }
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-discriminated-union-variant",
          message: `Union variant "a" must be a model type.`,
        },
      ]);
    });
    it("requires variants to have the discriminator property", async () => {
      const diagnostics = await runner.diagnose(`
        model A {

        }
        @discriminator("kind")
        union Foo {
          a: A
        }
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-discriminated-union-variant",
          message: `Variant "a" type is missing the discriminant property "kind".`,
        },
      ]);
    });

    it("requires variant discriminator properties to be string literals or string enum values", async () => {
      const diagnostics = await runner.diagnose(`
        model A {
          kind: string,
        }

        @discriminator("kind")
        union Foo {
          a: A
        }
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-discriminated-union-variant",
          message: `Variant "a" type's discriminant property "kind" must be a string literal or string enum member.`,
        },
      ]);
    });
  });

  describe("@encodedName", () => {
    it("emit error if passing invalid mime type", async () => {
      const diagnostics = await runner.diagnose(`
        model Cert {
          @encodedName("foo/bar/baz", "exp")
          expireAt: utcDateTime;
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-mime-type",
        message: `Invalid mime type 'foo/bar/baz'`,
      });
    });

    it("emit error if passing mime type with suffix", async () => {
      const diagnostics = await runner.diagnose(`
        model Cert {
          @encodedName("application/merge-patch+json", "exp")
          expireAt: utcDateTime;
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "no-mime-type-suffix",
        message:
          "Cannot use mime type 'application/merge-patch+json' with suffix 'json'. Use a simple mime `type/subtype` instead.",
      });
    });

    describe("detect conflicts", () => {
      it("emit error if encoded name is same as existing property ", async () => {
        const diagnostics = await runner.diagnose(`
          model Cert {
            @encodedName("application/json", "exp")
            expireAt: utcDateTime;
            exp: string;
          }
        `);

        expectDiagnostics(diagnostics, {
          code: "encoded-name-conflict",
          message:
            "Encoded name 'exp' conflicts with existing member name for mime type 'application/json'",
        });
      });

      it("emit error if 2 properties use the same encoded name with the same mimeType ", async () => {
        const diagnostics = await runner.diagnose(`
          model Cert {
            @encodedName("application/json", "exp")
            expireAt: utcDateTime;
            @encodedName("application/json", "exp")
            expireIn: string;
          }
        `);

        expectDiagnostics(diagnostics, [
          {
            code: "encoded-name-conflict",
            message: "Same encoded name 'exp' is used for 2 members 'application/json'",
          },
          {
            code: "encoded-name-conflict",
            message: "Same encoded name 'exp' is used for 2 members 'application/json'",
          },
        ]);
      });

      it("is ok if 2 different mime type have the same encoded name", async () => {
        const diagnostics = await runner.diagnose(`
          model Cert {
            @encodedName("application/json", "exp")
            expireAt: utcDateTime;
            @encodedName("application/xml", "exp")
            expireIn: string;
          }
        `);

        expectDiagnosticEmpty(diagnostics);
      });
    });

    it("resolve explicit encoded name", async () => {
      const { expireAt } = (await runner.compile(`
        model Cert {
          @encodedName("application/json", "exp")
          @test expireAt: utcDateTime;
        }
      `)) as { expireAt: ModelProperty };
      strictEqual(resolveEncodedName(runner.program, expireAt, "application/json"), "exp");
      strictEqual(
        resolveEncodedName(runner.program, expireAt, "application/merge-patch+json"),
        "exp",
      );
    });

    it("resolve default name if no explicit encoded name", async () => {
      const { expireAt } = (await runner.compile(`
        model Cert {
          @encodedName("application/json", "exp")
          @test expireAt: utcDateTime;
        }
      `)) as { expireAt: ModelProperty };
      strictEqual(resolveEncodedName(runner.program, expireAt, "application/xml"), "expireAt");
    });
  });
});
