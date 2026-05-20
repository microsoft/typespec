import { Tester } from "#test/tester.js";
import { type Children } from "@alloy-js/core";
import { createCSharpNamePolicy, SourceFile } from "@alloy-js/csharp";
import type { ModelProperty } from "@typespec/compiler";
import { type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { Experimental_ComponentOverrides, Output } from "@typespec/emitter-framework";
import { beforeEach, describe, expect, it } from "vitest";
import { createServerScalarOverrides, TypeExpression } from "./type-expression.jsx";

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
