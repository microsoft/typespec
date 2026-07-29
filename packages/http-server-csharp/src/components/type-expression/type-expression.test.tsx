import { Tester } from "#test/tester.js";
import { type Children } from "@alloy-js/core";
import { createCSharpNamePolicy, SourceFile } from "@alloy-js/csharp";
import { resolvePath, type ModelProperty } from "@typespec/compiler";
import { createTester, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { Experimental_ComponentOverrides, Output } from "@typespec/emitter-framework";
import { beforeEach, describe, expect, it } from "vitest";
import { createServerScalarOverrides, TypeExpression } from "./type-expression.jsx";

// Separate tester that also loads @typespec/json-schema so @uniqueItems is available.
const JsonSchemaTester = createTester(resolvePath(import.meta.dirname, "../../.."), {
  libraries: ["@typespec/http", "@typespec/rest", "@typespec/json-schema"],
})
  .importLibraries()
  .using("Http", "Rest", "JsonSchema");

let runner: TesterInstance;

beforeEach(async () => {
  runner = await Tester.createInstance();
});

function Wrapper(props: { children: Children }) {
  const policy = createCSharpNamePolicy();
  const overrides = createServerScalarOverrides($(runner.program));
  return (
    <Output program={runner.program} namePolicy={policy}>
      <Experimental_ComponentOverrides overrides={overrides}>
        <SourceFile path="test.cs">{props.children}</SourceFile>
      </Experimental_ComponentOverrides>
    </Output>
  );
}

async function compileType(ref: string) {
  const { test } = await runner.compile(`
    model Test {
      @test test: ${ref};
    }
  `);
  return (test as ModelProperty).type;
}

describe("scalar types", () => {
  it.each([
    ["string", "string"],
    ["int32", "int"],
    ["int64", "long"],
    ["float32", "float"],
    ["float64", "double"],
    ["boolean", "bool"],
    ["decimal", "decimal"],
    ["decimal128", "decimal"],
  ])("%s => %s", async (tspType, csType) => {
    const type = await compileType(tspType);
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo(`${csType}`);
  });
});

describe("server-specific scalar mappings", () => {
  it("maps plainDate to DateTime", async () => {
    const type = await compileType("plainDate");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("DateTime");
  });

  it("maps plainTime to DateTime", async () => {
    const type = await compileType("plainTime");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("DateTime");
  });

  it("maps utcDateTime to DateTimeOffset", async () => {
    const type = await compileType("utcDateTime");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("DateTimeOffset");
  });

  it("maps duration to TimeSpan", async () => {
    const type = await compileType("duration");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("TimeSpan");
  });

  it("maps url to string", async () => {
    const type = await compileType("url");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("string");
  });
});

describe("array types", () => {
  it("maps int32[] to int[]", async () => {
    const type = await compileType("int32[]");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("int[]");
  });

  it("maps string[] to string[]", async () => {
    const type = await compileType("string[]");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("string[]");
  });
});

describe("record types", () => {
  it("maps Record<int32> to IDictionary<string, int>", async () => {
    const type = await compileType("Record<int32>");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("IDictionary<string, int>");
  });
});

describe("nullable union", () => {
  it("maps int32 | null to int?", async () => {
    const type = await compileType("int32 | null");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("int?");
  });

  it("maps string | null to string", async () => {
    const type = await compileType("string | null");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("string");
  });
});

describe("literal types", () => {
  it("maps string literal to string", async () => {
    const type = await compileType('"hello"');
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("string");
  });

  it("maps integer literal to int", async () => {
    const type = await compileType("42");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("int");
  });

  it("maps float literal to double", async () => {
    const type = await compileType("3.14");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("double");
  });

  it("maps boolean literal to bool", async () => {
    const type = await compileType("true");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("bool");
  });
});

// ---------------------------------------------------------------------------
// Ported from the string-matching TYPE assertions in test/generation.test.ts.
// Each case below asserts the exact C# type expression rendered for a type,
// collapsing the redundant property-declaration noise (get/set, nullability
// markers, JSON attributes) that belongs to other components.
// ---------------------------------------------------------------------------

async function compileTypeWithDefs(defs: string, ref: string) {
  const { test } = await runner.compile(`${defs}
    model Test {
      @test test: ${ref};
    }`);
  return (test as ModelProperty).type;
}

// Ported from "generates standard scalar properties" (generation.test.ts:97).
// Only the CLR / extended scalar mappings not already covered by the tables above.
describe("CLR and extended scalar mappings", () => {
  it.each([
    ["bytes", "byte[]"],
    ["int8", "SByte"],
    ["uint8", "Byte"],
    ["int16", "Int16"],
    ["uint16", "UInt16"],
    ["uint32", "UInt32"],
    ["uint64", "UInt64"],
    ["safeint", "long"],
    ["offsetDateTime", "DateTimeOffset"],
    ["unixTimestamp32", "DateTimeOffset"],
  ])("%s => %s", async (tspType, csType) => {
    const type = await compileType(tspType);
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo(csType);
  });
});

// Ported from "handles scalar extensions" (240) and "handles scalar templates" (259).
describe("scalar extensions and templates", () => {
  it("scalar extending string => string", async () => {
    const type = await compileTypeWithDefs("@secret scalar password extends string;", "password");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("string");
  });

  it("ResourceLocation<T> => string", async () => {
    const type = await compileTypeWithDefs("model Foo {}", "ResourceLocation<Foo>");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("string");
  });

  // Ported from "generates appropriate types for literals" (1560): string template -> string.
  it("string template => string", async () => {
    const type = await compileTypeWithDefs("model Foo { s: string; }", '"${Foo.s} and then some"');
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("string");
  });
});

// Ported from "generates standard scalar array properties" (396) and
// "generates bytes array properties" (568). Byte arrays (uint8/int8) stay T[].
describe("scalar array mappings", () => {
  it.each([
    ["int8[]", "SByte[]"],
    ["uint8[]", "Byte[]"],
    ["int16[]", "Int16[]"],
    ["int64[]", "long[]"],
    ["uint16[]", "UInt16[]"],
    ["uint32[]", "UInt32[]"],
    ["uint64[]", "UInt64[]"],
    ["float32[]", "float[]"],
    ["float64[]", "double[]"],
    ["boolean[]", "bool[]"],
    ["plainDate[]", "DateTime[]"],
    ["plainTime[]", "DateTime[]"],
    ["utcDateTime[]", "DateTimeOffset[]"],
    ["offsetDateTime[]", "DateTimeOffset[]"],
    ["duration[]", "TimeSpan[]"],
  ])("%s => %s", async (tspType, csType) => {
    const type = await compileType(tspType);
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo(csType);
  });
});

// Ported from "generates standard scalar array for uniqueItems model" (523 / 3242).
// @uniqueItems on the Array model itself is a TypeExpression concern (-> ISet<T>).
describe("uniqueItems array model", () => {
  it("@uniqueItems model is Array<string> => ISet<string>", async () => {
    // Needs @typespec/json-schema for the @uniqueItems decorator.
    runner = await JsonSchemaTester.createInstance();
    const type = await compileTypeWithDefs("@uniqueItems model U is Array<string>;", "U");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("ISet<string>");
  });
});

// Ported from "Coalesces union types" (921).
describe("union coalescing", () => {
  it("int32 | string => object", async () => {
    const type = await compileType("int32 | string");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("object");
  });

  it('"foo" | "bar" | "baz" => string', async () => {
    const type = await compileType('"foo" | "bar" | "baz"');
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("string");
  });
});

// Ported from "generates literal properties" (324) and
// "generates appropriate types for literals" (1560): the remaining literal kinds.
describe("additional literal mappings", () => {
  it.each([
    ["8", "int"],
    ["false", "bool"],
  ])("%s => %s", async (tspType, csType) => {
    const type = await compileType(tspType);
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo(csType);
  });
});

// Ported from "generates appropriate types for records" (1656).
describe("record mappings", () => {
  it("Record<string> => IDictionary<string, string>", async () => {
    const type = await compileType("Record<string>");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("IDictionary<string, string>");
  });

  it("Record<unknown> => JsonObject", async () => {
    const type = await compileType("Record<unknown>");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo("JsonObject");
  });
});
