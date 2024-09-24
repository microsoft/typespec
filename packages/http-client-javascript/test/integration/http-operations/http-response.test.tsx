import { Output, refkey, render } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import * as ts from "@alloy-js/typescript";
import { Model, Operation } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { uriTemplateLib } from "../../../src/components/external-packages/uri-template.js";
import { HttpResponse } from "../../../src/components/http-response.jsx";
import { ModelsFile } from "../../../src/components/models-file.jsx";
import { ModelSerializers } from "../../../src/components/serializers.jsx";
import { createHttpClientJavascriptEmitterTestRunner } from "../../test-host.js";

const namePolicy = ts.createTSNamePolicy();
let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createHttpClientJavascriptEmitterTestRunner();
});

describe("HttpResponse", () => {
  it("should handle a basic response", async () => {
    const spec = `
    @service({
      title: "Widget Service",
    })
    namespace DemoService;

    @route("/widgets")
    @tag("Widgets")
    interface Widgets {
      @test @get read(): void;
    }
    `;

    const { read } = (await runner.compile(spec)) as { read: Operation };

    const res = render(
      <Output namePolicy={namePolicy} externals={[uriTemplateLib]}>
        <ts.SourceFile path="test.ts">
          <HttpResponse operation={read} responseRefkey={refkey()} />
        </ts.SourceFile>
      </Output>,
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
    if (response.status === 204 && !response.body) {
      return;
    }
    
    throw new Error("Unhandled response");
    `;
    expect(actualContent).toEqual(expectedContent);
  });

  it("should handle a response with body", async () => {
    const spec = `
    @service({
      title: "Widget Service",
    })
    namespace DemoService;

    @test model Widget {
      name: string;
      age: int32;
    }

    @route("/widgets")
    @tag("Widgets")
    interface Widgets {
      @test @get read(): Widget;
    }
    `;

    const { read, Widget } = (await runner.compile(spec)) as { read: Operation; Widget: Model };

    const res = render(
      <Output namePolicy={namePolicy} externals={[uriTemplateLib]}>
         <ModelsFile types={[Widget]} />
         <ModelSerializers types={[Widget]}/>
        <ts.SourceFile path="test.ts">
          <HttpResponse operation={read} responseRefkey={refkey()} />
        </ts.SourceFile>
      </Output>,
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
    import { widgetToApplication } from "./serializers.js";

    if (response.status === 200) {
      const bodyJson = await response.json();
      return widgetToApplication(bodyJson);
    }
    
    throw new Error("Unhandled response");
    `;
    expect(actualContent).toEqual(expectedContent);
  });

  it("should handle a response with multiple status codes", async () => {
    const spec = `
    @service({
      title: "Widget Service",
    })
    namespace DemoService;

    @test model Widget {
      name: string;
      age: int32;
    }

    @route("/widgets")
    @tag("Widgets")
    interface Widgets {
      @test @get read(): Widget | void;
    }
    `;

    const { read, Widget } = (await runner.compile(spec)) as { read: Operation; Widget: Model };

    const res = render(
      <Output namePolicy={namePolicy} externals={[uriTemplateLib]}>
         <ModelsFile types={[Widget]} />
         <ModelSerializers types={[Widget]}/>
        <ts.SourceFile path="test.ts">
          <HttpResponse operation={read} responseRefkey={refkey()} />
        </ts.SourceFile>
      </Output>,
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
    import { widgetToApplication } from "./serializers.js";
    
    if (response.status === 200) {
      const bodyJson = await response.json();
      return widgetToApplication(bodyJson);
    }

    if (response.status === 204 && !response.body) {
      return;
    }

    throw new Error("Unhandled response");
    `;
    expect(actualContent).toEqual(expectedContent);
  });

  it("should handle a response with multiple contentTypes", async () => {
    const spec = `
    @service({
      title: "Widget Service",
    })
    namespace DemoService;

    @test model Widget {
      name: string;
      age: int32;
    }

    @route("/widgets")
    @tag("Widgets")
    interface Widgets {
      @test @get read(): {...Widget, @header contentType: "application/json+something"} | Widget | void;
    }
    `;

    const { read, Widget } = (await runner.compile(spec)) as { read: Operation; Widget: Model };

    const res = render(
      <Output namePolicy={namePolicy} externals={[uriTemplateLib]}>
         <ModelsFile types={[Widget]} />
         <ModelSerializers types={[Widget]}/>
        <ts.SourceFile path="test.ts">
          <HttpResponse operation={read} responseRefkey={refkey()} />
        </ts.SourceFile>
      </Output>,
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
    import { widgetToApplication } from "./serializers.js";
    
    if (response.status === 200 && response.headers.get("content-type") === "application/json+something") {
      const bodyJson = await response.json();
      return {
        "name": bodyJson.name,
        "age": bodyJson.age
      };
    }

    if (response.status === 200) {
      const bodyJson = await response.json();
      return widgetToApplication(bodyJson);
    }

    if (response.status === 204 && !response.body) {
      return;
    }

    throw new Error("Unhandled response");
    `;
    expect(actualContent).toEqual(expectedContent);
  });
});
