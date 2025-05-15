import { render } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import { SourceFile } from "@alloy-js/typescript";
import { Enum, Union } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, it } from "vitest";
import { Output } from "../../../src/core/components/output.jsx";
import { UnionDeclaration } from "../../../src/typescript/components/union-declaration.js";
import { UnionExpression } from "../../../src/typescript/components/union-expression.js";
import { assertFileContents } from "../../utils.js";
import { createEmitterFrameworkTestRunner } from "../test-host.js";

describe("Typescript Union Declaration", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createEmitterFrameworkTestRunner();
  });

  describe("Union not bound to Typespec Types", () => {
    // TODO: clean up this test
    it("creates a union declaration", async () => {
      await runner.compile(``);
      const res = render(
        <Output program={runner.program}>
          <SourceFile path="test.ts">
            <UnionDeclaration name="MyUnion">"red" | "blue"</UnionDeclaration>
          </SourceFile>
        </Output>,
      );

      assertFileContents(
        res,
        d`
          type MyUnion = "red" | "blue";
        `,
      );
    });
  });

  describe("Union bound to Typespec Types", () => {
    describe("Bound to Union", () => {
      it("creates a union declaration", async () => {
        const { TestUnion } = (await runner.compile(`
          namespace DemoService;
          @test union TestUnion {
            one: "one",
            two: "two"
          }
        `)) as { TestUnion: Union };

        const res = render(
          <Output program={runner.program}>
            <SourceFile path="test.ts">
              <UnionDeclaration type={TestUnion} />
            </SourceFile>
          </Output>,
        );

        assertFileContents(
          res,
          d`
            type TestUnion = "one" | "two";
          `,
        );
      });

      it("creates a union declaration with name override", async () => {
        const { TestUnion } = (await runner.compile(`
          namespace DemoService;
          @test union TestUnion {
            one: "one",
            two: "two"
          }
        `)) as { TestUnion: Union };

        const res = render(
          <Output program={runner.program}>
            <SourceFile path="test.ts">
              <UnionDeclaration export type={TestUnion} name="MyUnion" />
            </SourceFile>
          </Output>,
        );

        assertFileContents(
          res,
          d`
            export type MyUnion = "one" | "two";
          `,
        );
      });

      it("creates a union declaration with extra children", async () => {
        const { TestUnion } = (await runner.compile(`
          namespace DemoService;
          @test union TestUnion {
            one: "one",
            two: "two"
          }
        `)) as { TestUnion: Union };

        const res = render(
          <Output program={runner.program}>
            <SourceFile path="test.ts">
              <UnionDeclaration type={TestUnion}>"three"</UnionDeclaration>
            </SourceFile>
          </Output>,
        );

        assertFileContents(
          res,
          d`
            type TestUnion = "one" | "two" | "three";
          `,
        );
      });

      it("renders a union expression", async () => {
        const { TestUnion } = (await runner.compile(`
          namespace DemoService;
          @test union TestUnion {
            one: "one",
            two: "two"
          }
        `)) as { TestUnion: Union };

        const res = render(
          <Output program={runner.program}>
            <SourceFile path="test.ts">
              let x: <UnionExpression type={TestUnion} /> = "one";
            </SourceFile>
          </Output>,
        );

        assertFileContents(
          res,
          d`
            let x: "one" | "two" = "one";
          `,
        );
      });
    });

    describe("Bound to Enum", () => {
      it("creates a union declaration", async () => {
        const { TestEnum } = (await runner.compile(`
          namespace DemoService;
          @test enum TestEnum {
            one: "one",
            two: "two"
          }
        `)) as { TestEnum: Enum };

        const res = render(
          <Output program={runner.program}>
            <SourceFile path="test.ts">
              <UnionDeclaration type={TestEnum} />
            </SourceFile>
          </Output>,
        );

        assertFileContents(
          res,
          d`
            type TestEnum = "one" | "two";
          `,
        );
      });
    });
  });
});
