import { Tester } from "#test/test-host.js";
import { type Children } from "@alloy-js/core";
import { createCSharpNamePolicy, Namespace, SourceFile } from "@alloy-js/csharp";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, expect, it } from "vitest";
import { Output } from "../../../core/index.js";
import { EnumDeclaration } from "../../index.js";

let runner: TesterInstance;

beforeEach(async () => {
  runner = await Tester.createInstance();
});

function Wrapper(props: { children: Children }) {
  const policy = createCSharpNamePolicy();
  return (
    <Output program={runner.program} namePolicy={policy}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">{props.children}</SourceFile>
      </Namespace>
    </Output>
  );
}

it("renders a basic enum declaration", async () => {
  const { TestEnum } = await runner.compile(t.code`
    @test enum ${t.enum("TestEnum")} {
      Value1;
      Value2;
      Value3;
    }
  `);

  expect(
    <Wrapper>
      <EnumDeclaration type={TestEnum} />
    </Wrapper>,
  ).toRenderTo(`
    namespace TestNamespace
    {
        enum TestEnum
        {
            Value1,
            Value2,
            Value3
        }
    }
  `);
});

it("renders an empty enum declaration", async () => {
  const { TestEnum } = await runner.compile(t.code`
    @test enum ${t.enum("TestEnum")} {}
  `);

  expect(
    <Wrapper>
      <EnumDeclaration type={TestEnum} />
    </Wrapper>,
  ).toRenderTo(`
    namespace TestNamespace
    {
        enum TestEnum
        {

        }
    }
  `);
});

it("can override enum name", async () => {
  const { TestEnum } = await runner.compile(t.code`
    @test enum ${t.enum("TestEnum")} {
      Value1;
      Value2;
    }
  `);

  expect(
    <Wrapper>
      <EnumDeclaration type={TestEnum} name="CustomEnumName" />
    </Wrapper>,
  ).toRenderTo(`
    namespace TestNamespace
    {
        enum CustomEnumName
        {
            Value1,
            Value2
        }
    }
  `);
});

it("renders an enum with access modifiers", async () => {
  const { TestEnum } = await runner.compile(t.code`
    @test enum ${t.enum("TestEnum")} {
      Value1;
      Value2;
    }
  `);

  expect(
    <Wrapper>
      <EnumDeclaration type={TestEnum} internal />
    </Wrapper>,
  ).toRenderTo(`
    namespace TestNamespace
    {
        internal enum TestEnum
        {
            Value1,
            Value2
        }
    }
  `);
});

it("renders enum with C# naming conventions", async () => {
  const { TestEnum } = await runner.compile(t.code`
    @test enum ${t.enum("TestEnum")} {
      value_one;
      value_two;
      value_three;
    }
  `);

  expect(
    <Output program={runner.program} namePolicy={createCSharpNamePolicy()}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <EnumDeclaration type={TestEnum} />
        </SourceFile>
      </Namespace>
    </Output>,
  ).toRenderTo(`
    namespace TestNamespace
    {
        enum TestEnum
        {
            ValueOne,
            ValueTwo,
            ValueThree
        }
    }
  `);
});

it("renders enum with single value", async () => {
  const { TestEnum } = await runner.compile(t.code`
    @test enum ${t.enum("TestEnum")} {
      OnlyValue;
    }
  `);

  expect(
    <Wrapper>
      <EnumDeclaration type={TestEnum} />
    </Wrapper>,
  ).toRenderTo(`
    namespace TestNamespace
    {
        enum TestEnum
        {
            OnlyValue
        }
    }
  `);
});

it("renders enum with numeric-like member names", async () => {
  const { TestEnum } = await runner.compile(t.code`
    @test enum ${t.enum("TestEnum")} {
      Value0;
      Value1;
      Value10;
      Value100;
    }
  `);

  expect(
    <Wrapper>
      <EnumDeclaration type={TestEnum} />
    </Wrapper>,
  ).toRenderTo(`
    namespace TestNamespace
    {
        enum TestEnum
        {
            Value0,
            Value1,
            Value10,
            Value100
        }
    }
  `);
});

it("renders multiple enums in the same namespace", async () => {
  const { TestEnum1, TestEnum2 } = await runner.compile(t.code`
    @test enum ${t.enum("TestEnum1")} {
      Value1;
      Value2;
    }
    @test enum ${t.enum("TestEnum2")} {
      OptionA;
      OptionB;
      OptionC;
    }
  `);

  expect(
    <Wrapper>
      <EnumDeclaration type={TestEnum1} />
      <hbr />
      <EnumDeclaration type={TestEnum2} />
    </Wrapper>,
  ).toRenderTo(`
    namespace TestNamespace
    {
        enum TestEnum1
        {
            Value1,
            Value2
        }
        enum TestEnum2
        {
            OptionA,
            OptionB,
            OptionC
        }
    }
  `);
});

it("renders an enum with doc comments", async () => {
  const { TestEnum } = await runner.compile(t.code`
    @test enum ${t.enum("TestEnum")} {
      @doc("This is value one")
      Value1;
      /** This is value two */
      Value2;
    }
  `);

  expect(
    <Wrapper>
      <EnumDeclaration type={TestEnum} />
    </Wrapper>,
  ).toRenderTo(`
    namespace TestNamespace
    {
        enum TestEnum
        {
            /// <summary>
            /// This is value one
            /// </summary>
            Value1,
            /// <summary>
            /// This is value two
            /// </summary>
            Value2
        }
    }
  `);
});
