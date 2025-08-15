import { SourceFile } from "@alloy-js/typescript";
import type { Namespace, Operation } from "@typespec/compiler";
import { describe, expect, it } from "vitest";
import { Output } from "../../../src/core/components/output.jsx";
import { TypeAliasDeclaration } from "../../../src/typescript/components/type-alias-declaration.jsx";
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

        expect(
          <Output program={program}>
            <SourceFile path="test.ts">
              <TypeAliasDeclaration type={scalar} />
            </SourceFile>
          </Output>,
        ).toRenderTo(`type MyDate = Date;`);
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

        expect(
          <Output program={program}>
            <SourceFile path="test.ts">
              <TypeAliasDeclaration type={scalar} />
            </SourceFile>
          </Output>,
        ).toRenderTo(`
          /**
           * Type to represent a date
           */
          type MyDate = Date;`);
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

        expect(
          <Output program={program}>
            <SourceFile path="test.ts">
              <TypeAliasDeclaration doc={"Overridden Doc"} type={scalar} />
            </SourceFile>
          </Output>,
        ).toRenderTo(`
          /**
           * Overridden Doc
           */
          type MyDate = Date;`);
      });

      it("creates a type alias declaration for a utcDateTime with unixTimeStamp encoding", async () => {
        const program = await getProgram(`
        namespace DemoService;
        @encode("unixTimestamp", int32)
        scalar MyDate extends utcDateTime;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const scalar = Array.from((namespace as Namespace).scalars.values())[0];

        expect(
          <Output program={program}>
            <SourceFile path="test.ts">
              <TypeAliasDeclaration type={scalar} />
            </SourceFile>
          </Output>,
        ).toRenderTo(`type MyDate = Date;`);
      });

      it("creates a type alias declaration for a utcDateTime with rfc7231 encoding", async () => {
        const program = await getProgram(`
        namespace DemoService;
        @encode("rfc7231")
        scalar MyDate extends utcDateTime;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const scalar = Array.from((namespace as Namespace).scalars.values())[0];

        expect(
          <Output program={program}>
            <SourceFile path="test.ts">
              <TypeAliasDeclaration type={scalar} />
            </SourceFile>
          </Output>,
        ).toRenderTo(`type MyDate = Date;`);
      });

      it("creates a type alias declaration for a utcDateTime with rfc3339 encoding", async () => {
        const program = await getProgram(`
        namespace DemoService;
        @encode("rfc3339")
        scalar MyDate extends utcDateTime;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const scalar = Array.from((namespace as Namespace).scalars.values())[0];

        expect(
          <Output program={program}>
            <SourceFile path="test.ts">
              <TypeAliasDeclaration export type={scalar} />
            </SourceFile>
          </Output>,
        ).toRenderTo(`export type MyDate = Date;`);
      });
    });
  });

  it("creates a type alias of a function", async () => {
    const runner = await createEmitterFrameworkTestRunner();
    const { getName } = (await runner.compile(`
      @test op getName(id: string): string;
    `)) as { getName: Operation };

    expect(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <TypeAliasDeclaration type={getName} />
        </SourceFile>
      </Output>,
    ).toRenderTo("type getName = (id: string) => string;");
  });
});
