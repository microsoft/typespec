import { SourceFile } from "@alloy-js/typescript";
import type { Namespace } from "@typespec/compiler";
import { describe, expect, it } from "vitest";
import { Output } from "../../../../src/core/components/output.jsx";
import { getProgram } from "../../test-host.js";
import { FunctionDeclaration } from "./function-declaration.jsx";
describe("Typescript Function Declaration", () => {
  describe("Function bound to Typespec Types", () => {
    describe("Bound to Operation", () => {
      it("creates a function", async () => {
        const program = await getProgram(`
        namespace DemoService;
        op getName(id: string): string;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const operation = Array.from((namespace as Namespace).operations.values())[0];

        expect(
          <Output program={program}>
            <SourceFile path="test.ts">
              <FunctionDeclaration type={operation} />
            </SourceFile>
          </Output>,
        ).toRenderTo(`
          def get_name(id: str) -> str:
            pass
          
          `);
      });
    });
  });
});
