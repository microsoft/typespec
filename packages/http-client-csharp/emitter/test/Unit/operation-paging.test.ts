vi.resetModules();

import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it, vi } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
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
    const [root] = createModel(sdkContext);
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
        @list
        op link(...RequestOptions): LinkResult;

        model LinkResult {
          @pageItems
          items: Foo[];

          @nextLink
          next?: global.Azure.Core.Legacy.parameterizedNextLink<[RequestOptions.includePending, RequestOptions.includeExpired, RequestOptions.etagHeader, OtherRequestOptions.otherProp]>;
        }
  
        model RequestOptions {
          @query
          includePending?: boolean;

          @query
          includeExpired?: boolean;

          @header("ETag")
          etagHeader?: string;
        }

        model OtherRequestOptions {
          @query
          otherProp?: string;
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
    const [root] = createModel(sdkContext);
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
    strictEqual(parameterizedNextLink[0].kind, "query");
    strictEqual(parameterizedNextLink[1].name, "includeExpired");
    strictEqual(parameterizedNextLink[1].kind, "query");
    strictEqual(parameterizedNextLink[2].name, "etagHeader");
    strictEqual(parameterizedNextLink[2].kind, "header");
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
    const [root] = createModel(sdkContext);
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
    const [root] = createModel(sdkContext);
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
    const [root, modelDiagnostics] = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    strictEqual(method.kind, "paging");

    const paging = method.pagingMetadata;
    ok(paging);
    ok(paging.itemPropertySegments);
    strictEqual(paging.itemPropertySegments[0], "items");
    strictEqual(paging.nextLink?.responseLocation, ResponseLocation.None);
    strictEqual(paging.nextLink?.responseSegments.length, 1);
    strictEqual(paging.nextLink?.responseSegments[0], "next");

    strictEqual(modelDiagnostics.length, 1);
    strictEqual(
      modelDiagnostics[0].code,
      "@typespec/http-client-csharp/unsupported-continuation-location",
    );
    strictEqual(
      modelDiagnostics[0].message,
      `Unsupported continuation location for operation ${root.clients[0].methods[0].operation.crossLanguageDefinitionId}.`,
    );
  });

  it("includes protocol-only response model in code model (issue #9391)", async () => {
    const program = await typeSpecCompile(
      `
        @convenientAPI(false)
        @list
        op link(): {
          @pageItems
          items: Foo[];

          @nextLink
          next?: url;
        };
        model Foo {
          bar: string;
        };
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);

    // The anonymous response model containing the @nextLink property must be
    // included in the code model's models list, even though convenientAPI is
    // false, because the protocol-only paging code path still references it.
    const responseModel = root.models.find((m) => m.name === "LinkResponse");
    ok(
      responseModel,
      `Expected response model 'LinkResponse' to be present in code model. Found: ${root.models.map((m) => m.name).join(", ")}`,
    );
  });

  it("includes nested enum from protocol-only response model in code model", async () => {
    const program = await typeSpecCompile(
      `
        @convenientAPI(false)
        @list
        op link(): {
          @pageItems
          items: Foo[];

          @nextLink
          next?: url;
        };
        enum Status { running, completed, failed };
        model Foo {
          name: string;
          status: Status;
        };
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);

    // The enum used as a property type of a model only reachable via a
    // protocol-only paging operation must be included in the code model's
    // enums list, not just the models list.
    const statusEnum = root.enums.find((e) => e.name === "Status");
    ok(
      statusEnum,
      `Expected enum 'Status' to be present in code model enums. Found: ${root.enums.map((e) => e.name).join(", ")}`,
    );

    // The model itself should also be present
    const fooModel = root.models.find((m) => m.name === "Foo");
    ok(
      fooModel,
      `Expected model 'Foo' to be present in code model models. Found: ${root.models.map((m) => m.name).join(", ")}`,
    );
  });

  it("includes deeply nested enum from protocol-only response model in code model", async () => {
    const program = await typeSpecCompile(
      `
        @convenientAPI(false)
        @list
        op link(): {
          @pageItems
          items: Foo[];

          @nextLink
          next?: url;
        };
        enum Priority { low, medium, high };
        model Bar {
          priority: Priority;
        };
        model Foo {
          name: string;
          bar: Bar;
        };
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);

    // An enum nested two levels deep (Foo -> Bar -> Priority) must still
    // be captured when the entire graph is only reachable via a
    // protocol-only paging operation.
    const priorityEnum = root.enums.find((e) => e.name === "Priority");
    ok(
      priorityEnum,
      `Expected enum 'Priority' to be present in code model enums. Found: ${root.enums.map((e) => e.name).join(", ")}`,
    );

    const barModel = root.models.find((m) => m.name === "Bar");
    ok(
      barModel,
      `Expected model 'Bar' to be present in code model models. Found: ${root.models.map((m) => m.name).join(", ")}`,
    );

    const fooModel = root.models.find((m) => m.name === "Foo");
    ok(
      fooModel,
      `Expected model 'Foo' to be present in code model models. Found: ${root.models.map((m) => m.name).join(", ")}`,
    );
  });

  it("does not deduplicate enums with the same name but different namespaces", async () => {
    const program = await typeSpecCompile(
      `
        @convenientAPI(false)
        @list
        op link(): {
          @pageItems
          items: Foo[];

          @nextLink
          next?: url;
        };
        enum Status { active, inactive };
        namespace Sub {
          enum Status { open, closed };
        }
        model Foo {
          name: string;
          a: Status;
          b: Sub.Status;
        };
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);

    // Two enums share the name "Status" but live in different namespaces.
    // The namespace-aware key must keep both in the code model.
    const statusEnums = root.enums.filter((e) => e.name === "Status");
    strictEqual(
      statusEnums.length,
      2,
      `Expected 2 'Status' enums from different namespaces. Found ${statusEnums.length}: ${root.enums.map((e) => `${e.namespace}.${e.name}`).join(", ")}`,
    );
  });

  it("preserves same-named models from different namespaces across two paging operations", async () => {
    const program = await typeSpecCompile(
      `
        namespace NsA {
          enum Status { active, inactive };
          model Item {
            name: string;
            status: Status;
          };
        }
        namespace NsB {
          enum Status { open, closed };
          model Item {
            id: int32;
            status: Status;
          };
        }

        @convenientAPI(false)
        @list
        @route("/a")
        op listA(): {
          @pageItems
          items: NsA.Item[];
          @nextLink
          next?: url;
        };

        @convenientAPI(false)
        @list
        @route("/b")
        op listB(): {
          @pageItems
          items: NsB.Item[];
          @nextLink
          next?: url;
        };
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);

    // Two paging operations reference models named "Item" and enums named
    // "Status" from different namespaces. All four types must be present.
    const itemModels = root.models.filter((m) => m.name === "Item");
    strictEqual(
      itemModels.length,
      2,
      `Expected 2 'Item' models from different namespaces. Found ${itemModels.length}: ${root.models.map((m) => `${m.namespace}.${m.name}`).join(", ")}`,
    );

    const statusEnums = root.enums.filter((e) => e.name === "Status");
    strictEqual(
      statusEnums.length,
      2,
      `Expected 2 'Status' enums from different namespaces. Found ${statusEnums.length}: ${root.enums.map((e) => `${e.namespace}.${e.name}`).join(", ")}`,
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
    const [root] = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    strictEqual(method.kind, "paging");

    const paging = method.pagingMetadata;
    ok(paging);
    ok(paging.itemPropertySegments);
    strictEqual(paging.itemPropertySegments[0], "items");
    const continuationToken = paging.continuationToken;
    ok(continuationToken);
    strictEqual(continuationToken.parameter.name, "token");
    strictEqual(continuationToken.parameter.kind, "header");
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
    const [root] = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    strictEqual(method.kind, "paging");

    const paging = method.pagingMetadata;
    ok(paging);
    ok(paging.itemPropertySegments);
    strictEqual(paging.itemPropertySegments[0], "items");
    const continuationToken = paging.continuationToken;
    ok(continuationToken);
    strictEqual(continuationToken.parameter.name, "token");
    strictEqual(continuationToken.parameter.serializedName, "token");
    strictEqual(continuationToken.parameter.kind, "header");
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
    const [root] = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    strictEqual(method.kind, "paging");

    const paging = method.pagingMetadata;
    ok(paging);
    ok(paging.itemPropertySegments);
    strictEqual(paging.itemPropertySegments[0], "items");
    const continuationToken = paging.continuationToken;
    ok(continuationToken);
    strictEqual(continuationToken.parameter.name, "token");
    strictEqual(continuationToken.parameter.serializedName, "token");
    strictEqual(continuationToken.parameter.kind, "query");
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
    const [root] = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    strictEqual(method.kind, "paging");

    const paging = method.pagingMetadata;
    ok(paging);
    ok(paging.itemPropertySegments);
    strictEqual(paging.itemPropertySegments[0], "items");
    const continuationToken = paging.continuationToken;
    ok(continuationToken);
    strictEqual(continuationToken.parameter.name, "token");
    strictEqual(continuationToken.parameter.serializedName, "token");
    strictEqual(continuationToken.parameter.kind, "query");
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
    const [root, modelDiagnostics] = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    strictEqual(method.kind, "paging");

    const paging = method.pagingMetadata;
    ok(paging);
    ok(paging.itemPropertySegments);
    strictEqual(paging.itemPropertySegments[0], "items");
    const continuationToken = paging.continuationToken;
    ok(continuationToken);
    strictEqual(continuationToken.parameter.name, "token");
    strictEqual(continuationToken.parameter.serializedName, "token");
    strictEqual(continuationToken.parameter.kind, "query");
    strictEqual(continuationToken.responseLocation, ResponseLocation.None);
    strictEqual(continuationToken.responseSegments.length, 1);
    strictEqual(continuationToken.responseSegments[0], "nextToken");
    strictEqual(modelDiagnostics.length, 1);
    strictEqual(
      modelDiagnostics[0].code,
      "@typespec/http-client-csharp/unsupported-continuation-location",
    );
    strictEqual(
      modelDiagnostics[0].message,
      `Unsupported continuation location for operation ${root.clients[0].methods[0].operation.crossLanguageDefinitionId}.`,
    );
  });
});

describe("PageSize parameter operations", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("pageSize parameter with query", async () => {
    const program = await typeSpecCompile(
      `
        @list
        op link(@pageSize @query maxpagesize?: int32): {
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
    const [root] = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    strictEqual(method.kind, "paging");

    const paging = method.pagingMetadata;
    ok(paging);
    ok(paging.itemPropertySegments);
    strictEqual(paging.itemPropertySegments[0], "items");

    // Check if pageSizeParameterSegments is populated when @pageSize is present
    if (paging.pageSizeParameterSegments) {
      strictEqual(paging.pageSizeParameterSegments.length, 1);
      strictEqual(paging.pageSizeParameterSegments[0], "maxpagesize");
    }
  });

  it("should use original name for itemPropertySegments when pageItems is renamed via clientName", async () => {
    const program = await typeSpecCompile(
      `
        @list
        op link(): {
          @pageItems
          @clientName("RenamedItems")
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
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    strictEqual(method.kind, "paging");

    const paging = method.pagingMetadata;
    ok(paging);
    ok(paging.itemPropertySegments);
    strictEqual(paging.itemPropertySegments[0], "items");
  });
});
