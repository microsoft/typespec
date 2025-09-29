import { Tester } from "#test/test-host.js";
import { type Children } from "@alloy-js/core";
import { SourceFile } from "@alloy-js/csharp";
import type { ModelProperty } from "@typespec/compiler";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { Output } from "../../core/index.js";
import { ClassDeclaration } from "./class/declaration.js";
import { TypeExpression } from "./type-expression.jsx";

let runner: TesterInstance;

beforeEach(async () => {
  runner = await Tester.createInstance();
});

function Wrapper(props: { children: Children }) {
  return (
    <Output program={runner.program}>
      <SourceFile path="test.ts">{props.children}</SourceFile>
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

describe("map scalar to c# built-in types", () => {
  it.each([
    ["string", "string"],
    ["int32", "int"],
    ["int64", "long"],
  ])("%s => %s", async (tspType, csType) => {
    const type = await compileType(tspType);
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo(`
        ${csType}
        `);
  });
});

it("maps array to c# array", async () => {
  const type = await compileType("int32[]");
  expect(
    <Wrapper>
      <TypeExpression type={type} />
    </Wrapper>,
  ).toRenderTo(`
    int[]
  `);
});

describe("Record map to IDictionary", () => {
  it("for primitive types", async () => {
    const type = await compileType("Record<int32>");
    expect(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    ).toRenderTo(`
      IDictionary<string, int>
    `);
  });

  it("for models", async () => {
    const { test, Pet } = await runner.compile(t.code`
      model Test {
         ${t.modelProperty("test")}: Record<Pet>;
      }
      @test model ${t.model("Pet")} {}
    `);

    expect(
      <Wrapper>
        <ClassDeclaration type={Pet} />
        <hbr />
        <TypeExpression type={test.type} />
      </Wrapper>,
    ).toRenderTo(`
      class Pet
      {
      
      }
      IDictionary<string, Pet>
    `);
  });
});

describe("Nullable union", () => {
  it("nullable boolean", async () => {
    const { Pet } = await runner.compile(t.code`
      @test model ${t.model("Pet")} {
        @test name: boolean | null;
      }
    `);

    expect(
      <Wrapper>
        <ClassDeclaration type={Pet} />
      </Wrapper>,
    ).toRenderTo(`
      class Pet
      {
          public required bool? name { get; set; }
      }
    `);
  });
});

describe("Literal types", () => {
  it("literal types (string, int, double, bool)", async () => {
    const { Pet } = await runner.compile(t.code`
      @test model ${t.model("Pet")} {
        @test boolName: true;
        @test intName: 42;
        @test doubleName: 3.14;
        @test stringName: "Hello";
      }
    `);

    expect(
      <Wrapper>
        <ClassDeclaration type={Pet} />
      </Wrapper>,
    ).toRenderTo(`
      class Pet
      {
          public required bool boolName { get; set; }

          public required int intName { get; set; }

          public required double doubleName { get; set; }
      
          public required string stringName { get; set; }
      }
    `);
  });
});
