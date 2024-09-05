import { Output, render } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import * as ts from "@alloy-js/typescript";
import { Operation } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { createHttpClientJavascriptEmitterTestRunner } from "../../test-host.js";
import { HttpRequestOptions } from "../../../src/components/http-request-options.jsx";

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
      headers: {}
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
        "Content-Type": "application/json"
      }
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
        "Content-Type": contentType
      }
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
      }
    `;
    expect(actualContent).toEqual(expectedContent);
  });
});
