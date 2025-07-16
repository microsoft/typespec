import { Tester } from "#test/test-host.js";
import { type Children } from "@alloy-js/core";
import { createCSharpNamePolicy, Namespace, SourceFile } from "@alloy-js/csharp";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { Output } from "../../../core/index.js";
import { ClassDeclaration, EnumDeclaration } from "../../index.js";

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

it("renders an empty class declaration", async () => {
  const { TestModel } = await runner.compile(t.code`
    model ${t.model("TestModel")} {}
  `);

  expect(
    <Wrapper>
      <ClassDeclaration type={TestModel} />
    </Wrapper>,
  ).toRenderTo(`
    namespace TestNamespace
    {
        class TestModel
        {

        }
    }
  `);
});

it("renders a class declaration with properties", async () => {
  const { TestModel } = await runner.compile(t.code`
    model ${t.model("TestModel")} {
      @test Prop1: string;
      @test Prop2: int32;
    }
  `);

  expect(
    <Wrapper>
      <ClassDeclaration type={TestModel} />
    </Wrapper>,
  ).toRenderTo(`
    namespace TestNamespace
    {
        class TestModel
        {
            public required string Prop1 { get; set; }
            public required int Prop2 { get; set; }
        }
    }
  `);
});

it("can override class name", async () => {
  const { TestModel } = await runner.compile(t.code`
    model ${t.model("TestModel")} {}
  `);

  expect(
    <Wrapper>
      <ClassDeclaration type={TestModel} name="CustomClassName" />
    </Wrapper>,
  ).toRenderTo(`
    namespace TestNamespace
    {
        class CustomClassName
        {

        }
    }
  `);
});

it("renders a class with access modifiers", async () => {
  const { TestModel } = await runner.compile(t.code`
    model ${t.model("TestModel")} {
    }
  `);

  expect(
    <Wrapper>
      <ClassDeclaration type={TestModel} protected />
    </Wrapper>,
  ).toRenderTo(`
    namespace TestNamespace
    {
        protected class TestModel
        {

        }
    }
  `);
});

describe("from an interface", () => {
  it("renders an empty class", async () => {
    const { TestInterface } = await runner.compile(t.code`
    interface ${t.interface("TestInterface")} {
    }
  `);

    expect(
      <Wrapper>
        <ClassDeclaration type={TestInterface} />
      </Wrapper>,
    ).toRenderTo(`
      namespace TestNamespace
      {
          class TestInterface
          {

          }
      }
    `);
  });

  it("renders a class with operations", async () => {
    const { TestInterface } = await runner.compile(t.code`
    interface ${t.interface("TestInterface")} {
      op getName(id: string): string;
    }
  `);

    expect(
      <Wrapper>
        <ClassDeclaration type={TestInterface} />
      </Wrapper>,
    ).toRenderTo(`
      namespace TestNamespace
      {
          class TestInterface
          {
              public abstract string GetName(string id);
          }
      }
    `);
  });
});

it("renders a class with model members", async () => {
  const { TestModel, TestReference } = await runner.compile(t.code`
    model ${t.model("TestReference")} { }
    model ${t.model("TestModel")} {
      prop1: TestReference;
    }
  `);

  expect(
    <Wrapper>
      <ClassDeclaration type={TestReference} />
      <hbr />
      <ClassDeclaration type={TestModel} />
    </Wrapper>,
  ).toRenderTo(`
    namespace TestNamespace
    {
        class TestReference
        {

        }
        class TestModel
        {
            public required TestReference Prop1 { get; set; }
        }
    }
  `);
});

it("renders a class with enum members", async () => {
  const { TestModel, TestEnum } = await runner.compile(t.code`
    @test enum ${t.enum("TestEnum")} {
      Value1;
      Value2;
    }
    model ${t.model("TestModel")} {
      @test prop1: TestEnum;
    }
  `);

  expect(
    <Wrapper>
      <EnumDeclaration type={TestEnum} />
      <hbr />
      <ClassDeclaration type={TestModel} />
    </Wrapper>,
  ).toRenderTo(`
    namespace TestNamespace
    {
        enum TestEnum
        {
            Value1,
            Value2
        }
        class TestModel
        {
            public required TestEnum Prop1 { get; set; }
        }
    }
  `);
});

it("maps prop: string | null to nullable property", async () => {
  const { TestModel } = await runner.compile(t.code`
    model ${t.model("TestModel")} {
      prop1: string | null;
    }
  `);

  expect(
    <Wrapper>
      <ClassDeclaration type={TestModel} />
    </Wrapper>,
  ).toRenderTo(`
    namespace TestNamespace
    {
        class TestModel
        {
            public required string? Prop1 { get; set; }
        }
    }
  `);
});

it("renders a class with string enums", async () => {
  const { TestModel, TestEnum } = await runner.compile(t.code`
    @test enum ${t.enum("TestEnum")} {
      Value1;
      Value2;
    }
    model ${t.model("TestModel")} {
      @test prop1: TestEnum;
    }
  `);

  expect(
    <Wrapper>
      <EnumDeclaration type={TestEnum} />
      <hbr />
      <ClassDeclaration type={TestModel} />
    </Wrapper>,
  ).toRenderTo(`
    namespace TestNamespace
    {
        enum TestEnum
        {
            Value1,
            Value2
        }
        class TestModel
        {
            public required TestEnum Prop1 { get; set; }
        }
    }
  `);
});

describe("with doc comments", () => {
  it("renders a model with docs", async () => {
    const { TestModel } = await runner.compile(t.code`
    @doc("This is a test model")
    model ${t.model("TestModel")} {
      @doc("This is a test property")
        prop1: string;
      }
    
  `);

    expect(
      <Wrapper>
        <ClassDeclaration type={TestModel} />
      </Wrapper>,
    ).toRenderTo(`
      namespace TestNamespace
      {
          /// <summary>
          /// This is a test model
          /// </summary>
          class TestModel
          {
              /// <summary>
              /// This is a test property
              /// </summary>
              public required string Prop1 { get; set; }
          }
      }
    `);
  });

  it("renders an interface with docs", async () => {
    const { TestInterface } = await runner.compile(t.code`
      @doc("This is a test interface")
      @test interface ${t.interface("TestInterface")} {
        @doc("This is a test operation")
        @returnsDoc("The name of the item")
        op getName(id: string): string;
      }
    `);

    expect(
      <Wrapper>
        <ClassDeclaration type={TestInterface} />
      </Wrapper>,
    ).toRenderTo(`
      namespace TestNamespace
      {
          /// <summary>
          /// This is a test interface
          /// </summary>
          class TestInterface
          {
              /// <summary>
              /// This is a test operation
              /// </summary>
              ///
              /// <returns>
              /// The name of the item
              /// </returns>
              public abstract string GetName(string id);
          }
      }
    `);
  });
});
