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
    const paging = root.Clients[0].Operations[0].Paging;
    ok(paging);
    ok(paging.ItemPropertySegments);
    strictEqual(paging.ItemPropertySegments[0], "items");
    strictEqual(paging.NextLink?.ResponseLocation, ResponseLocation.Body);
    strictEqual(paging.NextLink?.ResponseSegments.length, 1);
    strictEqual(paging.NextLink?.ResponseSegments[0], "next");
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
    const paging = root.Clients[0].Operations[0].Paging;
    ok(paging);
    ok(paging.ItemPropertySegments);
    strictEqual(paging.ItemPropertySegments[0], "items");
    strictEqual(paging.NextLink?.ResponseLocation, ResponseLocation.Header);
    strictEqual(paging.NextLink?.ResponseSegments.length, 1);
    strictEqual(paging.NextLink?.ResponseSegments[0], "next");
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
    const paging = root.Clients[0].Operations[0].Paging;
    ok(paging);
    ok(paging.ItemPropertySegments);
    strictEqual(paging.ItemPropertySegments[0], "items");
    strictEqual(paging.NextLink?.ResponseLocation, ResponseLocation.Body);
    strictEqual(paging.NextLink?.ResponseSegments.length, 2);
    strictEqual(paging.NextLink?.ResponseSegments[0], "next");
    strictEqual(paging.NextLink?.ResponseSegments[1], "nested");
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
    const paging = root.Clients[0].Operations[0].Paging;
    ok(paging);
    ok(paging.ItemPropertySegments);
    strictEqual(paging.ItemPropertySegments[0], "items");
    strictEqual(paging.NextLink?.ResponseLocation, ResponseLocation.None);
    strictEqual(paging.NextLink?.ResponseSegments.length, 1);
    strictEqual(paging.NextLink?.ResponseSegments[0], "next");

    strictEqual(program.diagnostics.length, 1);
    strictEqual(
      program.diagnostics[0].code,
      "@typespec/http-client-csharp/unsupported-continuation-location",
    );
    strictEqual(
      program.diagnostics[0].message,
      `Unsupported continuation location for operation ${root.Clients[0].Operations[0].CrossLanguageDefinitionId}.`,
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
    const paging = root.Clients[0].Operations[0].Paging;
    ok(paging);
    ok(paging.ItemPropertySegments);
    strictEqual(paging.ItemPropertySegments[0], "items");
    const continuationToken = paging.ContinuationToken;
    ok(continuationToken);
    strictEqual(continuationToken.Parameter.Name, "token");
    strictEqual(continuationToken.Parameter.Location, RequestLocation.Header);
    strictEqual(continuationToken.ResponseLocation, ResponseLocation.Header);
    strictEqual(continuationToken.ResponseSegments.length, 1);
    strictEqual(continuationToken.ResponseSegments[0], "next-token");
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
    const paging = root.Clients[0].Operations[0].Paging;
    ok(paging);
    ok(paging.ItemPropertySegments);
    strictEqual(paging.ItemPropertySegments[0], "items");
    const continuationToken = paging.ContinuationToken;
    ok(continuationToken);
    strictEqual(continuationToken.Parameter.Name, "token");
    strictEqual(continuationToken.Parameter.NameInRequest, "token");
    strictEqual(continuationToken.Parameter.Location, RequestLocation.Header);
    strictEqual(continuationToken.ResponseLocation, ResponseLocation.Body);
    strictEqual(continuationToken.ResponseSegments.length, 1);
    strictEqual(continuationToken.ResponseSegments[0], "nextToken");
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
    const paging = root.Clients[0].Operations[0].Paging;
    ok(paging);
    ok(paging.ItemPropertySegments);
    strictEqual(paging.ItemPropertySegments[0], "items");
    const continuationToken = paging.ContinuationToken;
    ok(continuationToken);
    strictEqual(continuationToken.Parameter.Name, "token");
    strictEqual(continuationToken.Parameter.NameInRequest, "token");
    strictEqual(continuationToken.Parameter.Location, RequestLocation.Query);
    strictEqual(continuationToken.ResponseLocation, ResponseLocation.Header);
    strictEqual(continuationToken.ResponseSegments.length, 1);
    strictEqual(continuationToken.ResponseSegments[0], "next-token");
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
    const paging = root.Clients[0].Operations[0].Paging;
    ok(paging);
    ok(paging.ItemPropertySegments);
    strictEqual(paging.ItemPropertySegments[0], "items");
    const continuationToken = paging.ContinuationToken;
    ok(continuationToken);
    strictEqual(continuationToken.Parameter.Name, "token");
    strictEqual(continuationToken.Parameter.NameInRequest, "token");
    strictEqual(continuationToken.Parameter.Location, RequestLocation.Query);
    strictEqual(continuationToken.ResponseLocation, ResponseLocation.Body);
    strictEqual(continuationToken.ResponseSegments.length, 1);
    strictEqual(continuationToken.ResponseSegments[0], "nextToken");
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
    const paging = root.Clients[0].Operations[0].Paging;
    ok(paging);
    ok(paging.ItemPropertySegments);
    strictEqual(paging.ItemPropertySegments[0], "items");
    const continuationToken = paging.ContinuationToken;
    ok(continuationToken);
    strictEqual(continuationToken.Parameter.Name, "token");
    strictEqual(continuationToken.Parameter.NameInRequest, "token");
    strictEqual(continuationToken.Parameter.Location, RequestLocation.Query);
    strictEqual(continuationToken.ResponseLocation, ResponseLocation.None);
    strictEqual(continuationToken.ResponseSegments.length, 1);
    strictEqual(continuationToken.ResponseSegments[0], "nextToken");
    strictEqual(program.diagnostics.length, 1);
    strictEqual(
      program.diagnostics[0].code,
      "@typespec/http-client-csharp/unsupported-continuation-location",
    );
    strictEqual(
      program.diagnostics[0].message,
      `Unsupported continuation location for operation ${root.Clients[0].Operations[0].CrossLanguageDefinitionId}.`,
    );
  });
});
