import { render } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import { Namespace, SourceFile, createCSharpNamePolicy } from "@alloy-js/csharp";
import { Model } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, it } from "vitest";
import { Output } from "../../../src/core/index.js";
import { ClassDeclaration } from "../../../src/csharp/index.js";
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
    <Output program={runner.program} namePolicy={createCSharpNamePolicy()}>
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
          class TestModel;
      }
    `,
  );
});

it("renders a class declaration with properties", async () => {
  const { TestModel } = (await runner.compile(`
    @test model TestModel {
      @test prop1: string;
      @test prop2: int32;
    }
  `)) as { TestModel: Model };

  const res = render(
    <Output program={runner.program} namePolicy={createCSharpNamePolicy()}>
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

it("renders a class with union members");
it("renders a class with enum members");
it("renders a class with private members");
it("renders a class with arbitrary children");
it("can override class name");
it("renders a class with access modifiers");
