import { InterfaceDeclaration } from "../../../src/typescript/components/interface-declaration.js";

import { Output, render } from "@alloy-js/core";
import { SourceFile } from "@alloy-js/typescript";
import { Namespace } from "@typespec/compiler";
import { format } from "prettier";
import { assert, describe, expect, it } from "vitest";
import { getProgram } from "../test-host.js";

describe("Typescript Interface", () => {
  describe("Interface bound to Typespec Types", () => {
    describe("Bound to Model", () => {
      it("handles a type reference to a union variant", async () => {
        const program = await getProgram(`
          namespace DemoService;

          union Color {
            red: "RED",
            blue: "BLUE"
          }
      
          model Widget{
            id: string;
            weight: int32;
            color: Color.blue
          }
          `);

          const [namespace] = program.resolveTypeReference("DemoService");
          const models = Array.from((namespace as Namespace).models.values());
  
          let res = render(
            <Output>
              <SourceFile path="test.ts">
                <InterfaceDeclaration type={models[0]} />
              </SourceFile>
            </Output>
          );
  
          const testFile = res.contents.find((file) => file.path === "test.ts");
          assert(testFile, "test.ts file not rendered");
          const actualContent = await format(testFile.contents as string, { parser: "typescript" });
          const expectedContent = await format(`interface Widget {
              id: string;
              weight: number;
              color: "BLUE";
            }`, {
            parser: "typescript",
          });
          expect(actualContent).toBe(expectedContent);

      });
      it("creates an interface", async () => {
        const program = await getProgram(`
        namespace DemoService;
    
        model Widget{
          id: string;
          weight: int32;
          color: "blue" | "red";
        }
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const models = Array.from((namespace as Namespace).models.values());

        let res = render(
          <Output>
            <SourceFile path="test.ts">
              <InterfaceDeclaration type={models[0]} />
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(`interface Widget {
            id: string;
            weight: number;
            color: "blue" | "red";
          }`, {
          parser: "typescript",
        });
        expect(actualContent).toBe(expectedContent);
      });

      it("can override interface name", async () => {
        const program = await getProgram(`
        namespace DemoService;
    
        model Widget{
          id: string;
          weight: int32;
          color: "blue" | "red";
        }
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const models = Array.from((namespace as Namespace).models.values());

        let res = render(
          <Output>
            <SourceFile path="test.ts">
              <InterfaceDeclaration export name="MyOperations" type={models[0]} />
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(
          `export interface MyOperations {
          id: string;
          weight: number;
          color: "blue" | "red";
         }`,
          {
            parser: "typescript",
          }
        );
        expect(actualContent).toBe(expectedContent);
      });

      it("can add a members to the interface", async () => {
        const program = await getProgram(`
        namespace DemoService;
    
        model Widget{
          id: string;
          weight: int32;
          color: "blue" | "red";
        }
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const models = Array.from((namespace as Namespace).models.values());

        let res = render(
          <Output>
            <SourceFile path="test.ts">
              <InterfaceDeclaration export name="MyOperations" type={models[0]}>
                customProperty: string; 
                customMethod(): void;
              </InterfaceDeclaration>
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(
          `export interface MyOperations {
          id: string;
          weight: number;
          color: "blue" | "red";
          customProperty: string;
          customMethod(): void;
        }`,
          {
            parser: "typescript",
          }
        );
        expect(actualContent).toBe(expectedContent);
      });

      it("interface name can be customized", async () => {
        const program = await getProgram(`
        namespace DemoService;
    
        model Widget{
          id: string;
          weight: int32;
          color: "blue" | "red";
        }
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const models = Array.from((namespace as Namespace).models.values());

        let res = render(
          <Output>
            <SourceFile path="test.ts">
              <InterfaceDeclaration export name="MyModel" type={models[0]} />
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(
          `export interface MyModel {
            id: string;
            weight: number;
            color: "blue" | "red";
        }`,
          {
            parser: "typescript",
          }
        );
        expect(actualContent).toBe(expectedContent);
      });

      it("interface with extends", async () => {
        const program = await getProgram(`
        namespace DemoService;
    
        model Widget{
          id: string;
          weight: int32;
          color: "blue" | "red";
        }
        
        model ErrorWidget extends Widget {
          code: int32;
          message: string;
        }
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const models = Array.from((namespace as Namespace).models.values());

        let res = render(
          <Output>
            <SourceFile path="test.ts">
              {models.map((model) => (
                <InterfaceDeclaration export type={model} />
              ))}
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(
          `export interface Widget {
            id: string;
            weight: number;
            color: "blue" | "red";
          }
          export interface ErrorWidget extends Widget {
            code: number;
            message: string;
          }`,
          {
            parser: "typescript",
          }
        );
        expect(actualContent).toBe(expectedContent);
      });
    });

    describe.skip("Bound to Interface", () => {
      it("creates an interface", async () => {
        const program = await getProgram(`
        namespace DemoService;
    
        interface WidgetOperations {
          op getName(id: string): string;
        }
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const interfaces = Array.from((namespace as Namespace).interfaces.values());

        let res = render(
          <Output>
            <SourceFile path="test.ts">
              <InterfaceDeclaration export type={interfaces[0]} />
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(
          `export interface WidgetOperations {
          getName(id: string): string;
        }`,
          {
            parser: "typescript",
          }
        );
        expect(actualContent).toBe(expectedContent);
      });

      it("should handle spread and non spread model parameters", async () => {
        const program = await getProgram(`
        namespace DemoService;

        model Foo {
          name: string
        }
    
        interface WidgetOperations {
          op getName(foo: Foo): string;
          op getOtherName(...Foo): string
        }
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const interfaces = Array.from((namespace as Namespace).interfaces.values());
        const models = Array.from((namespace as Namespace).models.values());

        let res = render(
          <Output>
            <SourceFile path="test.ts">
              <InterfaceDeclaration export type={interfaces[0]} />
              <InterfaceDeclaration export type={models[0]} />
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(
          `export interface WidgetOperations {
          getName(foo: Foo): string;
          getOtherName(name: string): string
        }
        export interface Foo {
          name: string;
        }  
        `,
          {
            parser: "typescript",
          }
        );
        expect(actualContent).toBe(expectedContent);
      });

      it("creates an interface with Model references", async () => {
        const program = await getProgram(`
        namespace DemoService;
    
        interface WidgetOperations {
          op getName(id: string): Widget;
        }

        model Widget {
          id: string;
          weight: int32;
          color: "blue" | "red";
        }
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const interfaces = Array.from((namespace as Namespace).interfaces.values());
        const models = Array.from((namespace as Namespace).models.values());

        let res = render(
          <Output>
            <SourceFile path="test.ts">
              <InterfaceDeclaration export type={interfaces[0]} />
              {models.map((model) => (
                <InterfaceDeclaration export type={model} />
              ))}
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(
          `export interface WidgetOperations {
          getName(id: string): Widget;
        }
        export interface Widget {
          id: string;
          weight: number;
          color: "blue" | "red";
        }`,
          {
            parser: "typescript",
          }
        );
        expect(actualContent).toBe(expectedContent);
      });

      it("creates an interface that extends another", async () => {
        const program = await getProgram(`
        namespace DemoService;
    
        interface WidgetOperations {
          op getName(id: string): Widget;
        }

        interface WidgetOperationsExtended extends WidgetOperations{
          op delete(id: string): void;
        }

        model Widget {
          id: string;
          weight: int32;
          color: "blue" | "red";
        }
        `);

        const [namespace] = program.resolveTypeReference("DemoService");
        const interfaces = Array.from((namespace as Namespace).interfaces.values());
        const models = Array.from((namespace as Namespace).models.values());

        let res = render(
          <Output>
            <SourceFile path="test.ts">
              <InterfaceDeclaration export type={interfaces[1]} />
              {models.map((model) => (
                <InterfaceDeclaration export type={model} />
              ))}
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = await format(testFile.contents as string, { parser: "typescript" });
        const expectedContent = await format(
          `export interface WidgetOperationsExtended {
          getName(id: string): Widget;
          delete(id: string): void;
        }
        export interface Widget {
          id: string;
          weight: number;
          color: "blue" | "red";
        }`,
          {
            parser: "typescript",
          }
        );
        expect(actualContent).toBe(expectedContent);
      });
    });
  });
});
