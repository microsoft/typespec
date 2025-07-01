import { render } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import * as cs from "@alloy-js/csharp";
import { Namespace, SourceFile } from "@alloy-js/csharp";
import type { Enum } from "@typespec/compiler";
import type { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, it } from "vitest";
import { Output } from "../../../src/core/index.js";
import { EnumDeclaration } from "../../../src/csharp/index.js";
import { createEmitterFrameworkTestRunner } from "../test-host.js";
import { assertFileContents } from "../utils.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createEmitterFrameworkTestRunner();
});

it("renders a basic enum declaration", async () => {
  const { TestEnum } = (await runner.compile(`
    @test enum TestEnum {
      Value1;
      Value2;
      Value3;
    }
  `)) as { TestEnum: Enum };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <EnumDeclaration type={TestEnum} />
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
              Value2,
              Value3
          }
      }
    `,
  );
});

it("renders an empty enum declaration", async () => {
  const { TestEnum } = (await runner.compile(`
    @test enum TestEnum {}
  `)) as { TestEnum: Enum };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <EnumDeclaration type={TestEnum} />
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

          }
      }
    `,
  );
});

it("can override enum name", async () => {
  const { TestEnum } = (await runner.compile(`
    @test enum TestEnum {
      Value1;
      Value2;
    }
  `)) as { TestEnum: Enum };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <EnumDeclaration type={TestEnum} name="CustomEnumName" />
        </SourceFile>
      </Namespace>
    </Output>,
  );

  assertFileContents(
    res,
    d`
      namespace TestNamespace
      {
          enum CustomEnumName
          {
              Value1,
              Value2
          }
      }
    `,
  );
});

it("renders an enum with access modifiers", async () => {
  const { TestEnum } = (await runner.compile(`
    @test enum TestEnum {
      Value1;
      Value2;
    }
  `)) as { TestEnum: Enum };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <EnumDeclaration type={TestEnum} internal />
        </SourceFile>
      </Namespace>
    </Output>,
  );

  assertFileContents(
    res,
    d`
      namespace TestNamespace
      {
          internal enum TestEnum
          {
              Value1,
              Value2
          }
      }
    `,
  );
});

it("renders enum with C# naming conventions", async () => {
  const { TestEnum } = (await runner.compile(`
    @test enum TestEnum {
      value_one;
      value_two;
      value_three;
    }
  `)) as { TestEnum: Enum };

  const res = render(
    <Output program={runner.program} namePolicy={cs.createCSharpNamePolicy()}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <EnumDeclaration type={TestEnum} />
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
              ValueOne,
              ValueTwo,
              ValueThree
          }
      }
    `,
  );
});

it("renders enum with single value", async () => {
  const { TestEnum } = (await runner.compile(`
    @test enum TestEnum {
      OnlyValue;
    }
  `)) as { TestEnum: Enum };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <EnumDeclaration type={TestEnum} />
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
              OnlyValue
          }
      }
    `,
  );
});

it("renders enum with numeric-like member names", async () => {
  const { TestEnum } = (await runner.compile(`
    @test enum TestEnum {
      Value0;
      Value1;
      Value10;
      Value100;
    }
  `)) as { TestEnum: Enum };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <EnumDeclaration type={TestEnum} />
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
              Value0,
              Value1,
              Value10,
              Value100
          }
      }
    `,
  );
});

it("renders multiple enums in the same namespace", async () => {
  const { TestEnum1, TestEnum2 } = (await runner.compile(`
    @test enum TestEnum1 {
      Value1;
      Value2;
    }
    @test enum TestEnum2 {
      OptionA;
      OptionB;
      OptionC;
    }
  `)) as { TestEnum1: Enum; TestEnum2: Enum };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <EnumDeclaration type={TestEnum1} />
          <hbr />
          <EnumDeclaration type={TestEnum2} />
        </SourceFile>
      </Namespace>
    </Output>,
  );

  assertFileContents(
    res,
    d`
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
    `,
  );
});

it("renders an enum with doc comments", async () => {
  const { TestEnum } = (await runner.compile(`
    @test enum TestEnum {
      @doc("This is value one")
      Value1;
      /** This is value two */
      Value2;
    }
  `)) as { TestEnum: Enum };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <EnumDeclaration type={TestEnum} />
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
    `,
  );
});
