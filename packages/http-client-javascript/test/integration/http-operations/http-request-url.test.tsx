import { Output, render } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import * as ts from "@alloy-js/typescript";
import { Operation } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { uriTemplateLib } from "../../../src/components/external-packages/uri-template.js";
import { HttpRequest } from "../../../src/components/http-request.jsx";
import { createHttpClientJavascriptEmitterTestRunner } from "../../test-host.js";

const namePolicy = ts.createTSNamePolicy();
let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createHttpClientJavascriptEmitterTestRunner();
});

describe("HttpRequest.Url", () => {
  it("should render the url construction with a simple url", async () => {
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
          <HttpRequest.Url operation={read} />
        </ts.SourceFile>
      </Output>
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
    import { parse } from "uri-template";

    const path = parse("/widgets").expand({});

    const url = \`\${client.endpoint.replace(/\\/+$/, '')}/\${path.replace(/\\/+$/, '')}\`;
    `;
    expect(actualContent).toEqual(expectedContent);
  });

  it("should render the url construction with a path parameter", async () => {
    const spec = `
    @service({
      title: "Widget Service",
    })
    namespace DemoService;

    @route("/widgets")
    @tag("Widgets")
    interface Widgets {
      @test @get read(@path id: string): void;
    }
    `;

    const { read } = (await runner.compile(spec)) as { read: Operation };

    const res = render(
      <Output namePolicy={namePolicy} externals={[uriTemplateLib]}>
        <ts.SourceFile path="test.ts">
          <HttpRequest.Url operation={read} />
        </ts.SourceFile>
      </Output>
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
    import { parse } from "uri-template";

    const path = parse("/widgets/{id}").expand({
      "id": id
    });

    const url = \`\${client.endpoint.replace(/\\/+$/, '')}/\${path.replace(/\\/+$/, '')}\`;
    `;
    expect(actualContent).toEqual(expectedContent);
  });

  it("should render the url construction with a path parameter from model", async () => {
    const spec = `
    @service({
      title: "Widget Service",
    })
    namespace DemoService;

    model Widget {
      @path id: string;
    }

    @route("/widgets")
    @tag("Widgets")
    interface Widgets {
      @test @get read(...Widget): void;
    }
    `;

    const { read } = (await runner.compile(spec)) as { read: Operation };

    const res = render(
      <Output namePolicy={namePolicy} externals={[uriTemplateLib]}>
        <ts.SourceFile path="test.ts">
          <HttpRequest.Url operation={read} />
        </ts.SourceFile>
      </Output>
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
    import { parse } from "uri-template";

    const path = parse("/widgets/{id}").expand({
      "id": id
    });

    const url = \`\${client.endpoint.replace(/\\/+$/, '')}/\${path.replace(/\\/+$/, '')}\`;
    `;
    expect(actualContent).toEqual(expectedContent);
  });

  it("should render the url construction with a path parameter that has a different wire name", async () => {
    const spec = `
    @service({
      title: "Widget Service",
    })
    namespace DemoService;

    @route("/widgets")
    @tag("Widgets")
    interface Widgets {
      @test @get read(@path my_id: string): void;
    }
    `;

    const { read } = (await runner.compile(spec)) as { read: Operation };

    const res = render(
      <Output namePolicy={namePolicy} externals={[uriTemplateLib]}>
        <ts.SourceFile path="test.ts">
          <HttpRequest.Url operation={read} />
        </ts.SourceFile>
      </Output>
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
    import { parse } from "uri-template";

    const path = parse("/widgets/{my_id}").expand({
      "my_id": myId
    });

    const url = \`\${client.endpoint.replace(/\\/+$/, '')}/\${path.replace(/\\/+$/, '')}\`;
    `;
    expect(actualContent).toEqual(expectedContent);
  });

  it("should render the url construction with a query parameter", async () => {
    const spec = `
    @service({
      title: "Widget Service",
    })
    namespace DemoService;

    @route("/widgets")
    @tag("Widgets")
    interface Widgets {
      @test @get read(@query id: string): void;
    }
    `;

    const { read } = (await runner.compile(spec)) as { read: Operation };

    const res = render(
      <Output namePolicy={namePolicy} externals={[uriTemplateLib]}>
        <ts.SourceFile path="test.ts">
          <HttpRequest.Url operation={read} />
        </ts.SourceFile>
      </Output>
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
    import { parse } from "uri-template";

    const path = parse("/widgets{?id}").expand({
      "id": id
    });

    const url = \`\${client.endpoint.replace(/\\/+$/, '')}/\${path.replace(/\\/+$/, '')}\`;
    `;
    expect(actualContent).toEqual(expectedContent);
  });

  it("should render the url construction with an optional query parameter", async () => {
    const spec = `
    @service({
      title: "Widget Service",
    })
    namespace DemoService;

    @route("/widgets")
    @tag("Widgets")
    interface Widgets {
      @test @get read(@query id?: string): void;
    }
    `;

    const { read } = (await runner.compile(spec)) as { read: Operation };

    const res = render(
      <Output namePolicy={namePolicy} externals={[uriTemplateLib]}>
        <ts.SourceFile path="test.ts">
          <HttpRequest.Url operation={read} />
        </ts.SourceFile>
      </Output>
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
    import { parse } from "uri-template";

    const path = parse("/widgets{?id}").expand({
      "id": options.id
    });

    const url = \`\${client.endpoint.replace(/\\/+$/, '')}/\${path.replace(/\\/+$/, '')}\`;
    `;
    expect(actualContent).toEqual(expectedContent);
  });

  it("should render the url construction with an optional query parameter from model", async () => {
    const spec = `
    @service({
      title: "Widget Service",
    })
    namespace DemoService;

    model Widget {
      @query id?: string;
    }

    @route("/widgets")
    @tag("Widgets")
    interface Widgets {
      @test @get read(...Widget): void;
    }
    `;

    const { read } = (await runner.compile(spec)) as { read: Operation };

    const res = render(
      <Output namePolicy={namePolicy} externals={[uriTemplateLib]}>
        <ts.SourceFile path="test.ts">
          <HttpRequest.Url operation={read} />
        </ts.SourceFile>
      </Output>
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
    import { parse } from "uri-template";

    const path = parse("/widgets{?id}").expand({
      "id": options.id
    });

    const url = \`\${client.endpoint.replace(/\\/+$/, '')}/\${path.replace(/\\/+$/, '')}\`;
    `;
    expect(actualContent).toEqual(expectedContent);
  });
});
