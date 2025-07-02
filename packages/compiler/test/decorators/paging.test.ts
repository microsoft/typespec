import { beforeEach, describe, expect, it } from "vitest";
import { ignoreDiagnostics, ModelProperty, Operation } from "../../src/index.js";
import { getPagingOperation, PagingOperation } from "../../src/lib/paging.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../src/testing/expect.js";
import { createTestRunner } from "../../src/testing/test-host.js";
import { BasicTestRunner } from "../../src/testing/types.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createTestRunner();
});

it("emit conflict diagnostic if annotating property with different paging property marker", async () => {
  const diagnostics = await runner.diagnose(`
    @list op list(): {
      @pageItems items: string[];
      @nextLink @prevLink next: string;
    };
  `);

  expectDiagnostics(diagnostics, {
    code: "incompatible-paging-props",
    message: `Paging property has multiple types: 'nextLink, prevLink'`,
  });
});

it("emit error if missing pageItems property", async () => {
  const diagnostics = await runner.diagnose(`
    @list op list(): {
      items: string[];
      @nextLink next: string;
    };
  `);

  expectDiagnostics(diagnostics, {
    code: "missing-paging-items",
    message: `Paged operation 'list' return type must have a property annotated with @pageItems.`,
  });
});

it("identifies inherited paging properties", async () => {
  const diagnostics = await runner.diagnose(`
    model ListTestResult {
      @pageItems
      values: string[];
    }
    model ExtendedListTestResult extends ListTestResult {}

    @list op testOp(): ExtendedListTestResult;
  `);

  expectDiagnosticEmpty(diagnostics);
});

it("@list decorator handle recursive models without infinite loop", async () => {
  const diagnostics = await runner.diagnose(`
      model MyPage {
        selfRef?: MyPage;
        @pageItems items: string[];
        @nextLink next: string;
      }

      @list op foo(): MyPage;
    `);
  expectDiagnosticEmpty(diagnostics);
});

describe("emit conflict diagnostic if multiple properties are annotated with the same property marker", () => {
  it.each([
    ["offset", "int32"],
    ["pageSize", "int32"],
    ["pageIndex", "int32"],
    ["continuationToken", "string"],
  ])("@%s", async (name, type) => {
    const diagnostics = await runner.diagnose(`
    @list op list(
      @${name} prop1: ${type};
      @${name} prop2: ${type};
    ): { @pageItems items: string[] };
  `);

    expectDiagnostics(diagnostics, [
      {
        code: "duplicate-paging-prop",
        message: `Duplicate property paging '${name}' for operation list.`,
      },
      {
        code: "duplicate-paging-prop",
        message: `Duplicate property paging '${name}' for operation list.`,
      },
    ]);
  });

  it.each([
    ["nextLink", "string"],
    ["prevLink", "string"],
    ["firstLink", "string"],
    ["lastLink", "string"],
    ["continuationToken", "string"],
    ["pageItems", "string[]"],
  ])("@%s", async (name, type) => {
    const diagnostics = await runner.diagnose(`
    @list op list(): {
      @${name} next: ${type};
      @${name} nextToo: ${type};
      ${name !== "pageItems" ? "@pageItems items: string[];" : ""}
    };
  `);

    expectDiagnostics(diagnostics, [
      {
        code: "duplicate-paging-prop",
        message: `Duplicate property paging '${name}' for operation list.`,
      },
      {
        code: "duplicate-paging-prop",
        message: `Duplicate property paging '${name}' for operation list.`,
      },
    ]);
  });
});

