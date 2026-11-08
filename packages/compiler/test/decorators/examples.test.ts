import { ok } from "assert";
import { describe, expect, it } from "vitest";
import type { Operation } from "../../src/index.js";
import { getExamples, getOpExamples, serializeValueAsJson } from "../../src/index.js";
import { expectDiagnostics } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

async function getExamplesFor(code: string) {
  const { test, program } = (await Tester.compile(code)) as any;

  ok(test, "Expect to have /*test*/ marker in code.");
  return {
    program,
    target: test,
    examples: getExamples(program, test as any),
  };
}

async function getOpExamplesFor(code: string) {
  const { test, program } = (await Tester.compile(code)) as any;

  ok(test, "Expect to have /*test*/ marker in code.");
  return {
    program,
    target: test as Operation,
    examples: getOpExamples(program, test as any),
  };
}

describe("@example", () => {
  describe("model", () => {
    it("valid", async () => {
      const { program, examples, target } = await getExamplesFor(`
      @example(#{ a: 1, b: 2 })
      model /*test*/test {
        a: int32;
        b: int32;
      }
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual({ a: 1, b: 2 });
    });

    it("use const with type of model", async () => {
      const { program, examples, target } = await getExamplesFor(`
      const example: test = #{ a: 1, b: 2 };
      @example(example)
      model /*test*/test {
        a: int32;
        b: int32;
      }
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual({ a: 1, b: 2 });
    });

    it("emit diagnostic for missing property", async () => {
      const diagnostics = await Tester.diagnose(`
        @example(#{ a: 1 })
        model test {
          a: int32;
          b: int32;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "missing-property",
      });
    });
  });

  describe("model property", () => {
    it("valid", async () => {
      const { program, examples, target } = await getExamplesFor(`
      model TestModel {
        @example(1)
        /*test*/test: int32;
        b: int32;
      }
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual(1);
    });

    it("emit diagnostic for unassignable value", async () => {
      const diagnostics = await Tester.diagnose(`
        model TestModel {
          @example("abc")
          test: int32;
          b: int32;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
      });
    });
  });

  describe("scalar", () => {
    it("valid", async () => {
      const { program, examples, target } = await getExamplesFor(`
      @example(test.fromISO("11:32"))
      scalar /*test*/test extends utcDateTime;
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual("11:32");
    });

    it("use const with type of scalar", async () => {
      const { program, examples, target } = await getExamplesFor(`
        const example: test = test.fromISO("11:32");
        @example(example)
        scalar /*test*/test extends utcDateTime;
      `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual("11:32");
    });

    it("emit diagnostic for unassignable value", async () => {
      const diagnostics = await Tester.diagnose(`
        @example("11:32")
        scalar test extends utcDateTime;
      `);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
      });
    });

    it("returns undefined for custom scalar with no-argument initializer", async () => {
      const { program, examples, target } = await getExamplesFor(`
        @example(test.i())
        scalar /*test*/test {
          init i();
        }
      `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toBeUndefined();
    });

    it("returns undefined for custom scalar with string-argument initializer", async () => {
      const { program, examples, target } = await getExamplesFor(`
        @example(test.name("Shorty"))
        scalar /*test*/test {
          init name(value: string);
        }
      `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toBeUndefined();
    });
  });

  describe("enum", () => {
    it("valid", async () => {
      const { program, examples, target } = await getExamplesFor(`
      @example(test.a)
      enum /*test*/test {
        a,
        b,
      }
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual("a");
    });

    it("use const with type of enum", async () => {
      const { program, examples, target } = await getExamplesFor(`
      const example: test = test.a;
      @example(example)
      enum /*test*/test {
        a,
        b,
      }
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual("a");
    });

    it("emit diagnostic for unassignable value", async () => {
      const diagnostics = await Tester.diagnose(`
        @example(1)
        enum test {
          a,
          b,
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
      });
    });
  });

  describe("union", () => {
    it("valid for union member reference", async () => {
      const { program, examples, target } = await getExamplesFor(`
      @example(test.a)
      union /*test*/test {a: "a", b: "b"}
    `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual("a");
    });

    it("valid for object value", async () => {
      const { program, examples, target } = await getExamplesFor(`
        model A {
          type: "a";
          a: string;
        }
        model B {
          type: "b";
          b: numeric;
        }

        @example(#{
          type: "a",
          a: "a string",
        })
        union /*test*/test {a: A, b: B}
      `);
      expect(examples).toHaveLength(1);
      expect(serializeValueAsJson(program, examples[0].value, target)).toEqual({
        type: "a",
        a: "a string",
      });
    });

    it("emit diagnostic for unassignable value", async () => {
      const diagnostics = await Tester.diagnose(`
        @example(1)
        union test {a: "a", b: "b"}
      `);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
      });
    });
  });

  it("emit diagnostic if used on Operation", async () => {
    const diagnostics = await Tester.diagnose(`
      @example(1)
      op test(): void;
    `);
    expectDiagnostics(diagnostics, {
      code: "decorator-wrong-target",
    });
  });
});

describe("@opExample", () => {
  it("provide parameters and return type", async () => {
    const { program, examples, target } = await getOpExamplesFor(`
      model Pet { id: string; name: string; }

      @opExample(
        #{
          parameters: #{ id: "some", name: "Fluffy" },
          returnType: #{ id: "some", name: "Fluffy" },
        }
      )
      op /*test*/test(...Pet): Pet;
    `);
    expect(examples).toHaveLength(1);
    ok(examples[0].parameters);
    ok(examples[0].returnType);
    expect(serializeValueAsJson(program, examples[0].parameters, target.parameters)).toEqual({
      id: "some",
      name: "Fluffy",
    });
    expect(serializeValueAsJson(program, examples[0].returnType, target.returnType)).toEqual({
      id: "some",
      name: "Fluffy",
    });
  });

  it("provide only parameters", async () => {
    const { program, examples, target } = await getOpExamplesFor(`
      model Pet { id: string; name: string; }

      @opExample(
        #{
          parameters: #{ id: "some", name: "Fluffy" },
        }
      )
      op /*test*/test(...Pet): void;
    `);
    expect(examples).toHaveLength(1);
    ok(examples[0].parameters);
    ok(examples[0].returnType === undefined);
    expect(serializeValueAsJson(program, examples[0].parameters, target.parameters)).toEqual({
      id: "some",
      name: "Fluffy",
    });
  });
  it("provide only return type", async () => {
    const { program, examples, target } = await getOpExamplesFor(`
      model Pet { id: string; name: string; }

      @opExample(
        #{
          returnType: #{ id: "some", name: "Fluffy" },
        }
      )
      op /*test*/test(): Pet;
    `);
    expect(examples).toHaveLength(1);
    ok(examples[0].parameters === undefined);
    ok(examples[0].returnType);
    expect(serializeValueAsJson(program, examples[0].returnType, target.returnType)).toEqual({
      id: "some",
      name: "Fluffy",
    });
  });
  it("provide return type for union of unions", async () => {
    const { program, examples, target } = await getOpExamplesFor(`
      model Foo {
        type: "FOO";
      }

      model Bar {
        type: "BAR";
      }

      model One {
        type: "ONE";
      }

      model Two {
        type: "TWO";
      }

      @discriminated(#{ discriminatorPropertyName: "type", envelope: "none" })
      union FooOrBar {
        FOO: Foo,
        BAR: Bar,
      }

      @discriminated(#{ discriminatorPropertyName: "type", envelope: "none" })
      union OneOrTwo {
        ONE: One,
        TWO: Two
      }

      @opExample(#{ returnType: #{ type: "FOO" } })
      @opExample(#{ returnType: #{ type: "BAR" } })
      @opExample(#{ returnType: #{ type: "ONE" } })
      @opExample(#{ returnType: #{ type: "TWO" } })
      op /*test*/test(): FooOrBar | OneOrTwo;
    `);

    expect(examples).toHaveLength(4);
    ok(examples[0].returnType);
    expect(serializeValueAsJson(program, examples[0].returnType, target.returnType)).toEqual({
      type: "TWO",
    });
    ok(examples[1].returnType);
    expect(serializeValueAsJson(program, examples[1].returnType, target.returnType)).toEqual({
      type: "ONE",
    });
    ok(examples[2].returnType);
    expect(serializeValueAsJson(program, examples[2].returnType, target.returnType)).toEqual({
      type: "BAR",
    });
    ok(examples[3].returnType);
    expect(serializeValueAsJson(program, examples[3].returnType, target.returnType)).toEqual({
      type: "FOO",
    });
  });

  it("emit diagnostic for unassignable value", async () => {
    const diagnostics = await Tester.diagnose(`
          model Pet { id: string; name: string; }
          @opExample(
            #{
              returnType: #{ id: 123, name: "Fluffy" },
            }
          )
          op read(): Pet;
      `);
    expectDiagnostics(diagnostics, {
      code: "unassignable",
    });
  });
});

describe("json serialization of examples", () => {
  async function getJsonValueOfExample(code: string) {
    const { examples, program, target } = await getExamplesFor(code);
    return serializeValueAsJson(program, examples[0].value, target);
  }

  it("respect json encodedName", async () => {
    const result = await getJsonValueOfExample(`
      @example(#{
        expireIn: 1
      })
      model /*test*/test {
        @encodedName("application/json", "exp")
        expireIn: int32
      }
    `);

    expect(result).toEqual({ exp: 1 });
  });

  it("respect json encodedName of enum members", async () => {
    const result = await getJsonValueOfExample(`
      @example(#{
        status: Status.active,
        explicit: Status.enabled,
      })
      model /*test*/test {
        status: Status;
        explicit: Status;
      }

      enum Status {
        @encodedName("application/json", "on")
        active,
        @encodedName("application/json", "off")
        enabled: "enabled",
      }
    `);

    expect(result).toEqual({ status: "on", explicit: "off" });
  });

  describe("scalar encoding", () => {
    const allCases: [
      string,
      {
        value: string;
        expect: unknown;
        encode?: string;
        /** Encoding placed on a scalar that extends the type, used as the property type. */
        scalarEncode?: string;
      }[],
    ][] = [
      ["int32", [{ value: `123`, expect: 123 }]],
      [
        "int64",
        [
          { value: `123`, expect: 123 },
          { value: `123`, expect: "123", encode: `@encode(string)` },
          { value: `123`, expect: "123", scalarEncode: `@encode(string)` },
        ],
      ],
      [
        "decimal",
        [
          { value: `1050.25`, expect: "1050.25", encode: `@encode(string)` },
          { value: `1050.25`, expect: "1050.25", scalarEncode: `@encode(string)` },
        ],
      ],
      ["string", [{ value: `"abc"`, expect: "abc" }]],
      ["boolean", [{ value: `true`, expect: true }]],
      [
        "utcDateTime",
        [
          { value: `utcDateTime.fromISO("2024-01-01T11:32:00Z")`, expect: "2024-01-01T11:32:00Z" },
          {
            value: `utcDateTime.fromISO("2024-01-01T11:32:00Z")`,
            expect: "Mon, 01 Jan 2024 11:32:00 GMT",
            encode: `@encode("rfc7231")`,
          },
          {
            value: `utcDateTime.fromISO("2024-01-01T11:32:00Z")`,
            expect: 1704108720,
            encode: `@encode("unixTimestamp", int32)`,
          },
        ],
      ],
      [
        "offsetDateTime",
        [
          {
            value: `offsetDateTime.fromISO("2024-01-01T11:32:00+01:00")`,
            expect: "2024-01-01T11:32:00+01:00",
          },
          {
            value: `offsetDateTime.fromISO("2024-01-01T11:32:00+01:00")`,
            expect: "Mon, 01 Jan 2024 10:32:00 GMT",
            encode: `@encode("rfc7231")`,
          },
        ],
      ],
      [
        "plainDate",
        [
          {
            value: `plainDate.fromISO("2024-01-01")`,
            expect: "2024-01-01",
          },
        ],
      ],
      [
        "plainTime",
        [
          {
            value: `plainTime.fromISO("11:31")`,
            expect: "11:31",
          },
        ],
      ],
      [
        "duration",
        [
          {
            value: `duration.fromISO("PT5M")`,
            expect: "PT5M",
          },
          {
            value: `duration.fromISO("PT5M")`,
            expect: 300,
            encode: `@encode("seconds", int32)`,
          },
          {
            value: `duration.fromISO("PT0.5S")`,
            expect: 0.5,
            encode: `@encode("seconds", float32)`,
          },
          {
            value: `duration.fromISO("PT5M")`,
            expect: 300000,
            encode: `@encode("milliseconds", int32)`,
          },
          {
            value: `duration.fromISO("PT0.5S")`,
            expect: 500,
            encode: `@encode("milliseconds", float32)`,
          },
        ],
      ],
    ];

    describe.each(allCases)("%s", (type, cases) => {
      const casesWithLabel = cases.map((x) => ({
        ...x,
        encodeLabel:
          x.encode ?? (x.scalarEncode ? `${x.scalarEncode} on the scalar` : "default encoding"),
      }));
      it.each(casesWithLabel)(
        `serialize with $encodeLabel`,
        async ({ value, expect: expected, encode, scalarEncode }) => {
          const result = await getJsonValueOfExample(`
          model TestModel {
            @example(${value})
            ${encode ?? ""}
            /*test*/test: ${scalarEncode ? "TestScalar" : type};
          }
          ${scalarEncode ? `${scalarEncode} scalar TestScalar extends ${type};` : ""}
        `);
          if (expected instanceof RegExp) {
            expect(result).toMatch(expected);
          } else {
            expect(result).toEqual(expected);
          }
        },
      );
    });
  });

  it("serialize int64 default above 2^53 as a string with @encode(string)", async () => {
    const { test, program } = (await Tester.compile(`
      model TestModel {
        @encode(string) /*test*/test: int64 = 9007199254740993;
      }
    `)) as any;

    expect(serializeValueAsJson(program, test.defaultValue, test)).toEqual("9007199254740993");
  });

  it("serialize int64 default above 2^53 and example as strings with @encode(string) on the scalar", async () => {
    const { test, program } = (await Tester.compile(`
      model TestModel {
        @example(123) /*test*/test: Id = 9007199254740993;
      }

      @encode(string) scalar Id extends int64;
    `)) as any;

    expect(serializeValueAsJson(program, test.defaultValue, test)).toEqual("9007199254740993");
    const examples = getExamples(program, test);
    expect(serializeValueAsJson(program, examples[0].value, test)).toEqual("123");
  });

  it("serialize nullable int64 default above 2^53 as a string with @encode(string) on the scalar", async () => {
    const { test, program } = (await Tester.compile(`
      model TestModel {
        /*test*/test: Id | null = 9007199254740993;
      }

      @encode(string) scalar Id extends int64;
    `)) as any;

    expect(serializeValueAsJson(program, test.defaultValue, test)).toEqual("9007199254740993");
  });

  describe("typed const values use the encoding of the scalar they are serialized as", () => {
    it("example on a property", async () => {
      const result = await getJsonValueOfExample(`
        const n: int64 = 123;
        @encode(string)
        scalar Id extends int64;

        model Test {
          @example(n) /*test*/id: Id;
        }
      `);
      expect(result).toEqual("123");
    });

    it("example on a nullable property", async () => {
      const result = await getJsonValueOfExample(`
        const n: int64 = 123;
        @encode(string) scalar Id extends int64;

        model Test {
          @example(n) /*test*/id: Id | null;
        }
      `);
      expect(result).toEqual("123");
    });

    it("example on the scalar", async () => {
      const result = await getJsonValueOfExample(`
        const n: int64 = 123;
        @example(n) @encode(string) scalar /*test*/Id extends int64;
      `);
      expect(result).toEqual("123");
    });

    it("example on a model", async () => {
      const result = await getJsonValueOfExample(`
        const n: SubId = 123;
        @encode(string) scalar Id extends int64;
        scalar SubId extends Id;

        @example(#{ id: n })
        model /*test*/Test {
          id: Id;
        }
      `);
      expect(result).toEqual({ id: "123" });
    });

    it("example on an operation", async () => {
      const { examples, program, target } = await getOpExamplesFor(`
        const n: SubId = 123;
        @encode(string) scalar Id extends int64;
        scalar SubId extends Id;

        @opExample(#{ parameters: #{ id: n }, returnType: #{ id: n } })
        op /*test*/read(id: Id): { id: Id };
      `);
      expect(serializeValueAsJson(program, examples[0].parameters!, target.parameters)).toEqual({
        id: "123",
      });
      expect(serializeValueAsJson(program, examples[0].returnType!, target.returnType)).toEqual({
        id: "123",
      });
    });

    it("default above 2^53", async () => {
      const { test, nullable, program } = (await Tester.compile(`
        const n: SubId = 9007199254740993;
        @encode(string) scalar Id extends int64;
        scalar SubId extends Id;

        model Test {
          /*test*/test: Id = n;
          /*nullable*/nullable: Id | null = n;
        }
      `)) as any;

      expect(serializeValueAsJson(program, test.defaultValue, test)).toEqual("9007199254740993");
      expect(serializeValueAsJson(program, nullable.defaultValue, nullable)).toEqual(
        "9007199254740993",
      );
    });

    it("stay numbers when only the const's scalar is encoded", async () => {
      const { test, program } = (await Tester.compile(`
        const n: Id = 123;
        @encode(string) scalar Id extends int64;

        model Test {
          @example(n) /*test*/test: int64 = n;
        }
      `)) as any;

      expect(serializeValueAsJson(program, test.defaultValue, test)).toEqual(123);
      const examples = getExamples(program, test);
      expect(serializeValueAsJson(program, examples[0].value, test)).toEqual(123);
    });

    it("stay numbers for a numeric literal type", async () => {
      const { literal, mixed, program } = (await Tester.compile(`
        const n: Id = 123;
        @encode(string) scalar Id extends int64;

        model Test {
          @example(n) /*literal*/literal: 123;
          @example(n) /*mixed*/mixed: 123 | string;
        }
      `)) as any;

      for (const prop of [literal, mixed]) {
        const examples = getExamples(program, prop);
        expect(serializeValueAsJson(program, examples[0].value, prop)).toEqual(123);
      }
    });
  });

  it("serialize tuple items with the encoding of their type", async () => {
    const { test, program } = (await Tester.compile(`
      const n: SubId = 123;
      @encode(string) scalar Id extends int64;
      scalar SubId extends Id;

      model Test {
        @example(#[123, n, true]) /*test*/test?: [Id, Id, boolean] = #[n, 123, false];
      }
    `)) as any;

    expect(serializeValueAsJson(program, test.defaultValue, test)).toEqual(["123", "123", false]);
    const examples = getExamples(program, test);
    expect(serializeValueAsJson(program, examples[0].value, test)).toEqual(["123", "123", true]);
  });

  it("serialize arrays and tuples behind a nullable union with the encoding of their items", async () => {
    const { tuple, array, pair, program } = (await Tester.compile(`
      @encode(string) scalar Id extends int64;

      model Test {
        @example(#[123]) /*tuple*/tuple?: [Id] | null = #[9007199254740993];
        @example(#[123]) /*array*/array?: Id[] | null = #[9007199254740993];
        /*pair*/pair?: [int32] | [Id, Id] | null = #[1, 2];
      }
    `)) as any;

    for (const prop of [tuple, array]) {
      expect(serializeValueAsJson(program, prop.defaultValue, prop)).toEqual(["9007199254740993"]);
      const examples = getExamples(program, prop);
      expect(serializeValueAsJson(program, examples[0].value, prop)).toEqual(["123"]);
    }
    expect(serializeValueAsJson(program, pair.defaultValue, pair)).toEqual(["1", "2"]);
  });

  it("serialize an array default with the variant that accepts its length", async () => {
    const { max, min, one, program } = (await Tester.compile(`
      @encode(string) scalar Id extends int64;
      @maxItems(1) model Limited is Id[];
      @minItems(3) model AtLeastThree is Id[];

      model Test {
        /*max*/max?: Limited | int32[] = #[1, 2];
        /*min*/min?: AtLeastThree | int32[] = #[1, 2];
        /*one*/one?: Limited | int32[] = #[1];
      }
    `)) as any;

    expect(serializeValueAsJson(program, max.defaultValue, max)).toEqual([1, 2]);
    expect(serializeValueAsJson(program, min.defaultValue, min)).toEqual([1, 2]);
    expect(serializeValueAsJson(program, one.defaultValue, one)).toEqual(["1"]);
  });

  it("serialize object items of tuples and nullable arrays with the encoded names and encodings of their model", async () => {
    const { tuple, array, program } = (await Tester.compile(`
      model Item {
        @encodedName("application/json", "item_id") @encode(string) id: int64;
        @encode(DateTimeKnownEncoding.unixTimestamp, int32) at: utcDateTime;
      }
      const at = utcDateTime.fromISO("2024-01-01T00:00:00Z");

      model Test {
        @example(#[#{ id: 1, at: at }]) /*tuple*/tuple?: [Item] = #[#{ id: 2, at: at }];
        @example(#[#{ id: 1, at: at }]) /*array*/array?: Item[] | null = #[#{ id: 2, at: at }];
      }
    `)) as any;

    for (const prop of [tuple, array]) {
      expect(serializeValueAsJson(program, prop.defaultValue, prop)).toEqual([
        { item_id: "2", at: 1704067200 },
      ]);
      const examples = getExamples(program, prop);
      expect(serializeValueAsJson(program, examples[0].value, prop)).toEqual([
        { item_id: "1", at: 1704067200 },
      ]);
    }
  });

  it("serialize an object default behind a nullable union", async () => {
    const { test, program } = (await Tester.compile(`
      model Pet {
        @encodedName("application/json", "pet_name") name: string;
      }

      model Test {
        /*test*/test?: Pet | null = #{ name: "a" };
      }
    `)) as any;

    expect(serializeValueAsJson(program, test.defaultValue, test)).toEqual({ pet_name: "a" });
  });

  describe("recursive unions", () => {
    it("serialize a numeric example", async () => {
      const result = await getJsonValueOfExample(`
        @example(123)
        union /*test*/Loop { self: Loop, n: int64 }
      `);
      expect(result).toEqual(123);
    });

    it("serialize with the encoding of the variant the value is assignable to", async () => {
      const { loop, mutual, ids, program } = (await Tester.compile(`
        @encode(string) scalar Id extends int64;
        union LoopId { self: LoopId, id: Id, flag: boolean }
        union A { b: B, n: int32 }
        union B { a: A, id: Id }
        union LoopIds { self: LoopIds, ids: Id[] }

        model Test {
          @example(123) /*loop*/loop: LoopId;
          @example(123) /*mutual*/mutual: A;
          @example(#[123]) /*ids*/ids: LoopIds;
        }
      `)) as any;

      const serializeExample = (prop: any) =>
        serializeValueAsJson(program, getExamples(program, prop)[0].value, prop);
      expect(serializeExample(loop)).toEqual("123");
      expect(serializeExample(mutual)).toEqual("123");
      expect(serializeExample(ids)).toEqual(["123"]);
    });

    it("serialize an object example", async () => {
      const result = await getJsonValueOfExample(`
        model Pet { name: string }
        union Loop { self: Loop, pet: Pet }

        model Test {
          @example(#{ name: "a" }) /*test*/test: Loop;
        }
      `);
      expect(result).toEqual({ name: "a" });
    });

    it("serialize an object default", async () => {
      const { test, program } = (await Tester.compile(`
        model Pet { name: string }
        union Loop { self: Loop, pet: Pet, n: int64 }

        model Test {
          /*test*/test?: Loop = #{ name: "a" };
        }
      `)) as any;

      expect(serializeValueAsJson(program, test.defaultValue, test)).toEqual({ name: "a" });
    });
  });

  it("serialize models with parent", async () => {
    const result = await getJsonValueOfExample(`
      @example(#{ a: "one", b: "two" })
      model /*test*/test extends A {
        b: string;
      }

      model A {
        a: string;
      }

    `);

    expect(result).toEqual({ a: "one", b: "two" });
  });

  it("serialize nested models", async () => {
    const result = await getJsonValueOfExample(`
      @example(#{ a: #{ name: "one" } })
      model /*test*/test {
        a: A;
      }

      model A {
        name: string;
      }

    `);

    expect(result).toEqual({ a: { name: "one" } });
  });

  it("serialize nested models in arrays", async () => {
    const result = await getJsonValueOfExample(`
      @example(#{ items: #[#{ name: "one" }, #{ name: "two" }] })
      model /*test*/test {
        items: Array<A>;
      }

      model A {
        name: string;
      }

    `);

    expect(result).toEqual({ items: [{ name: "one" }, { name: "two" }] });
  });

  it("serialize nested record in arrays", async () => {
    const result = await getJsonValueOfExample(`
      @example(#{ items: #{one: #{ name: "one" }, two: #{ name: "two" }} })
      model /*test*/test {
        items: Record<A>;
      }

      model A {
        name: string;
      }

    `);

    expect(result).toEqual({ items: { one: { name: "one" }, two: { name: "two" } } });
  });

  it("serialize example as it is when type is unknown", async () => {
    const result = await getJsonValueOfExample(`
      @example(#{ a: #{ name: "one", other: 123 } })
      model /*test*/test {
        a: unknown
      }
    `);

    expect(result).toEqual({ a: { name: "one", other: 123 } });
  });

  it("serialize example targetting a union using one of the types", async () => {
    const result = await getJsonValueOfExample(`
      @example(#{ a: #{ name: "one", other: 123 } })
      model /*test*/test {
        a: A | B;
      }

      model A {
        a: string
      }

      model B {
        name: string;
        other: int32;
      }
    `);

    expect(result).toEqual({ a: { name: "one", other: 123 } });
  });
});
