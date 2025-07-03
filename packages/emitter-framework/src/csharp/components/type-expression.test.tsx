import { type Children, render } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import { Namespace, SourceFile } from "@alloy-js/csharp";
import type { Model, ModelProperty } from "@typespec/compiler";
import type { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, it } from "vitest";
import { createEmitterFrameworkTestRunner } from "../../../test/typescript/test-host.js";
import { assertFileContents } from "../../../test/utils.js";
import { Output } from "../../core/index.js";
import { ClassDeclaration } from "./class/declaration.js";
import { TypeExpression } from "./type-expression.jsx";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createEmitterFrameworkTestRunner();
});

function Wrapper(props: { children: Children }) {
  return (
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.ts">{props.children}</SourceFile>
      </Namespace>
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
    const res = render(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    );

    assertFileContents(
      res,
      d`
          namespace TestNamespace
          {
              ${csType}
          }
        `,
    );
  });
});

it("maps array to c# array", async () => {
  const type = await compileType("int32[]");
  const res = render(
    <Wrapper>
      <TypeExpression type={type} />
    </Wrapper>,
  );

  assertFileContents(
    res,
    d`
          namespace TestNamespace
          {
              int[]
          }
        `,
  );
});

describe("Record map to IDictionary", () => {
  it("for primitive types", async () => {
    const type = await compileType("Record<int32>");
    const res = render(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    );

    assertFileContents(
      res,
      d`
          namespace TestNamespace
          {
              IDictionary<string, int>
          }
        `,
    );
  });

  it("for models", async () => {
    const { test, Pet } = (await runner.compile(`
      model Test {
        @test test: Record<Pet>;
      }
      @test model Pet {}
    `)) as { test: ModelProperty; Pet: Model };

    const res = render(
      <Wrapper>
        <ClassDeclaration type={Pet} />
        <hbr />
        <TypeExpression type={test.type} />
      </Wrapper>,
    );

    assertFileContents(
      res,
      d`
          namespace TestNamespace
          {
              class Pet
              {
          
              }
              IDictionary<string, Pet>
          }
        `,
    );
  });
});
