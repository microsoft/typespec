import { Output, render } from "@alloy-js/core";
import { SourceFile } from "@alloy-js/typescript";
import { Namespace } from "@typespec/compiler";
import { format } from "prettier";
import { assert, describe, expect, it } from "vitest";
import { UnionDeclaration } from "../../../src/typescript/components/union-declaration.js";
import { UnionExpression } from "../../../src/typescript/components/union-expression.js";
import { getProgram } from "../test-host.js";

describe("Typescript Union Declaration", () => {
  describe("Union not bound to Typespec Types", () => {
    it("creates a union declaration", async () => {
      const res = render(
        <Output>
          <SourceFile path="test.ts">
            <UnionDeclaration name="MyUnion">"red" | "blue"</UnionDeclaration>
          </SourceFile>
        </Output>,
      );

      const testFile = res.contents.find((file) => file.path === "test.ts");
      assert(testFile, "test.ts file not rendered");
      const actualContent = await format(testFile.contents as string, { parser: "typescript" });
      const expectedContent = await format(`type MyUnion = "red" | "blue"`, {
        parser: "typescript",
      });
      expect(actualContent).toBe(expectedContent);
    });
  });

  describe("Union bound to Typespec Types", () => {
    describe("Bound to Union", () => {
      it("creates a union declaration", async () => {
        const program = await getProgram(`
        namespace DemoService;
        union TestUnion {
          one: "one",
          two: "two"
        }
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const union = Array.from((namespace as Namespace).unions.values())[0];

        const res = render(
          <Output>
            <SourceFile path="test.ts">
              <UnionDeclaration type={union} />
            </SourceFile>
          </Output>,
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(`type TestUnion = "one" | "two"`, {
          parser: "typescript",
        });
        expect(actualContent).toBe(expectedContent);
      });

      it("creates a union declaration with name override", async () => {
        const program = await getProgram(`
        namespace DemoService;
        union TestUnion {
          one: "one",
          two: "two"
        }
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const union = Array.from((namespace as Namespace).unions.values())[0];

        const res = render(
          <Output>
            <SourceFile path="test.ts">
              <UnionDeclaration export type={union} name="MyUnion" />
            </SourceFile>
          </Output>,
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(`export type MyUnion = "one" | "two"`, {
          parser: "typescript",
        });
        expect(actualContent).toBe(expectedContent);
      });

      it("creates a union declaration with extra children", async () => {
        const program = await getProgram(`
        namespace DemoService;
        union TestUnion {
          one: "one",
          two: "two"
        }
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const union = Array.from((namespace as Namespace).unions.values())[0];

        const res = render(
          <Output>
            <SourceFile path="test.ts">
              <UnionDeclaration type={union}>"three"</UnionDeclaration>
            </SourceFile>
          </Output>,
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(`type TestUnion = "one" | "two" | "three"`, {
          parser: "typescript",
        });
        expect(actualContent).toBe(expectedContent);
      });

      it("renders an union expression", async () => {
        const program = await getProgram(`
          namespace DemoService;
          union TestUnion {
            one: "one",
            two: "two"
          }
          `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const union = Array.from((namespace as Namespace).unions.values())[0];

        const res = render(
          <Output>
            <SourceFile path="test.ts">
              let x: <UnionExpression type={union} /> = "one";
            </SourceFile>
          </Output>,
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(`let x:"one" | "two" = "one"`, {
          parser: "typescript",
        });
        expect(actualContent).toBe(expectedContent);
      });
    });

    describe("Bound to Enum", () => {
      it("creates a union declaration", async () => {
        const program = await getProgram(`
        namespace DemoService;
        enum TestEnum {
          one: "one",
          two: "two"
        }
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const union = Array.from((namespace as Namespace).enums.values())[0];

        const res = render(
          <Output>
            <SourceFile path="test.ts">
              <UnionDeclaration type={union} />
            </SourceFile>
          </Output>,
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(`type TestEnum = "one" | "two"`, {
          parser: "typescript",
        });
        expect(actualContent).toBe(expectedContent);
      });
    });
  });
});