describe("collect paging properties", () => {
  it.each([
    ["offset", "int32"],
    ["pageSize", "int32"],
    ["pageIndex", "int32"],
    ["continuationToken", "string"],
  ])("@%s", async (name, type) => {
    const { list, prop } = (await runner.compile(`
      @list @test op list(
        @${name} @test prop: ${type};
      ): { @pageItems items: string[] };
    `)) as { list: Operation; prop: ModelProperty };

    const paging = ignoreDiagnostics(getPagingOperation(runner.program, list));
    expect(paging?.input).toHaveProperty(name);
    expect(paging?.input[name as keyof PagingOperation["input"]]!.property).toBe(prop);
  });

  it.each([
    ["nextLink", "string"],
    ["prevLink", "string"],
    ["firstLink", "string"],
    ["lastLink", "string"],
    ["continuationToken", "string"],
    ["pageItems", "string[]"],
  ])("@%s", async (name, type) => {
    const { list, prop } = (await runner.compile(`
        @list @test op list(): {
          @${name} @test prop: ${type};
          ${name !== "pageItems" ? "@pageItems items: string[];" : ""}
        };
      `)) as { list: Operation; prop: ModelProperty };

    const paging = ignoreDiagnostics(getPagingOperation(runner.program, list));
    expect(paging?.output).toHaveProperty(name);
    expect(paging?.output[name as keyof PagingOperation["output"]]!.property).toBe(prop);
  });
});

describe("collect nested paging properties", () => {
  it.each([
    ["offset", "int32"],
    ["pageSize", "int32"],
    ["pageIndex", "int32"],
    ["continuationToken", "string"],
  ])("@%s", async (name, type) => {
    const { list, prop } = (await runner.compile(`
      @list @test op list(
        @${name} @test prop: ${type};
      ): { @pageItems items: string[] };
    `)) as { list: Operation; prop: ModelProperty };

    const paging = ignoreDiagnostics(getPagingOperation(runner.program, list));
    expect(paging?.input).toHaveProperty(name);
    expect(paging?.input[name as keyof PagingOperation["input"]]!.property).toBe(prop);
  });

  it.each([
    ["nextLink", "string"],
    ["prevLink", "string"],
    ["firstLink", "string"],
    ["lastLink", "string"],
    ["continuationToken", "string"],
  ])("@%s", async (name, type) => {
    const { list, prop } = (await runner.compile(`
        @list @test op list(): {
          @test results : { @pageItems items: string[]; };
          @test pagination: { @${name} @test prop: ${type} };
        };
      `)) as { list: Operation; prop: ModelProperty; items: ModelProperty };

    const paging = ignoreDiagnostics(getPagingOperation(runner.program, list));
    expect(paging?.output).toHaveProperty(name);
    expect(paging?.output[name as keyof PagingOperation["output"]]!.property).toBe(prop);
    const pathString = paging?.output[name as keyof PagingOperation["output"]]!.path.map(
      (p) => p.name,
    ).join(".");
    expect(pathString).toBe("pagination.prop");
  });

  it("nested @pageItem", async () => {
    const { list } = (await runner.compile(`
        @list @test op list(): {
          @test results : { @pageItems items: string[]; };
        };
      `)) as { list: Operation; items: ModelProperty };

    const paging = ignoreDiagnostics(getPagingOperation(runner.program, list));
    const pathString = paging?.output["pageItems"]!.path.map((p) => p.name).join(".");
    expect(pathString).toBe("results.items");
  });
});

