import { render } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import * as cs from "@alloy-js/csharp";
import { Namespace, SourceFile } from "@alloy-js/csharp";
import { Operation } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, it } from "vitest";
import { Output } from "../../../src/core/index.js";
import { ClassMethod } from "../../../src/csharp/index.js";
import { createEmitterFrameworkTestRunner } from "../test-host.js";
import { assertFileContents } from "../utils.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createEmitterFrameworkTestRunner();
});

it("renders a void method with no parameters", async () => {
  const { TestOp } = (await runner.compile(`
      @test op TestOp(): void;
    `)) as { TestOp: Operation };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <cs.ClassDeclaration name="TestClass">
            <ClassMethod type={TestOp} public />
          </cs.ClassDeclaration>
        </SourceFile>
      </Namespace>
    </Output>,
  );

  assertFileContents(
    res,
    d`
        namespace TestNamespace
        {
            class TestClass
            {
                public void TestOp() {}
            }
        }
      `,
  );
});

it("renders a method with return type and parameters", async () => {
  const { GetUserById } = (await runner.compile(`
      @test op GetUserById(id: string, includeProfile?: boolean): string;
    `)) as { GetUserById: Operation };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <cs.ClassDeclaration name="TestClass">
            <ClassMethod type={GetUserById} public />
          </cs.ClassDeclaration>
        </SourceFile>
      </Namespace>
    </Output>,
  );

  assertFileContents(
    res,
    d`
        namespace TestNamespace
        {
            class TestClass
            {
                public string GetUserById(string id, bool includeProfile) {}
            }
        }
      `,
  );
});

it("renders an async method with Task return type", async () => {
  const { FetchData } = (await runner.compile(`
      @test op FetchData(): string;
    `)) as { FetchData: Operation };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <cs.ClassDeclaration name="TestClass">
            <ClassMethod type={FetchData} async public />
          </cs.ClassDeclaration>
        </SourceFile>
      </Namespace>
    </Output>,
  );

  assertFileContents(
    res,
    d`
        namespace TestNamespace
        {
            class TestClass
            {
                public async Task<string> FetchData() {}
            }
        }
      `,
  );
});

it("renders an async void method with Task return type", async () => {
  const { ProcessData } = (await runner.compile(`
      @test op ProcessData(): void;
    `)) as { ProcessData: Operation };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <cs.ClassDeclaration name="TestClass">
            <ClassMethod type={ProcessData} async public />
          </cs.ClassDeclaration>
        </SourceFile>
      </Namespace>
    </Output>,
  );

  assertFileContents(
    res,
    d`
        namespace TestNamespace
        {
            class TestClass
            {
                public async Task ProcessData() {}
            }
        }
      `,
  );
});

it("renders a method with custom name", async () => {
  const { SomeMethod } = (await runner.compile(`
      @test op SomeMethod(): string;
    `)) as { SomeMethod: Operation };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <cs.ClassDeclaration name="TestClass">
            <ClassMethod type={SomeMethod} name="CustomMethodName" public />
          </cs.ClassDeclaration>
        </SourceFile>
      </Namespace>
    </Output>,
  );

  assertFileContents(
    res,
    d`
        namespace TestNamespace
        {
            class TestClass
            {
                public string CustomMethodName() {}
            }
        }
      `,
  );
});

it("renders an abstract method", async () => {
  const { AbstractMethod } = (await runner.compile(`
      @test op AbstractMethod(data: string): boolean;
    `)) as { AbstractMethod: Operation };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <cs.ClassDeclaration name="TestClass" abstract>
            <ClassMethod type={AbstractMethod} abstract public />
          </cs.ClassDeclaration>
        </SourceFile>
      </Namespace>
    </Output>,
  );

  assertFileContents(
    res,
    d`
        namespace TestNamespace
        {
            abstract class TestClass
            {
                public abstract bool AbstractMethod(string data);
            }
        }
      `,
  );
});

it("renders a method with body content", async () => {
  const { Calculate } = (await runner.compile(`
      @test op Calculate(x: int32, y: int32): int32;
    `)) as { Calculate: Operation };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <cs.ClassDeclaration name="TestClass">
            <ClassMethod type={Calculate} public>
              return x + y;
            </ClassMethod>
          </cs.ClassDeclaration>
        </SourceFile>
      </Namespace>
    </Output>,
  );

  assertFileContents(
    res,
    d`
        namespace TestNamespace
        {
            class TestClass
            {
                public int Calculate(int x, int y)
                {
                    return x + y;
                }
            }
        }
      `,
  );
});

it("renders a method with docs", async () => {
  const { GetInfo } = (await runner.compile(`
      @doc("Gets information.")
      @test op GetInfo(): string;
    `)) as { GetInfo: Operation };

  const res = render(
    <Output program={runner.program}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <cs.ClassDeclaration name="TestClass">
            <ClassMethod type={GetInfo} public />
          </cs.ClassDeclaration>
        </SourceFile>
      </Namespace>
    </Output>,
  );

  assertFileContents(
    res,
    d`
        namespace TestNamespace
        {
            class TestClass
            {
                /// <summary>
                /// Gets information.
                /// </summary>
                public string GetInfo() {}
            }
        }
      `,
  );
});
