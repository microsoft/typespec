import { Tester } from "#test/test-host.js";
import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getOutput } from "../../test-utils.js";
import { FunctionDeclaration } from "./function-declaration.jsx";

describe("Typescript Function Declaration", () => {
  describe("Function bound to Typespec Types", () => {
    describe("Bound to Operation", () => {
      it("creates a function", async () => {
        const { program, getName } = await Tester.compile(t.code`
          op ${t.op("getName")}(id: string): string;
        `);

        expect(getOutput(program, [<FunctionDeclaration type={getName} />])).toRenderTo(`
          def get_name(id: str) -> str:
            pass
          
          `);
      });
    });
  });
});
