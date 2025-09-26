import type { Namespace } from "@typespec/compiler";
import { describe, expect, it } from "vitest";
import { getProgram } from "../../test-host.js";
import { getOutput } from "../../test-utils.js";
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

        expect(getOutput(program, [<TypeAliasDeclaration type={scalar} />])).toRenderTo(`
          from datetime import datetime

          my_date: datetime`);
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

        expect(getOutput(program, [<TypeAliasDeclaration type={scalar} />])).toRenderTo(`
          from datetime import datetime

          # Type to represent a date
          my_date: datetime`);
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

        expect(getOutput(program, [<TypeAliasDeclaration doc={"Overridden Doc"} type={scalar} />]))
          .toRenderTo(`
          from datetime import datetime

          # Overridden Doc
          my_date: datetime`);
      });

      it("creates a type alias declaration for a utcDateTime with unixTimeStamp encoding", async () => {
        const program = await getProgram(`
        namespace DemoService;
        @encode("unixTimestamp", int32)
        scalar MyDate extends utcDateTime;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const scalar = Array.from((namespace as Namespace).scalars.values())[0];

        expect(getOutput(program, [<TypeAliasDeclaration type={scalar} />])).toRenderTo(`
          from datetime import datetime

          my_date: datetime`);
      });

      it("creates a type alias declaration for a utcDateTime with rfc7231 encoding", async () => {
        const program = await getProgram(`
        namespace DemoService;
        @encode("rfc7231")
        scalar MyDate extends utcDateTime;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const scalar = Array.from((namespace as Namespace).scalars.values())[0];

        expect(getOutput(program, [<TypeAliasDeclaration type={scalar} />])).toRenderTo(`
          from datetime import datetime

          my_date: datetime`);
      });

      it("creates a type alias declaration for a utcDateTime with rfc3339 encoding", async () => {
        const program = await getProgram(`
        namespace DemoService;
        @encode("rfc3339")
        scalar MyDate extends utcDateTime;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const scalar = Array.from((namespace as Namespace).scalars.values())[0];

        expect(getOutput(program, [<TypeAliasDeclaration type={scalar} />])).toRenderTo(`
          from datetime import datetime

          my_date: datetime`);
      });
    });
  });
});
