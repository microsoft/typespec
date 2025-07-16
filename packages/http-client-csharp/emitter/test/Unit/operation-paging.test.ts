vi.resetModules();

import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it, vi } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import { RequestLocation } from "../../src/type/request-location.js";
import { ResponseLocation } from "../../src/type/response-location.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Next link operations", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("next link as body property", async () => {
    const program = await typeSpecCompile(
      `
        @list
        op link(): {
          @pageItems
          items: Foo[];

          @nextLink
          next?: url;
        };
        model Foo {
          bar: string;
          baz: int32;
        };
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    strictEqual(method.kind, "paging");

    const paging = method.pagingMetadata;
    ok(paging);
    ok(paging.itemPropertySegments);
    strictEqual(paging.itemPropertySegments[0], "items");
    strictEqual(paging.nextLink?.responseLocation, ResponseLocation.Body);
    strictEqual(paging.nextLink?.responseSegments.length, 1);
    strictEqual(paging.nextLink?.responseSegments[0], "next");
  });

  it("parameterized next link", async () => {
    const program = await typeSpecCompile(
      `
        @route("foo")
        op link(...RequestOptions): LinkResult;

        @pagedResult
        model LinkResult {
          @items
          items: Foo[];

          @nextLink
          next?: global.Azure.Core.Legacy.parameterizedNextLink<[RequestOptions.includePending, RequestOptions.includeExpired, RequestOptions.etagHeader]>;
        }
  
        model RequestOptions {
          @query
          includePending?: boolean;

          @query
          includeExpired?: boolean;

          @header("ETag")
          etagHeader?: string;
        }

        model Foo {
          bar: string;
          baz: int32;
        };
      `,
      runner,
      { IsNamespaceNeeded: true, IsAzureCoreNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    strictEqual(method.kind, "paging");

    const paging = method.pagingMetadata;
    ok(paging);
    ok(paging.itemPropertySegments);

    strictEqual(paging.itemPropertySegments[0], "items");
    strictEqual(paging.nextLink?.responseLocation, ResponseLocation.Body);
    strictEqual(paging.nextLink?.responseSegments.length, 1);
    strictEqual(paging.nextLink?.responseSegments[0], "next");

    const parameterizedNextLink = paging.nextLink?.reInjectedParameters;
    ok(parameterizedNextLink);
    strictEqual(parameterizedNextLink.length, 3);
    strictEqual(parameterizedNextLink[0].name, "includePending");
    strictEqual(parameterizedNextLink[0].location, RequestLocation.Query);
    strictEqual(parameterizedNextLink[1].name, "includeExpired");
    strictEqual(parameterizedNextLink[1].location, RequestLocation.Query);
    strictEqual(parameterizedNextLink[2].name, "etagHeader");
    strictEqual(parameterizedNextLink[2].location, RequestLocation.Header);
  });

  // skipped until https://github.com/Azure/typespec-azure/issues/2341 is fixed
  it.skip("next link as response header", async () => {
    const program = await typeSpecCompile(
      `
        @list
        op link(): {
          @pageItems
          items: Foo[];

          @header @nextLink
          next?: url;
        };
        model Foo {
          bar: string;
          baz: int32;
        };
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    strictEqual(method.kind, "paging");

    const paging = method.pagingMetadata;
    ok(paging);
    ok(paging.itemPropertySegments);
    strictEqual(paging.itemPropertySegments[0], "items");
    strictEqual(paging.nextLink?.responseLocation, ResponseLocation.Header);
    strictEqual(paging.nextLink?.responseSegments.length, 1);
    strictEqual(paging.nextLink?.responseSegments[0], "next");
  });

  // skipped until https://github.com/Azure/typespec-azure/issues/2287 is fixed
  it.skip("next link with nested property", async () => {
    const program = await typeSpecCompile(
      `
        @list
        op link(): {
          @pageItems
          items: Foo[];
          next?: 
          {
            @nextLink
            nested?: url;
          }
        };
        model Foo {
          bar: string;
          baz: int32;
        };
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    strictEqual(method.kind, "paging");

    const paging = method.pagingMetadata;
    ok(paging);
    ok(paging.itemPropertySegments);
    strictEqual(paging.itemPropertySegments[0], "items");
    strictEqual(paging.nextLink?.responseLocation, ResponseLocation.Body);
    strictEqual(paging.nextLink?.responseSegments.length, 2);
    strictEqual(paging.nextLink?.responseSegments[0], "next");
    strictEqual(paging.nextLink?.responseSegments[1], "nested");
  });

  it("next link as invalid location", async () => {
    const program = await typeSpecCompile(
      `
        @list
        op link(): {
          @pageItems
          items: Foo[];

          @nextLink @query
          next?: url;
        };
        model Foo {
          bar: string;
          baz: int32;
        };
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    strictEqual(method.kind, "paging");

    const paging = method.pagingMetadata;
    ok(paging);
    ok(paging.itemPropertySegments);
    strictEqual(paging.itemPropertySegments[0], "items");
    strictEqual(paging.nextLink?.responseLocation, ResponseLocation.None);
    strictEqual(paging.nextLink?.responseSegments.length, 1);
    strictEqual(paging.nextLink?.responseSegments[0], "next");

    strictEqual(program.diagnostics.length, 1);
    strictEqual(
      program.diagnostics[0].code,
      "@typespec/http-client-csharp/unsupported-continuation-location",
    );
    strictEqual(
      program.diagnostics[0].message,
      `Unsupported continuation location for operation ${root.clients[0].methods[0].operation.crossLanguageDefinitionId}.`,
    );
  });
});

