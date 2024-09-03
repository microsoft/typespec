
import { Model } from "@typespec/compiler";
import { describe, expect, it, beforeEach, assert } from "vitest";
import { createEmitterFrameworkTestRunner } from "../test-host.js";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { code, Output, render } from "@alloy-js/core";
import { SourceFile } from "@alloy-js/typescript";
import { ModelTransformExpression } from "../../../src/typescript/components/type-transform.jsx";
import { d } from "@alloy-js/core/testing";
import * as ts from "@alloy-js/typescript";

describe("Typescript Type Transform", () => {
  let testRunner: BasicTestRunner;
  const namePolicy = ts.createTSNamePolicy();
  beforeEach(async () => {
    testRunner = await createEmitterFrameworkTestRunner();
  });
  describe("Model Transforms", () => {
    it("should render a model transform expression to client", async () => {
      const spec = `
        namespace DemoService;
        @test model Widget {
          id: string;
          birth_year: int32;
          color: "blue" | "red";
        }
        `;

        const {Widget} = await testRunner.compile(spec) as {Widget: Model};

        const res = render(
          <Output namePolicy={namePolicy}>
            <SourceFile path="test.ts">
              {code`
              const wireWidget = {id: "1", birth_year: 1988, color: "blue"};
              `}
              const clientWidget = <ModelTransformExpression type={Widget} target="client" itemPath={"wireWidget"} />
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = testFile.contents;
        const expectedContent = d`
        const wireWidget = {id: "1", birth_year: 1988, color: "blue"};
        const clientWidget = {
          id: wireWidget.id,
          birthYear: wireWidget.birth_year,
          color: wireWidget.color
        }`;
        expect(actualContent).toBe(expectedContent);
    });
    
    it("should render a model transform expression to wire", async () => {
      const spec = `
        namespace DemoService;
        @test model Widget {
          id: string;
          birth_year: int32;
          color: "blue" | "red";
        }
        `;

        const {Widget} = await testRunner.compile(spec) as {Widget: Model};

        const res = render(
          <Output namePolicy={namePolicy}>
            <SourceFile path="test.ts">
              {code`
              const clientWidget = {id: "1", birthYear: 1988, color: "blue"};
              `}
              const wireWidget = <ModelTransformExpression type={Widget} target="wire" itemPath={"clientWidget"} />
            </SourceFile>
          </Output>
        );

        const testFile = res.contents.find((file) => file.path === "test.ts");
        assert(testFile, "test.ts file not rendered");
        const actualContent = testFile.contents;
        const expectedContent = d`
        const clientWidget = {id: "1", birthYear: 1988, color: "blue"};
        const wireWidget = {
          id: clientWidget.id,
          birth_year: clientWidget.birthYear,
          color: clientWidget.color
        }`;
        expect(actualContent).toBe(expectedContent);
    });
  })
});
