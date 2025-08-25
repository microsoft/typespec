import { code } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import { SourceFile } from "@alloy-js/typescript";
import type { Namespace } from "@typespec/compiler";
import { describe, expect, it } from "vitest";
import { Output } from "../../../src/core/components/output.jsx";
import { FunctionDeclaration } from "../../../src/typescript/components/function-declaration.js";
import { getProgram } from "../test-host.js";
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
        ).toRenderTo(`function getName(id: string): string {}`);
      });

      it("creates a function with JSDoc", async () => {
        const program = await getProgram(`
        namespace DemoService;
        /**
         * This is a test function
         */
        op getName(
        @doc("This is the id")
        id: string, name: string): string;
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
          /**
           * This is a test function
           *
           * @param {string} id - This is the id
           * @param {string} name
           */
          function getName(id: string, name: string): string {}`);
      });

      it("creates a function with overridden JSDoc", async () => {
        const program = await getProgram(`
        namespace DemoService;
        /**
         * This is a test function
         */
        op getName(id: string): string;`);

        const [namespace] = program.resolveTypeReference("DemoService");
        const operation = Array.from((namespace as Namespace).operations.values())[0];

        expect(
          <Output program={program}>
            <SourceFile path="test.ts">
              <FunctionDeclaration doc={["This is a custom description"]} type={operation} />
            </SourceFile>
          </Output>,
        ).toRenderTo(`
          /**
           * This is a custom description
           *
           * @param {string} id
           */
          function getName(id: string): string {}`);
      });

      it("creates an async function", async () => {
        const program = await getProgram(`
        namespace DemoService;
        op getName(id: string): string;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const operation = Array.from((namespace as Namespace).operations.values())[0];

        expect(
          <Output program={program}>
            <SourceFile path="test.ts">
              <FunctionDeclaration async type={operation} />
            </SourceFile>
          </Output>,
        ).toRenderTo(d`async function getName(id: string): Promise<string> {}`);
      });

      it("exports a function", async () => {
        const program = await getProgram(`
        namespace DemoService;
        op getName(id: string): string;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const operation = Array.from((namespace as Namespace).operations.values())[0];

        expect(
          <Output program={program}>
            <SourceFile path="test.ts">
              <FunctionDeclaration export type={operation} />
            </SourceFile>
          </Output>,
        ).toRenderTo(`export function getName(id: string): string {}`);
      });

      it("can override name", async () => {
        const program = await getProgram(`
        namespace DemoService;
        op getName(id: string): string;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const operation = Array.from((namespace as Namespace).operations.values())[0];

        expect(
          <Output program={program}>
            <SourceFile path="test.ts">
              <FunctionDeclaration name="newName" type={operation} />
            </SourceFile>
          </Output>,
        ).toRenderTo(`function newName(id: string): string {}`);
      });

      it("can append extra parameters with raw params provided", async () => {
        const program = await getProgram(`
        namespace DemoService;
        op createPerson(id: string): string;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const operation = Array.from((namespace as Namespace).operations.values())[0];

        expect(
          <Output program={program}>
            <SourceFile path="test.ts">
              <FunctionDeclaration
                type={operation}
                parameters={[
                  { name: "name", type: "string" },
                  { name: "age", type: "number" },
                ]}
              />
            </SourceFile>
          </Output>,
        ).toRenderTo(`function createPerson(name: string, age: number, id: string): string {}`);
      });

      it.skip("can override parameters with an array of ModelProperties", async () => {
        const program = await getProgram(`
        namespace DemoService;
        op createPerson(id: string): string;

        model Foo {
          name: string;
          age: int32;
        }
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const operation = Array.from((namespace as Namespace).operations.values())[0];
        const model = Array.from((namespace as Namespace).models.values())[0];

        expect(
          <Output program={program}>
            <SourceFile path="test.ts">
              <FunctionDeclaration type={operation}>
                <FunctionDeclaration.Parameters type={model} />
              </FunctionDeclaration>
            </SourceFile>
          </Output>,
        ).toRenderTo(`function createPerson(name: string, age: number): string {}`);
      });

      it("can render function body", async () => {
        const program = await getProgram(`
        namespace DemoService;
        op createPerson(id: string): string;
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const operation = Array.from((namespace as Namespace).operations.values())[0];

        expect(
          <Output program={program}>
            <SourceFile path="test.ts">
              <FunctionDeclaration export type={operation}>
                {code`
                  const message = "Hello World!";
                  console.log(message);
                `}
              </FunctionDeclaration>
            </SourceFile>
          </Output>,
        ).toRenderTo(`
          export function createPerson(id: string): string {
            const message = "Hello World!";
            console.log(message);
          }`);
      });
    });
  });
});