describe("nested paging with XML-like structure", () => {
  it("identifies paging properties with nested XML-like structure", async () => {
    const result = await runner.compile(`
        /** The blob flat list segment. */
        model BlobFlatListSegment {
          /** The blob items. */
          @pageItems
          blobItems: string[];
        }

        /** An enumeration of blobs. */
        model ListBlobsFlatSegmentResponse {
          /** The container name. */
          containerName: string;

          /** The blob segment. */
          segment: BlobFlatListSegment;

          /** The next marker of the blobs. */
          @continuationToken
          nextMarker?: string;
        }

        @list @test
        op listBlobFlatSegment(
          @continuationToken
          marker?: string;
        ): {
          /** The list of blobs */
          enumerationResults: ListBlobsFlatSegmentResponse;
        };
      `);

    const list = result.listBlobFlatSegment;
    
    // Basic validation that the operation was compiled successfully
    expect(list).toBeDefined();
    expect(list.kind).toBe("Operation");
    expect(list.parameters).toBeDefined();
    
    const paging = ignoreDiagnostics(getPagingOperation(runner.program, list));
    
    // Verify paging operation is recognized
    expect(paging).toBeDefined();
    
    // Verify pageItems is found in nested structure (similar to XML blob structure)
    expect(paging?.output).toHaveProperty("pageItems");
    const pageItemsPath = paging?.output["pageItems"]!.path.map((p) => p.name).join(".");
    expect(pageItemsPath).toBe("enumerationResults.segment.blobItems");
    
    // Verify continuationToken is found in nested structure (similar to XML NextMarker)
    expect(paging?.output).toHaveProperty("continuationToken");
    const continuationTokenPath = paging?.output["continuationToken"]!.path.map((p) => p.name).join(".");
    expect(continuationTokenPath).toBe("enumerationResults.nextMarker");
    
    // Verify input continuation token
    expect(paging?.input).toHaveProperty("continuationToken");
  });

  it("identifies paging properties in deeply nested structure", async () => {
    const result = await runner.compile(`
        /** Items container */
        model ItemsContainer {
          @pageItems
          items: string[];
        }

        /** Pagination info */
        model PaginationInfo {
          @continuationToken
          next?: string;
        }

        /** Nested response structure (similar to XML structure) */
        model NestedResponse {
          data: {
            itemsContainer: ItemsContainer;
            paginationInfo: PaginationInfo;
          };
        }

        @list @test
        op listItems(
          @continuationToken
          token?: string;
        ): {
          response: NestedResponse;
        };
      `);

    const list = result.listItems;

    // Basic validation that the operation was compiled successfully
    expect(list).toBeDefined();
    expect(list.kind).toBe("Operation");
    expect(list.parameters).toBeDefined();

    const paging = ignoreDiagnostics(getPagingOperation(runner.program, list));
    
    // Verify paging operation is recognized
    expect(paging).toBeDefined();
    
    // Verify pageItems is found in deeply nested structure
    expect(paging?.output).toHaveProperty("pageItems");
    const pageItemsPath = paging?.output["pageItems"]!.path.map((p) => p.name).join(".");
    expect(pageItemsPath).toBe("response.data.itemsContainer.items");
    
    // Verify continuationToken is found in deeply nested structure
    expect(paging?.output).toHaveProperty("continuationToken");
    const continuationTokenPath = paging?.output["continuationToken"]!.path.map((p) => p.name).join(".");
    expect(continuationTokenPath).toBe("response.data.paginationInfo.next");
  });

  it("handles complex nested paging scenarios like Azure Storage", async () => {
    const result = await runner.compile(`
        /** Represents a blob entry */
        model BlobEntry {
          name: string;
          size: int64;
        }

        /** Container for blob list */
        model BlobList {
          @pageItems
          blobs: BlobEntry[];
        }

        /** Metadata about the container */
        model ContainerMetadata {
          name: string;
          lastModified: string;
        }

        /** Main response envelope similar to Azure Storage XML structure */
        model EnumerationResults {
          metadata: ContainerMetadata;
          blobList: BlobList;
          @continuationToken
          nextMarker?: string;
          maxResults?: int32;
        }

        @list @test
        op listBlobs(
          @continuationToken
          continuationMarker?: string;
          
          maxResults?: int32;
        ): {
          response: EnumerationResults;
        };
      `);

    const list = result.listBlobs;

    // Basic validation that the operation was compiled successfully
    expect(list).toBeDefined();
    expect(list.kind).toBe("Operation");
    expect(list.parameters).toBeDefined();

    const paging = ignoreDiagnostics(getPagingOperation(runner.program, list));
    
    // Verify paging operation is recognized
    expect(paging).toBeDefined();
    
    // Verify pageItems is found in the blob list structure
    expect(paging?.output).toHaveProperty("pageItems");
    const pageItemsPath = paging?.output["pageItems"]!.path.map((p) => p.name).join(".");
    expect(pageItemsPath).toBe("response.blobList.blobs");
    
    // Verify continuationToken is found at the response level
    expect(paging?.output).toHaveProperty("continuationToken");
    const continuationTokenPath = paging?.output["continuationToken"]!.path.map((p) => p.name).join(".");
    expect(continuationTokenPath).toBe("response.nextMarker");
    
    // Verify input continuation token
    expect(paging?.input).toHaveProperty("continuationToken");
    expect(paging?.input["continuationToken"]!.property.name).toBe("continuationMarker");
  });
});
