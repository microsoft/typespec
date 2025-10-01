import { Tester } from "#test/test-host.js";
import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getOutput } from "../../test-utils.js";
import { TypeAliasDeclaration } from "./type-alias-declaration.jsx";

describe("Python Declaration equivalency to Type Alias", () => {
  describe("Type Alias Declaration bound to Typespec Scalar", () => {
    describe("Scalar extends utcDateTime", () => {
      it("creates a type alias declaration for a utcDateTime without encoding", async () => {
        const { program, MyDate } = await Tester.compile(t.code`
          scalar ${t.scalar("MyDate")} extends utcDateTime;
        `);

        expect(getOutput(program, [<TypeAliasDeclaration type={MyDate} />])).toRenderTo(`
          from datetime import datetime

          my_date: datetime`);
      });

      it("creates a type alias declaration with doc", async () => {
        const { program, MyDate } = await Tester.compile(t.code`
          /**
           * Type to represent a date
           */
          scalar ${t.scalar("MyDate")} extends utcDateTime;
        `);

        expect(getOutput(program, [<TypeAliasDeclaration type={MyDate} />])).toRenderTo(`
          from datetime import datetime

          # Type to represent a date
          my_date: datetime`);
      });

      it("can override JSDoc", async () => {
        const { program, MyDate } = await Tester.compile(t.code`
          /**
           * Type to represent a date
           */
          scalar ${t.scalar("MyDate")} extends utcDateTime;
        `);

        expect(getOutput(program, [<TypeAliasDeclaration doc={"Overridden Doc"} type={MyDate} />]))
          .toRenderTo(`
          from datetime import datetime

          # Overridden Doc
          my_date: datetime`);
      });

      it("creates a type alias declaration for a utcDateTime with unixTimeStamp encoding", async () => {
        const { program, MyDate } = await Tester.compile(t.code`
          @encode("unixTimestamp", int32)
          scalar ${t.scalar("MyDate")} extends utcDateTime;
        `);

        expect(getOutput(program, [<TypeAliasDeclaration type={MyDate} />])).toRenderTo(`
          from datetime import datetime

          my_date: datetime`);
      });

      it("creates a type alias declaration for a utcDateTime with rfc7231 encoding", async () => {
        const { program, MyDate } = await Tester.compile(t.code`
          @encode("rfc7231")
          scalar ${t.scalar("MyDate")} extends utcDateTime;
        `);

        expect(getOutput(program, [<TypeAliasDeclaration type={MyDate} />])).toRenderTo(`
          from datetime import datetime

          my_date: datetime`);
      });

      it("creates a type alias declaration for a utcDateTime with rfc3339 encoding", async () => {
        const { program, MyDate } = await Tester.compile(t.code`
          @encode("rfc3339")
          scalar ${t.scalar("MyDate")} extends utcDateTime;
        `);

        expect(getOutput(program, [<TypeAliasDeclaration type={MyDate} />])).toRenderTo(`
          from datetime import datetime

          my_date: datetime`);
      });
    });
  });
});
