import { getProgram } from "#test/utils.js";
import { d } from "@alloy-js/core/testing";
import { ClassDeclaration, SourceFile } from "@alloy-js/typescript";
import type { Namespace } from "@typespec/compiler";
import { describe, expect, it } from "vitest";
import { Output } from "../../../src/core/components/output.jsx";
import { ClassMethod } from "../../../src/typescript/components/class-method.jsx";
import { TypeExpression } from "../../../src/typescript/components/type-expression.jsx";

describe("ClassMethod bound to Typespec Types", () => {
  describe("Bound to Operation", () => {
    it("creates a class method", async () => {
      const program = await getProgram(`
      namespace DemoService;
      op getName(id: string): string;
      `);

      const [namespace] = program.resolveTypeReference("DemoService");
      const operation = Array.from((namespace as Namespace).operations.values())[0];

      expect(
        <Output program={program}>
          <SourceFile path="test.ts">
            <ClassDeclaration name="TestClient">
              <ClassMethod type={operation} />
            </ClassDeclaration>
          </SourceFile>
        </Output>,
      ).toRenderTo(d`
        class TestClient {
          getName(id: string): string {}
        }
      `);
    });

    it("creates an async class method with Promise return type", async () => {
      const program = await getProgram(`
      namespace DemoService;
      op getName(id: string): string;
      `);

      const [namespace] = program.resolveTypeReference("DemoService");
      const operation = Array.from((namespace as Namespace).operations.values())[0];

      expect(
        <Output program={program}>
          <SourceFile path="test.ts">
            <ClassDeclaration name="TestClient">
              <ClassMethod async type={operation} />
            </ClassDeclaration>
          </SourceFile>
        </Output>,
      ).toRenderTo(d`
        class TestClient {
          async getName(id: string): Promise<string> {}
        }
      `);
    });

    it("respects custom returnType and wraps in Promise when async", async () => {
      const program = await getProgram(`
      namespace DemoService;
      op getName(id: string): string;
      `);

      const [namespace] = program.resolveTypeReference("DemoService");
      const operation = Array.from((namespace as Namespace).operations.values())[0];

      expect(
        <Output program={program}>
          <SourceFile path="test.ts">
            <ClassDeclaration name="TestClient">
              <ClassMethod
                async
                type={operation}
                returnType={<TypeExpression type={operation.returnType} />}
              />
            </ClassDeclaration>
          </SourceFile>
        </Output>,
      ).toRenderTo(d`
        class TestClient {
          async getName(id: string): Promise<string> {}
        }
      `);
    });

    it("omits return type when returnType is null", async () => {
      const program = await getProgram(`
      namespace DemoService;
      op getName(id: string): string;
      `);

      const [namespace] = program.resolveTypeReference("DemoService");
      const operation = Array.from((namespace as Namespace).operations.values())[0];

      expect(
        <Output program={program}>
          <SourceFile path="test.ts">
            <ClassDeclaration name="TestClient">
              <ClassMethod type={operation} returnType={null} />
            </ClassDeclaration>
          </SourceFile>
        </Output>,
      ).toRenderTo(d`
        class TestClient {
          getName(id: string) {}
        }
      `);
    });
  });
});
