import { render } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import * as cs from "@alloy-js/csharp";
import { Namespace, SourceFile } from "@alloy-js/csharp";
import { Enum, Interface, Model } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, it } from "vitest";
import { Output } from "../../../src/core/index.js";
import { ClassDeclaration, EnumDeclaration } from "../../../src/csharp/index.js";
import { createEmitterFrameworkTestRunner } from "../test-host.js";
import { assertFileContents } from "../utils.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createEmitterFrameworkTestRunner();
});

it("renders an empty class declaration", async () => {
  const { TestModel } = (await runner.compile(`
    @test model TestModel {}
  `)) as { TestModel: Model };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <ClassDeclaration type={TestModel} />
        </SourceFile>
      </Namespace>
    </Output>,
  );

  assertFileContents(
    res,
    d`
      namespace TestNamespace
      {
          class TestModel
          {

          }
      }
    `,
  );
});

it("renders a class declaration with properties", async () => {
  const { TestModel } = (await runner.compile(`
    @test model TestModel {
      @test Prop1: string;
      @test Prop2: int32;
    }
  `)) as { TestModel: Model };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <ClassDeclaration type={TestModel} />
        </SourceFile>
      </Namespace>
    </Output>,
  );

  assertFileContents(
    res,
    d`
      namespace TestNamespace
      {
          class TestModel
          {
              public string Prop1
              {
                  get;
                  set;
              }
              public int Prop2
              {
                  get;
                  set;
              }
          }
      }
    `,
  );
});

it("can override class name", async () => {
  const { TestModel } = (await runner.compile(`
    @test model TestModel {}
  `)) as { TestModel: Model };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <ClassDeclaration type={TestModel} name="CustomClassName" />
        </SourceFile>
      </Namespace>
    </Output>,
  );

  assertFileContents(
    res,
    d`
      namespace TestNamespace
      {
          class CustomClassName
          {

          }
      }
    `,
  );
});

it("renders a class with access modifiers", async () => {
  const { TestModel } = (await runner.compile(`
    @test model TestModel {
    }
  `)) as { TestModel: Model };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <ClassDeclaration type={TestModel} protected />
        </SourceFile>
      </Namespace>
    </Output>,
  );

  assertFileContents(
    res,
    d`
      namespace TestNamespace
      {
          protected class TestModel
          {

          }
      }
    `,
  );
});

describe("from an interface", () => {
  it("renders an empty class", async () => {
    const { TestInterface } = (await runner.compile(`
    @test interface TestInterface {
    }
  `)) as { TestInterface: Interface };

    const res = render(
      <Output program={runner.program}>
        <Namespace name="TestNamespace">
          <SourceFile path="test.cs">
            <ClassDeclaration type={TestInterface} />
          </SourceFile>
        </Namespace>
      </Output>,
    );

    assertFileContents(
      res,
      d`
      namespace TestNamespace
      {
          class TestInterface
          {

          }
      }
    `,
    );
  });

  it("renders a class with operations", async () => {
    const { TestInterface } = (await runner.compile(`
    @test interface TestInterface {
      op getName(id: string): string;
    }
  `)) as { TestInterface: Interface };

    const res = render(
      <Output program={runner.program} namePolicy={cs.createCSharpNamePolicy()}>
        <Namespace name="TestNamespace">
          <SourceFile path="test.cs">
            <ClassDeclaration type={TestInterface} />
          </SourceFile>
        </Namespace>
      </Output>,
    );

    assertFileContents(
      res,
      d`
      namespace TestNamespace
      {
          class TestInterface
          {
              public abstract string GetName(string id);
          }
      }
    `,
    );
  });
});

it("renders a class with model members", async () => {
  const { TestModel, TestReference } = (await runner.compile(`
    @test model TestReference {
    }
    @test model TestModel {
      @test prop1: TestReference;
    }
  `)) as { TestModel: Model; TestReference: Model };

  const res = render(
    <Output program={runner.program} namePolicy={cs.createCSharpNamePolicy()}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <ClassDeclaration type={TestReference} />
          <hbr />
          <ClassDeclaration type={TestModel} />
        </SourceFile>
      </Namespace>
    </Output>,
  );

  assertFileContents(
    res,
    d`
      namespace TestNamespace
      {
          class TestReference
          {

          }
          class TestModel
          {
              public TestReference Prop1
              {
                  get;
                  set;
              }
          }
      }
    `,
  );
});

it("renders a class with enum members", async () => {
  const { TestModel, TestEnum } = (await runner.compile(`
    @test enum TestEnum {
      Value1;
      Value2;
    }
    @test model TestModel {
      @test prop1: TestEnum;
    }
  `)) as { TestModel: Model; TestEnum: Enum };

  const res = render(
    <Output program={runner.program} namePolicy={cs.createCSharpNamePolicy()}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <EnumDeclaration type={TestEnum} />
          <hbr />
          <ClassDeclaration type={TestModel} />
        </SourceFile>
      </Namespace>
    </Output>,
  );

  assertFileContents(
    res,
    d`
      namespace TestNamespace
      {
          enum TestEnum
          {
              Value1,
              Value2
          }
          class TestModel
          {
              public TestEnum Prop1
              {
                  get;
                  set;
              }
          }
      }
    `,
  );
});

it("renders a class with string enums", async () => {
  const { TestModel, TestEnum } = (await runner.compile(`
    @test enum TestEnum {
      Value1;
      Value2;
    }
    @test model TestModel {
      @test prop1: TestEnum;
    }
  `)) as { TestModel: Model; TestEnum: Enum };

  const res = render(
    <Output program={runner.program} namePolicy={cs.createCSharpNamePolicy()}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <EnumDeclaration type={TestEnum} />
          <hbr />
          <ClassDeclaration type={TestModel} />
        </SourceFile>
      </Namespace>
    </Output>,
  );

  assertFileContents(
    res,
    d`
      namespace TestNamespace
      {
          enum TestEnum
          {
              Value1,
              Value2
          }
          class TestModel
          {
              public TestEnum Prop1
              {
                  get;
                  set;
              }
          }
      }
    `,
  );
});

describe("with doc comments", () => {
  it("renders a model with docs", async () => {
    const { TestModel } = (await runner.compile(`
    @doc("This is a test model")
    @test model TestModel {
      @doc("This is a test property")
        prop1: string;
      }
    
  `)) as { TestModel: Model };

    const res = render(
      <Output program={runner.program} namePolicy={cs.createCSharpNamePolicy()}>
        <Namespace name="TestNamespace">
          <SourceFile path="test.cs">
            <ClassDeclaration type={TestModel} />
          </SourceFile>
        </Namespace>
      </Output>,
    );

    assertFileContents(
      res,
      d`
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
              public string Prop1
              {
                  get;
                  set;
              }
          }
      }
    `,
    );
  });

  it("renders an interface with docs", async () => {
    const { TestInterface } = (await runner.compile(`
    @doc("This is a test interface")
    @test interface TestInterface {
      @doc("This is a test operation")
      @returnsDoc("The name of the item")
      op getName(id: string): string;
    }
  `)) as { TestInterface: Interface };

    const res = render(
      <Output program={runner.program} namePolicy={cs.createCSharpNamePolicy()}>
        <Namespace name="TestNamespace">
          <SourceFile path="test.cs">
            <ClassDeclaration type={TestInterface} />
          </SourceFile>
        </Namespace>
      </Output>,
    );

    assertFileContents(
      res,
      d`
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
    `,
    );
  });
});
