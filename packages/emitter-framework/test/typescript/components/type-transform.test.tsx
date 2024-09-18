import { code, Output, render } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import * as ts from "@alloy-js/typescript";
import { SourceFile } from "@alloy-js/typescript";
import { Model } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { ArraySerializer, DateDeserializer, RecordSerializer } from "../../../src/typescript/components/static-serializers.js";
import {
  getTypeTransformerRefkey,
  ModelTransformExpression,
  TypeTransformCall,
  TypeTransformDeclaration,
} from "../../../src/typescript/components/type-transform.js";
import { TypeDeclaration } from "../../../src/typescript/index.js";
import { createEmitterFrameworkTestRunner } from "../test-host.js";

describe("Typescript Type Transform", () => {
  let testRunner: BasicTestRunner;
  const namePolicy = ts.createTSNamePolicy();
  beforeEach(async () => {
    testRunner = await createEmitterFrameworkTestRunner();
  });
  describe("Model Transforms", () => {
    describe("ModelTransformExpression", () => {
      it("should render a transform expression to client", async () => {
        const spec = `
          namespace DemoService;
          @test model Widget {
            id: string;
            birth_year: int32;
            color: "blue" | "red";
          }
          `;

        const { Widget } = (await testRunner.compile(spec)) as { Widget: Model };

        const res = render(
          <Output namePolicy={namePolicy}>
            <SourceFile path="test.ts">
              {code`
                const wireWidget = {id: "1", birth_year: 1988, color: "blue"};
                `}
              const clientWidget = <ModelTransformExpression type={Widget} target="application" itemPath={["wireWidget"]} />
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = testFile.contents;
        const expectedContent = d`
          const wireWidget = {id: "1", birth_year: 1988, color: "blue"};
          const clientWidget = {
            "id": wireWidget.id,
            "birthYear": wireWidget.birth_year,
            "color": wireWidget.color
          }`;
        expect(actualContent).toBe(expectedContent);
      });

      it("should render a transform expression to wire", async () => {
        const spec = `
          namespace DemoService;
          @test model Widget {
            id: string;
            birth_year: int32;
            color: "blue" | "red";
          }
          `;

        const { Widget } = (await testRunner.compile(spec)) as { Widget: Model };

        const res = render(
          <Output namePolicy={namePolicy}>
            <SourceFile path="test.ts">
              {code`
                const clientWidget = {id: "1", birthYear: 1988, color: "blue"};
                `}
              const wireWidget = <ModelTransformExpression type={Widget} target="transport" itemPath={["clientWidget"]} />
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = testFile.contents;
        const expectedContent = d`
          const clientWidget = {id: "1", birthYear: 1988, color: "blue"};
          const wireWidget = {
            "id": clientWidget.id,
            "birth_year": clientWidget.birthYear,
            "color": clientWidget.color
          }`;
        expect(actualContent).toBe(expectedContent);
      });

      it("should render a transform expression that contains a utcDateTime to client", async () => {
        const spec = `
          namespace DemoService;
          @test model Widget {
            id: string;
            birth_date: utcDateTime;
            color: "blue" | "red";
          }
          `;

        const { Widget } = (await testRunner.compile(spec)) as { Widget: Model };

        const res = render(
          <Output namePolicy={namePolicy}>
            <SourceFile path="static-serializers.ts">
              <DateDeserializer />
            </SourceFile>
            <SourceFile path="test.ts">
              {code`
                const wireWidget = {id: "1", birth_date: "1988-04-29T19:30:00Z", color: "blue"};
                `}
              const clientWidget = <ModelTransformExpression type={Widget} target="application" itemPath={["wireWidget"]} />
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = testFile.contents;
        const expectedContent = d`
          import { dateDeserializer } from "./static-serializers.js";
          
          const wireWidget = {id: "1", birth_date: "1988-04-29T19:30:00Z", color: "blue"};
          const clientWidget = {
            "id": wireWidget.id,
            "birthDate": dateDeserializer(wireWidget.birth_date),
            "color": wireWidget.color
          }`;
        expect(actualContent).toBe(expectedContent);
      });
    });

    describe("TypeTransformDeclaration", () => {
      it("should render a transform functions for a model containing array", async () => {
        const spec = `
          namespace DemoService;
          @test model Widget {
            id: string;
            my_color: "blue" | "red";
            simple?: string[];
            complex: Widget[];
            nested: Widget[][];
            optionalString?: string;
          }
          `;

        const { Widget } = (await testRunner.compile(spec)) as { Widget: Model };

        const res = render(
          <Output namePolicy={namePolicy}>
            <SourceFile path="serializers.ts">
              <ArraySerializer />
            </SourceFile>
            <SourceFile path="test.ts">
              <TypeDeclaration export type={Widget} />
              <TypeTransformDeclaration type={Widget} target="application" />
              <TypeTransformDeclaration type={Widget} target="transport" />
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = testFile.contents;
        const expectedContent = d`
          import { arraySerializer } from "./serializers.js";
          
          export interface Widget {
            "id": string;
            "myColor": "blue" | "red";
            "simple"?: (string)[];
            "complex": (Widget)[];
            "nested": ((Widget)[])[];
            "optionalString"?: string;
          }
          export function widgetToApplication(item: any) {
            return {
              "id": item.id,
              "myColor": item.my_color,
              "simple": item.simple ? arraySerializer(item.simple, ) : item.simple,
              "complex": arraySerializer(item.complex, widgetToApplication),
              "nested": arraySerializer(item.nested, (i: any) => arraySerializer(i, widgetToApplication)),
              "optionalString": item.optionalString
            };
          }
          export function widgetToTransport(item: Widget) {
            return {
              "id": item.id,
              "my_color": item.myColor,
              "simple": item.simple ? arraySerializer(item.simple, ) : item.simple,
              "complex": arraySerializer(item.complex, widgetToTransport),
              "nested": arraySerializer(item.nested, (i: any) => arraySerializer(i, widgetToTransport)),
              "optionalString": item.optionalString
            };
          }
         `;
        expect(actualContent).toBe(expectedContent);
      });
      it("should render a transform functions for a model containing record", async () => {
        const spec = `
          namespace DemoService;
          @test model Widget {
            id: string;
            my_color: "blue" | "red";
            simple: Record<string>;
            complex: Record<Widget>;
            nested: Record<Record<Widget>>;
          }
          `;

        const { Widget } = (await testRunner.compile(spec)) as { Widget: Model };

        const res = render(
          <Output namePolicy={namePolicy}>
            <SourceFile path="serializers.ts">
              <RecordSerializer />
            </SourceFile>
            <SourceFile path="test.ts">
              <TypeDeclaration export type={Widget} />
              <TypeTransformDeclaration type={Widget} target="application" />
              <TypeTransformDeclaration type={Widget} target="transport" />
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = testFile.contents;
        const expectedContent = d`
          import { recordSerializer } from "./serializers.js";
          
          export interface Widget {
            "id": string;
            "myColor": "blue" | "red";
            "simple": Record<string, string>;
            "complex": Record<string, Widget>;
            "nested": Record<string, Record<string, Widget>>;
          }
          export function widgetToApplication(item: any) {
            return {
              "id": item.id,
              "myColor": item.my_color,
              "simple": recordSerializer(item.simple, ),
              "complex": recordSerializer(item.complex, widgetToApplication),
              "nested": recordSerializer(item.nested, (i: any) => recordSerializer(i, widgetToApplication))
            };
          }
          export function widgetToTransport(item: Widget) {
            return {
              "id": item.id,
              "my_color": item.myColor,
              "simple": recordSerializer(item.simple, ),
              "complex": recordSerializer(item.complex, widgetToTransport),
              "nested": recordSerializer(item.nested, (i: any) => recordSerializer(i, widgetToTransport))
            };
          }
         `;
        expect(actualContent).toBe(expectedContent);
      });
      it("should render a transform functions for a model", async () => {
        const spec = `
          namespace DemoService;
          @test model Widget {
            id: string;
            my_color: "blue" | "red";
          }
          `;

        const { Widget } = (await testRunner.compile(spec)) as { Widget: Model };

        const res = render(
          <Output namePolicy={namePolicy}>
            <SourceFile path="test.ts">
              <TypeDeclaration export type={Widget} />
              <TypeTransformDeclaration type={Widget} target="application" />
              <TypeTransformDeclaration type={Widget} target="transport" />
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = testFile.contents;
        const expectedContent = d`
          export interface Widget {
            "id": string;
            "myColor": "blue" | "red";
          }
          export function widgetToApplication(item: any) {
            return {
              "id": item.id,
              "myColor": item.my_color
            };
          }
          export function widgetToTransport(item: Widget) {
            return {
              "id": item.id,
              "my_color": item.myColor
            };
          }
         `;
        expect(actualContent).toBe(expectedContent);
      });
    });
    describe("Calling a model transform functions", () => {
      it("should collapse a model with single property", async () => {
        const spec = `
          namespace DemoService;
          @test model Widget {
            id: string;
          }
          `;

        const { Widget } = (await testRunner.compile(spec)) as { Widget: Model };

        const res = render(
          <Output namePolicy={namePolicy}>
            <SourceFile path="test.ts">
              {code`
                const clientWidget = {id: "1", my_color: "blue"};
                const wireWidget = ${<TypeTransformCall itemPath={["clientWidget"]} type={Widget} collapse={true} target="transport" />}
                `}
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = testFile.contents;
        const expectedContent = d`
          const clientWidget = {id: "1", my_color: "blue"};
          const wireWidget = clientWidget.id
         `;
        expect(actualContent).toBe(expectedContent);
      });

      it("should call  transform functions for a model", async () => {
        const spec = `
          namespace DemoService;
          @test model Widget {
            id: string;
            my_color: "blue" | "red";
          }
          `;

        const { Widget } = (await testRunner.compile(spec)) as { Widget: Model };

        const res = render(
          <Output namePolicy={namePolicy}>
            <SourceFile path="types.ts">
              <TypeDeclaration export type={Widget} />
              <TypeTransformDeclaration type={Widget} target="application" />
              <TypeTransformDeclaration type={Widget} target="transport" />
            </SourceFile>
            <SourceFile path="test.ts">
              {code`
                const wireWidget = {id: "1", my_color: "blue"};
                const clientWidget = ${<ts.FunctionCallExpression refkey={getTypeTransformerRefkey(Widget, "application")} args={[<>wireWidget</>]}/>};
                const wireWidget2 = ${<ts.FunctionCallExpression refkey={getTypeTransformerRefkey(Widget, "transport")} args={["clientWidget"]}/>};
                `}
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = testFile.contents;
        const expectedContent = d`
          import { widgetToApplication, widgetToTransport } from "./types.js";
          
          const wireWidget = {id: "1", my_color: "blue"};
          const clientWidget = widgetToApplication(wireWidget);
          const wireWidget2 = widgetToTransport(clientWidget);
         `;
        expect(actualContent).toBe(expectedContent);
      });
    })
  });
  describe("Discriminated Union Transforms", () => {
    it("should handle a discriminated union", async () => {
      const { Pet, Cat, Dog } = (await testRunner.compile(`
        @discriminator("kind")
        @test union Pet {
          cat: Cat;
          dog: Dog;
        }

        @test model Cat  {
          kind: "cat";
        }

        @test model Dog {
          kind: "dog";
        }
      `)) as { Pet: Model; Cat: Model; Dog: Model };


      const res = render(
        <Output namePolicy={namePolicy}>
          <SourceFile path="test.ts">
            <TypeDeclaration export type={Pet} />
            <TypeDeclaration export type={Dog} />
            <TypeDeclaration export type={Cat} />
            <TypeTransformDeclaration type={Dog} target="application" />
            <TypeTransformDeclaration type={Dog} target="transport" />
            <TypeTransformDeclaration type={Cat} target="application" />
            <TypeTransformDeclaration type={Cat} target="transport" />
            <TypeTransformDeclaration type={Pet} target="application" />
            <TypeTransformDeclaration type={Pet} target="transport" />
          </SourceFile>
        </Output>
      );

      const testFile = res.contents.find((file) => file.path === "test.ts");
      assert(testFile, "test.ts file not rendered");
      const actualContent = testFile.contents;
      const expectedContent = d`
      export type Pet = Cat | Dog;
      export interface Dog {
        "kind": "dog";
      }
      export interface Cat {
        "kind": "cat";
      }
      export function dogToApplication(item: any) {
        return {
          "kind": item.kind
        };
      }
      export function dogToTransport(item: Dog) {
        return {
          "kind": item.kind
        };
      }
      export function catToApplication(item: any) {
        return {
          "kind": item.kind
        };
      }
      export function catToTransport(item: Cat) {
        return {
          "kind": item.kind
        };
      }
      export function petToApplication(item: any) {
        if(item.kind === "cat") {
          return catToApplication(item)
        }
        if(item.kind === "dog") {
          return dogToApplication(item)
        }
      }
      export function petToTransport(item: Pet) {
        if(item.kind === "cat") {
          return catToTransport(item)
        }
        if(item.kind === "dog") {
          return dogToTransport(item)
        }
      }
       `;
      expect(actualContent).toBe(expectedContent);

    });
  })
});