describe("Continuation token operations", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });
  it("header request header response", async () => {
    const program = await typeSpecCompile(
      `
        @list
        op link(@continuationToken @header token?: string): {
          @pageItems
          items: Foo[];
          @header @continuationToken nextToken?: string;
        };
        model Foo {
          bar: string;
          baz: int32;
        };
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    strictEqual(method.kind, "paging");

    const paging = method.pagingMetadata;
    ok(paging);
    ok(paging.itemPropertySegments);
    strictEqual(paging.itemPropertySegments[0], "items");
    const continuationToken = paging.continuationToken;
    ok(continuationToken);
    strictEqual(continuationToken.parameter.name, "token");
    strictEqual(continuationToken.parameter.location, RequestLocation.Header);
    strictEqual(continuationToken.responseLocation, ResponseLocation.Header);
    strictEqual(continuationToken.responseSegments.length, 1);
    strictEqual(continuationToken.responseSegments[0], "next-token");
  });

  it("header request body response", async () => {
    const program = await typeSpecCompile(
      `
        @list
        op link(@continuationToken @header token?: string): {
          @pageItems
          items: Foo[];
          @continuationToken nextToken?: string;
        };
        model Foo {
          bar: string;
          baz: int32;
        };
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    strictEqual(method.kind, "paging");

    const paging = method.pagingMetadata;
    ok(paging);
    ok(paging.itemPropertySegments);
    strictEqual(paging.itemPropertySegments[0], "items");
    const continuationToken = paging.continuationToken;
    ok(continuationToken);
    strictEqual(continuationToken.parameter.name, "token");
    strictEqual(continuationToken.parameter.nameInRequest, "token");
    strictEqual(continuationToken.parameter.location, RequestLocation.Header);
    strictEqual(continuationToken.responseLocation, ResponseLocation.Body);
    strictEqual(continuationToken.responseSegments.length, 1);
    strictEqual(continuationToken.responseSegments[0], "nextToken");
  });

  it("query request header response", async () => {
    const program = await typeSpecCompile(
      `
        @list
        op link(@continuationToken @query token?: string): {
          @pageItems
          items: Foo[];
          @header @continuationToken nextToken?: string;
        };
        model Foo {
          bar: string;
          baz: int32;
        };
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    strictEqual(method.kind, "paging");

    const paging = method.pagingMetadata;
    ok(paging);
    ok(paging.itemPropertySegments);
    strictEqual(paging.itemPropertySegments[0], "items");
    const continuationToken = paging.continuationToken;
    ok(continuationToken);
    strictEqual(continuationToken.parameter.name, "token");
    strictEqual(continuationToken.parameter.nameInRequest, "token");
    strictEqual(continuationToken.parameter.location, RequestLocation.Query);
    strictEqual(continuationToken.responseLocation, ResponseLocation.Header);
    strictEqual(continuationToken.responseSegments.length, 1);
    strictEqual(continuationToken.responseSegments[0], "next-token");
  });

  it("query request body response", async () => {
    const program = await typeSpecCompile(
      `
        @list
        op link(@continuationToken @query token?: string): {
          @pageItems
          items: Foo[];
          @continuationToken nextToken?: string;
        };
        model Foo {
          bar: string;
          baz: int32;
        };
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    strictEqual(method.kind, "paging");

    const paging = method.pagingMetadata;
    ok(paging);
    ok(paging.itemPropertySegments);
    strictEqual(paging.itemPropertySegments[0], "items");
    const continuationToken = paging.continuationToken;
    ok(continuationToken);
    strictEqual(continuationToken.parameter.name, "token");
    strictEqual(continuationToken.parameter.nameInRequest, "token");
    strictEqual(continuationToken.parameter.location, RequestLocation.Query);
    strictEqual(continuationToken.responseLocation, ResponseLocation.Body);
    strictEqual(continuationToken.responseSegments.length, 1);
    strictEqual(continuationToken.responseSegments[0], "nextToken");
  });

  it("query request invalid response location", async () => {
    const program = await typeSpecCompile(
      `
        @list
        op link(@continuationToken @query token?: string): {
          @pageItems
          items: Foo[];
          @query @continuationToken nextToken?: string;
        };
        model Foo {
          bar: string;
          baz: int32;
        };
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    strictEqual(method.kind, "paging");

    const paging = method.pagingMetadata;
    ok(paging);
    ok(paging.itemPropertySegments);
    strictEqual(paging.itemPropertySegments[0], "items");
    const continuationToken = paging.continuationToken;
    ok(continuationToken);
    strictEqual(continuationToken.parameter.name, "token");
    strictEqual(continuationToken.parameter.nameInRequest, "token");
    strictEqual(continuationToken.parameter.location, RequestLocation.Query);
    strictEqual(continuationToken.responseLocation, ResponseLocation.None);
    strictEqual(continuationToken.responseSegments.length, 1);
    strictEqual(continuationToken.responseSegments[0], "nextToken");
    strictEqual(program.diagnostics.length, 1);
    strictEqual(
      program.diagnostics[0].code,
      "@typespec/http-client-csharp/unsupported-continuation-location",
    );
    strictEqual(
      program.diagnostics[0].message,
      `Unsupported continuation location for operation ${root.clients[0].methods[0].operation.crossLanguageDefinitionId}.`,
    );
  });
});
