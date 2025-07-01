import { render } from "@alloy-js/core";
import { SourceFile } from "@alloy-js/typescript";
import type { Namespace, Operation } from "@typespec/compiler";
import { format } from "prettier";
import { assert, describe, expect, it } from "vitest";
import { Output } from "../../../src/core/components/output.jsx";
import { TypeAliasDeclaration } from "../../../src/typescript/components/type-alias-declaration.jsx";
import { assertFileContents } from "../../utils.js";
import { createEmitterFrameworkTestRunner, getProgram } from "../test-host.js";

describe("Typescript Type Alias Declaration", () => {
  describe("Type Alias bound to Typespec Scalar", () => {
    describe("Scalar extends utcDateTime", () => {
      it("creates a type alias declaration for a utcDateTime without encoding", async () => {
        const program = await getProgram(`
        namespace DemoService;
        scalar MyDate extends utcDateTime;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const scalar = Array.from((namespace as Namespace).scalars.values())[0];

        const res = render(
          <Output program={program}>
            <SourceFile path="test.ts">
              <TypeAliasDeclaration type={scalar} />
            </SourceFile>
          </Output>,
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(`type MyDate = Date;`, {
          parser: "typescript",
        });
        expect(actualContent).toBe(expectedContent);
      });

      it("creates a type alias declaration with JSDoc", async () => {
        const program = await getProgram(`
        namespace DemoService;
        /**
         * Type to represent a date
         */
        scalar MyDate extends utcDateTime;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const scalar = Array.from((namespace as Namespace).scalars.values())[0];

        const res = render(
          <Output program={program}>
            <SourceFile path="test.ts">
              <TypeAliasDeclaration type={scalar} />
            </SourceFile>
          </Output>,
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(
          `
          /**
           * Type to represent a date
           */
          type MyDate = Date;`,
          {
            parser: "typescript",
          },
        );
        expect(actualContent).toBe(expectedContent);
      });

      it("can override JSDoc", async () => {
        const program = await getProgram(`
        namespace DemoService;
        /**
         * Type to represent a date
         */
        scalar MyDate extends utcDateTime;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const scalar = Array.from((namespace as Namespace).scalars.values())[0];

        const res = render(
          <Output program={program}>
            <SourceFile path="test.ts">
              <TypeAliasDeclaration doc={"Overridden Doc"} type={scalar} />
            </SourceFile>
          </Output>,
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(
          `
          /**
           * Overridden Doc
           */
          type MyDate = Date;`,
          {
            parser: "typescript",
          },
        );
        expect(actualContent).toBe(expectedContent);
      });

      it("creates a type alias declaration for a utcDateTime with unixTimeStamp encoding", async () => {
        const program = await getProgram(`
        namespace DemoService;
        @encode("unixTimestamp", int32)
        scalar MyDate extends utcDateTime;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const scalar = Array.from((namespace as Namespace).scalars.values())[0];

        const res = render(
          <Output program={program}>
            <SourceFile path="test.ts">
              <TypeAliasDeclaration type={scalar} />
            </SourceFile>
          </Output>,
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(`type MyDate = Date;`, {
          parser: "typescript",
        });
        expect(actualContent).toBe(expectedContent);
      });

      it("creates a type alias declaration for a utcDateTime with rfc7231 encoding", async () => {
        const program = await getProgram(`
        namespace DemoService;
        @encode("rfc7231")
        scalar MyDate extends utcDateTime;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const scalar = Array.from((namespace as Namespace).scalars.values())[0];

        const res = render(
          <Output program={program}>
            <SourceFile path="test.ts">
              <TypeAliasDeclaration type={scalar} />
            </SourceFile>
          </Output>,
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(`type MyDate = Date;`, {
          parser: "typescript",
        });
        expect(actualContent).toBe(expectedContent);
      });

      it("creates a type alias declaration for a utcDateTime with rfc3339 encoding", async () => {
        const program = await getProgram(`
        namespace DemoService;
        @encode("rfc3339")
        scalar MyDate extends utcDateTime;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const scalar = Array.from((namespace as Namespace).scalars.values())[0];

        const res = render(
          <Output program={program}>
            <SourceFile path="test.ts">
              <TypeAliasDeclaration export type={scalar} />
            </SourceFile>
          </Output>,
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(`export type MyDate = Date;`, {
          parser: "typescript",
        });
        expect(actualContent).toBe(expectedContent);
      });
    });
  });

  it("creates a type alias of a function", async () => {
    const runner = await createEmitterFrameworkTestRunner();
    const { getName } = (await runner.compile(`
      @test op getName(id: string): string;
    `)) as { getName: Operation };

    const res = render(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <TypeAliasDeclaration type={getName} />
        </SourceFile>
      </Output>,
    );

    assertFileContents(res, "type getName = (id: string) => string;");
  });
});
