import { SourceFile } from "@alloy-js/python";
import type { Namespace } from "@typespec/compiler";
import { describe, expect, it } from "vitest";
import { Output } from "../../../../src/core/components/output.jsx";
import { getProgram } from "../../test-host.js";
import { getExternals } from "../../test-utils.js";
import { TypeAliasDeclaration } from "./type-alias-declaration.jsx";

describe("Python Declaration equivalency to Type Alias", () => {
  describe("Type Alias Declaration bound to Typespec Scalar", () => {
    describe("Scalar extends utcDateTime", () => {
      it("creates a type alias declaration for a utcDateTime without encoding", async () => {
        const program = await getProgram(`
        namespace DemoService;
        scalar MyDate extends utcDateTime;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const scalar = Array.from((namespace as Namespace).scalars.values())[0];

        expect(
          <Output program={program} externals={getExternals()}>
            <SourceFile path="test.py">
              <TypeAliasDeclaration type={scalar} />
            </SourceFile>
          </Output>,
        ).toRenderTo(`
          from datetime import datetime

          MyDate: datetime`);
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
          <Output program={program} externals={getExternals()}>
            <SourceFile path="test.py">
              <TypeAliasDeclaration type={scalar} />
            </SourceFile>
          </Output>,
        ).toRenderTo(`
          from datetime import datetime

          # Type to represent a date
          MyDate: datetime`);
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
          <Output program={program} externals={getExternals()}>
            <SourceFile path="test.py">
              <TypeAliasDeclaration doc={"Overridden Doc"} type={scalar} />
            </SourceFile>
          </Output>,
        ).toRenderTo(`
          from datetime import datetime

          # Overridden Doc
          MyDate: datetime`);
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
          <Output program={program} externals={getExternals()}>
            <SourceFile path="test.py">
              <TypeAliasDeclaration type={scalar} />
            </SourceFile>
          </Output>,
        ).toRenderTo(`
          from datetime import datetime

          MyDate: datetime`);
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
          <Output program={program} externals={getExternals()}>
            <SourceFile path="test.py">
              <TypeAliasDeclaration type={scalar} />
            </SourceFile>
          </Output>,
        ).toRenderTo(`
          from datetime import datetime

          MyDate: datetime`);
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
          <Output program={program} externals={getExternals()}>
            <SourceFile path="test.py">
              <TypeAliasDeclaration type={scalar} />
            </SourceFile>
          </Output>,
        ).toRenderTo(`
          from datetime import datetime

          MyDate: datetime`);
      });
    });
  });
});
