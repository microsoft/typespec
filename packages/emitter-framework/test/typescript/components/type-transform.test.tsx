import { Tester } from "#test/test-host.js";
import { code, Output } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { SourceFile } from "@alloy-js/typescript";
import type { Model } from "@typespec/compiler";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import {
  ArraySerializer,
  DateDeserializer,
  RecordSerializer,
} from "../../../src/typescript/components/static-serializers.js";
import {
  getTypeTransformerRefkey,
  ModelTransformExpression,
  TypeTransformCall,
  TypeTransformDeclaration,
} from "../../../src/typescript/components/type-transform.js";
import { TypeDeclaration } from "../../../src/typescript/index.js";

describe.skip("Typescript Type Transform", () => {
  let testRunner: TesterInstance;
  const namePolicy = ts.createTSNamePolicy();
  beforeEach(async () => {
    testRunner = await Tester.createInstance();
  });
  describe("Model Transforms", () => {
    describe("ModelTransformExpression", () => {
      it("should render a transform expression to client", async () => {
        const spec = t.code`
          namespace DemoService;
          @test model ${t.model("Widget")} {
            id: string;
            birth_year: int32;
            color: "blue" | "red";
          }
          `;

        const { Widget } = await testRunner.compile(spec);

        expect(
          <Output namePolicy={namePolicy}>
            <SourceFile path="test.ts">
              {code`
                const wireWidget = {id: "1", birth_year: 1988, color: "blue"};
                `}
              const clientWidget ={" "}
              <ModelTransformExpression
                type={Widget}
                target="application"
                itemPath={["wireWidget"]}
              />
            </SourceFile>
          </Output>,
        ).toRenderTo(`
          const wireWidget = {id: "1", birth_year: 1988, color: "blue"};
          const clientWidget = {
            "id": wireWidget.id,
            "birthYear": wireWidget.birth_year,
            "color": wireWidget.color
          }`);
      });

      it("should render a transform expression to wire", async () => {
        const spec = t.code`
          namespace DemoService;
          @test model ${t.model("Widget")} {
            id: string;
            birth_year: int32;
            color: "blue" | "red";
          }
          `;

        const { Widget } = await testRunner.compile(spec);

        expect(
          <Output namePolicy={namePolicy}>
            <SourceFile path="test.ts">
              {code`
                const clientWidget = {id: "1", birthYear: 1988, color: "blue"};
                `}
              const wireWidget ={" "}
              <ModelTransformExpression
                type={Widget}
                target="transport"
                itemPath={["clientWidget"]}
              />
            </SourceFile>
          </Output>,
        ).toRenderTo(`
          const clientWidget = {id: "1", birthYear: 1988, color: "blue"};
          const wireWidget = {
            "id": clientWidget.id,
            "birth_year": clientWidget.birthYear,
            "color": clientWidget.color
          }`);
      });

      it("should render a transform expression that contains a utcDateTime to client", async () => {
        const spec = t.code`
          namespace DemoService;
          @test model ${t.model("Widget")} {
            id: string;
            birth_date: utcDateTime;
            color: "blue" | "red";
          }
          `;

        const { Widget } = (await testRunner.compile(spec)) as { Widget: Model };

        expect(
          <Output namePolicy={namePolicy}>
            <SourceFile path="static-serializers.ts">
              <DateDeserializer />
            </SourceFile>
            <SourceFile path="test.ts">
              {code`
                const wireWidget = {id: "1", birth_date: "1988-04-29T19:30:00Z", color: "blue"};
                `}
              const clientWidget ={" "}
              <ModelTransformExpression
                type={Widget}
                target="application"
                itemPath={["wireWidget"]}
              />
            </SourceFile>
          </Output>,
        ).toRenderTo(`
          import { dateDeserializer } from "./static-serializers.js";
          
          const wireWidget = {id: "1", birth_date: "1988-04-29T19:30:00Z", color: "blue"};
          const clientWidget = {
            "id": wireWidget.id,
            "birthDate": dateDeserializer(wireWidget.birth_date),
            "color": wireWidget.color
          }`);
      });
    });

    describe("TypeTransformDeclaration", () => {
      it("should render a transform functions for a model containing array", async () => {
        const spec = t.code`
          namespace DemoService;
          @test model ${t.model("Widget")} {
            id: string;
            my_color: "blue" | "red";
            simple?: string[];
            complex: Widget[];
            nested: Widget[][];
            optionalString?: string;
          }
          `;

        const { Widget } = await testRunner.compile(spec);

        expect(
          <Output namePolicy={namePolicy}>
            <SourceFile path="serializers.ts">
              <ArraySerializer />
            </SourceFile>
            <SourceFile path="test.ts">
              <TypeDeclaration export type={Widget} />
              <TypeTransformDeclaration type={Widget} target="application" />
              <TypeTransformDeclaration type={Widget} target="transport" />
            </SourceFile>
          </Output>,
        ).toRenderTo(`
          import { arraySerializer } from "./serializers.js";
          
          export interface Widget {
            "id": string;
            "myColor": "blue" | "red";
            "simple"?: Array<string>;
            "complex": Array<Widget>;
            "nested": Array<Array<Widget>>;
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
         `);
      });
      it("should render a transform functions for a model containing record", async () => {
        const spec = t.code`
          namespace DemoService;
          @test model ${t.model("Widget")} {
            id: string;
            my_color: "blue" | "red";
            simple: Record<string>;
            complex: Record<Widget>;
            nested: Record<Record<Widget>>;
          }
          `;

        const { Widget } = await testRunner.compile(spec);

        expect(
          <Output namePolicy={namePolicy}>
            <SourceFile path="serializers.ts">
              <RecordSerializer />
            </SourceFile>
            <SourceFile path="test.ts">
              <TypeDeclaration export type={Widget} />
              <TypeTransformDeclaration type={Widget} target="application" />
              <TypeTransformDeclaration type={Widget} target="transport" />
            </SourceFile>
          </Output>,
        ).toRenderTo(`
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
         `);
      });
      it("should render a transform functions for a model", async () => {
        const spec = t.code`
          namespace DemoService;
          @test model ${t.model("Widget")} {
            id: string;
            my_color: "blue" | "red";
          }
          `;

        const { Widget } = await testRunner.compile(spec);

        expect(
          <Output namePolicy={namePolicy}>
            <SourceFile path="test.ts">
              <TypeDeclaration export type={Widget} />
              <TypeTransformDeclaration type={Widget} target="application" />
              <TypeTransformDeclaration type={Widget} target="transport" />
            </SourceFile>
          </Output>,
        ).toRenderTo(`
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
         `);
      });
    });
    describe("Calling a model transform functions", () => {
      it("should collapse a model with single property", async () => {
        const spec = t.code`
          namespace DemoService;
          @test model ${t.model("Widget")} {
            id: string;
          }
          `;

        const { Widget } = await testRunner.compile(spec);

        expect(
          <Output namePolicy={namePolicy}>
            <SourceFile path="test.ts">
              {code`
                const clientWidget = {id: "1", my_color: "blue"};
                const wireWidget = ${(<TypeTransformCall itemPath={["clientWidget"]} type={Widget} collapse={true} target="transport" />)}
                `}
            </SourceFile>
          </Output>,
        ).toRenderTo(`
          const clientWidget = {id: "1", my_color: "blue"};
          const wireWidget = clientWidget.id
         `);
      });

      it("should call  transform functions for a model", async () => {
        const spec = t.code`
          namespace DemoService;
          @test model ${t.model("Widget")} {
            id: string;
            my_color: "blue" | "red";
          }
          `;

        const { Widget } = await testRunner.compile(spec);

        expect(
          <Output namePolicy={namePolicy}>
            <SourceFile path="types.ts">
              <TypeDeclaration export type={Widget} />
              <TypeTransformDeclaration type={Widget} target="application" />
              <TypeTransformDeclaration type={Widget} target="transport" />
            </SourceFile>
            <SourceFile path="test.ts">
              {code`
                const wireWidget = {id: "1", my_color: "blue"};
                const clientWidget = ${(<ts.FunctionCallExpression target={getTypeTransformerRefkey(Widget, "application")} args={[<>wireWidget</>]} />)};
                const wireWidget2 = ${(<ts.FunctionCallExpression target={getTypeTransformerRefkey(Widget, "transport")} args={["clientWidget"]} />)};
                `}
            </SourceFile>
          </Output>,
        ).toRenderTo(`
          import { widgetToApplication, widgetToTransport } from "./types.js";
          
          const wireWidget = {id: "1", my_color: "blue"};
          const clientWidget = widgetToApplication(wireWidget);
          const wireWidget2 = widgetToTransport(clientWidget);
         `);
      });
    });
  });

  describe("Discriminated Model Transforms", () => {
    it("should handle a discriminated union", async () => {
      const { Pet, Cat, Dog } = await testRunner.compile(t.code`
        @discriminator("kind")
        @test model ${t.model("Pet")} {
          kind: string;
        }

        @test model ${t.model("Cat")} extends Pet {
          kind: "cat";
        }

        @test model ${t.model("Dog")} extends Pet {
          kind: "dog";
        }
      `);

      expect(
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
        </Output>,
      ).toRenderTo(`
      export interface Pet {
        "kind": string;
      }
      export interface Dog extends Pet {
        "kind": "dog";
      }
      export interface Cat extends Pet {
        "kind": "cat";
      }
      export function dogToApplication(item: any): Dog {
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
       `);
    });
  });
  describe("Discriminated Union Transforms", () => {
    it("should handle a discriminated union", async () => {
      const { Pet, Cat, Dog } = await testRunner.compile(t.code`
        @discriminator("kind")
        @test union ${t.union("Pet")}{
          cat: Cat;
          dog: Dog;
        }

        @test model ${t.model("Cat")} {
          kind: "cat";
        }

        @test model ${t.model("Dog")} {
          kind: "dog";
        }
      `);

      expect(
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
        </Output>,
      ).toRenderTo(`
      export type Pet = Cat | Dog;
      export interface Dog {
        "kind": "dog";
      }
      export interface Cat {
        "kind": "cat";
      }
      export function dogToApplication(item: any): Dog {
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
       `);
    });
  });
});
