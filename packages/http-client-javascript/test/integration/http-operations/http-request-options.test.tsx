import { code, Output, render } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import * as ts from "@alloy-js/typescript";
import { Model, Operation } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { createHttpClientJavascriptEmitterTestRunner } from "../../test-host.js";
import { HttpRequestOptions } from "../../../src/components/http-request-options.jsx";
import { ModelsFile } from "../../../src/components/models-file.jsx";
import { ModelSerializers } from "../../../src/components/serializers.jsx";

const namePolicy = ts.createTSNamePolicy();
let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createHttpClientJavascriptEmitterTestRunner();
});

describe("HttpRequestHeaders", () => {
  it("should not add content-type if there is no body", async () => {
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
      <Output namePolicy={namePolicy}>
        <ts.SourceFile path="test.ts">
          <HttpRequestOptions.Headers operation={read} />
        </ts.SourceFile>
      </Output>
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
      headers: {},
    `;
    expect(actualContent).toEqual(expectedContent);
  });

  it("should add default content-type", async () => {
    const spec = `
    @service({
      title: "Widget Service",
    })
    namespace DemoService;

    model Widget {
      name: string
    }

    @route("/widgets")
    @tag("Widgets")
    interface Widgets {
      @test @get read(...Widget): void;
    }
    `;

    const { read } = (await runner.compile(spec)) as { read: Operation };

    const res = render(
      <Output namePolicy={namePolicy}>
        <ts.SourceFile path="test.ts">
          <HttpRequestOptions.Headers operation={read} />
        </ts.SourceFile>
      </Output>
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
headers: {
  "Content-Type": "application/json",
  
},
    `;
    expect(actualContent).toEqual(expectedContent);
  });

  it("should use the content-type parameter if required in the spec", async () => {
    const spec = `
    @service({
      title: "Widget Service",
    })
    namespace DemoService;

    model Widget {
      name: string;
      @header contentType: string;
    }

    @route("/widgets")
    @tag("Widgets")
    interface Widgets {
      @test @get read(...Widget): void;
    }
    `;

    const { read } = (await runner.compile(spec)) as { read: Operation };

    const res = render(
      <Output namePolicy={namePolicy}>
        <ts.SourceFile path="test.ts">
          <HttpRequestOptions.Headers operation={read} />
        </ts.SourceFile>
      </Output>
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
headers: {
  "Content-Type": contentType,
  
},
    `;
    expect(actualContent).toEqual(expectedContent);
  });

  it("should find the optional and required headers correctly", async () => {
    const spec = `
    @service({
      title: "Widget Service",
    })
    namespace DemoService;

    model Widget {
      name: string;
      @header required: string;
      @header optional?: int32;
      @header automaticCasing: string;
    }

    @route("/widgets")
    @tag("Widgets")
    interface Widgets {
      @test @get read(...Widget): void;
    }
    `;

    const { read } = (await runner.compile(spec)) as { read: Operation };

    const res = render(
      <Output namePolicy={namePolicy}>
        <ts.SourceFile path="test.ts">
          <HttpRequestOptions.Headers operation={read} />
        </ts.SourceFile>
      </Output>
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
      headers: {
        "Content-Type": "application/json",
        "required": required,
        "optional": options.optional,
        "automatic-casing": automaticCasing
      },
    `;
    expect(actualContent).toEqual(expectedContent);
  });
});

describe("HttpRequestBody", () => {
  it("should not add body if there is no body", async () => {
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
      <Output namePolicy={namePolicy}>
        <ts.SourceFile path="test.ts">
          <HttpRequestOptions.Body operation={read} />
        </ts.SourceFile>
      </Output>
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = ``;
    expect(actualContent).toEqual(expectedContent);
  });
  it("should handle a scalar body", async () => {
    const spec = `
    @service({
      title: "Widget Service",
    })
    namespace DemoService;

    @route("/widgets")
    @tag("Widgets")
    interface Widgets {
      @test @get read(@body count: int32): void;
    }
    `;

    const { read } = (await runner.compile(spec)) as { read: Operation };

    const res = render(
      <Output namePolicy={namePolicy}>
        <ts.SourceFile path="test.ts">
          <HttpRequestOptions.Body operation={read} />
        </ts.SourceFile>
      </Output>
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
    body: JSON.stringify(count),
    `;
    expect(actualContent).toEqual(expectedContent);
  });
  it("should handle a model body", async () => {
    const spec = `
    @service({
      title: "Widget Service",
    })
    namespace DemoService;

    @test model Widget {
      name: string;
    }

    @route("/widgets")
    @tag("Widgets")
    interface Widgets {
      @test @get read(...Widget): void;
    }
    `;

    const { read, Widget } = (await runner.compile(spec)) as { read: Operation, Widget: Model };

    const res = render(
      <Output namePolicy={namePolicy}>
        <ModelsFile types={[Widget]} />
        <ModelSerializers types={[Widget]} />
        <ts.SourceFile path="test.ts">
          {code`
          const widget = {};
          `}
          <HttpRequestOptions.Body operation={read} itemName="widget" />
        </ts.SourceFile>
      </Output>
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
    import { widgetToTransport } from "./serializers.js";
    
    const widget = {};
    body: JSON.stringify(widgetToTransport(widget)),
    `;
    expect(actualContent).toEqual(expectedContent);
  });

  it("should handle a named model body", async () => {
    const spec = `
    @service({
      title: "Widget Service",
    })
    namespace DemoService;

    @test model Widget {
      name: string;
    }

    @route("/widgets")
    @tag("Widgets")
    interface Widgets {
      @test @get read(@body widget: Widget): void;
    }
    `;

    const { read, Widget } = (await runner.compile(spec)) as { read: Operation, Widget: Model };

    const res = render(
      <Output namePolicy={namePolicy}>
        <ModelsFile types={[Widget]} />
        <ModelSerializers types={[Widget]} />
        <ts.SourceFile path="test.ts">
          <HttpRequestOptions.Body operation={read} />
        </ts.SourceFile>
      </Output>
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
    import { widgetToTransport } from "./serializers.js";

    body: JSON.stringify(widgetToTransport(widget)),
    `;
    expect(actualContent).toEqual(expectedContent);
  });
});
