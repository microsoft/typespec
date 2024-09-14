import { Output, render } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import * as ts from "@alloy-js/typescript";
import { Model, Operation } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { createHttpClientJavascriptEmitterTestRunner } from "../../test-host.js";
import { ModelsFile } from "../../../src/components/models-file.jsx";
import { ModelSerializers } from "../../../src/components/serializers.jsx";
import { HttpRequest } from "../../../src/components/http-request.jsx";
import { uriTemplateLib } from "../../../src/components/external-packages/uri-template.js";
import { HttpFetchDeclaration, HttpFetchOptionsDeclaration } from "../../../src/components/static-fetch-wrapper.jsx";

const namePolicy = ts.createTSNamePolicy();
let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createHttpClientJavascriptEmitterTestRunner();
});


describe("HttpRequest", () => {
  it("should handle a basic request", async () => {
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
        <ts.SourceFile path="http-fetch.ts">
          <HttpFetchOptionsDeclaration />
          <HttpFetchDeclaration />
        </ts.SourceFile>
        <ts.SourceFile path="test.ts">
          <HttpRequest operation={read} />
        </ts.SourceFile>
      </Output>
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent =d `
    import { parse } from "uri-template";
    import { httpFetch } from "./http-fetch.js";

    const path = parse("/widgets").expand({});

    const url = \`\${client.endpoint.replace(/\\/+$/, '')}/\${path.replace(/\\/+$/, '')}\`;

    const httpRequestOptions = {
      method: "get",
      headers: {},
      
    };

    const response = await httpFetch(url, httpRequestOptions);
    `;
    expect(actualContent).toEqual(expectedContent);
  });

  it("should handle a request with headers, body and query parameters", async () => {
    const spec = `
    @service({
      title: "Widget Service",
    })
    namespace DemoService;

    @test model Widget {
      @path id: string;
      @header etag: string;
      @query foo: string;
      name: string;
    }

    @route("/widgets")
    @tag("Widgets")
    interface Widgets {
      @test @post read(...Widget): void;
    }
    `;

    const { read, Widget } = (await runner.compile(spec)) as { read: Operation, Widget: Model };

    const res = render(
      <Output namePolicy={namePolicy} externals={[uriTemplateLib]}>
        <ModelsFile types={[Widget]} />
        <ModelSerializers types={[Widget]}/>
        <ts.SourceFile path="http-fetch.ts">
          <HttpFetchOptionsDeclaration />
          <HttpFetchDeclaration />
        </ts.SourceFile>
        <ts.SourceFile path="test.ts">
          <HttpRequest operation={read} />
        </ts.SourceFile>
      </Output>
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
    import { parse } from "uri-template";
    import { httpFetch } from "./http-fetch.js";

    const path = parse("/widgets/{id}{?foo}").expand({
      "id": id,
      "foo": foo
    });

    const url = \`\${client.endpoint.replace(/\\/+$/, '')}/\${path.replace(/\\/+$/, '')}\`;

    const httpRequestOptions = {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "etag": etag
      },
      body: JSON.stringify({
        "name": name
      }),
    };

    const response = await httpFetch(url, httpRequestOptions);
    `;
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
      <Output namePolicy={namePolicy} externals={[uriTemplateLib]}>
        <ts.SourceFile path="http-fetch.ts">
          <HttpFetchOptionsDeclaration />
          <HttpFetchDeclaration />
        </ts.SourceFile>
        <ts.SourceFile path="test.ts">
          <HttpRequest operation={read} />
        </ts.SourceFile>
      </Output>
    );

    const testFile = res.contents.find((file) => file.path === "test.ts");
    assert(testFile, "test.ts file not rendered");
    const actualContent = testFile.contents;
    const expectedContent = d`
    import { parse } from "uri-template";
    import { httpFetch } from "./http-fetch.js";

    const path = parse("/widgets").expand({});

    const url = \`\${client.endpoint.replace(/\\/+$/, '')}/\${path.replace(/\\/+$/, '')}\`;

    const httpRequestOptions = {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        
      },
      body: JSON.stringify(count),
    };

    const response = await httpFetch(url, httpRequestOptions);
    `;
    expect(actualContent).toEqual(expectedContent);
  });
});
