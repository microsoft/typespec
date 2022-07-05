import { deepStrictEqual } from "assert";
import {
  FoldingRange,
} from "vscode-languageserver/node.js";
import { createTestServerHost} from "../../testing/test-server-host.js";

describe("compiler: server: foldingRange", () => {

  it("testing for foldingRange with doc", async () => {
    const ranges = await getFoldingRanges(`@doc("Error")
    @doc("Foo")
    @doc("bar")
    @doc("FooBar")`);
    deepStrictEqual(ranges,[ 
      { startLine: 0, endLine: 3 },
     ]);
  });

  it("testing for foldingRange with model", async () => {
    const ranges = await getFoldingRanges(`model Error {
      code: int32;}`);
    deepStrictEqual(ranges,[ 
      { startLine: 0, endLine: 1 },
     ]);
  });

  it("testing for foldingRange with doc outside of model", async () => {
    const ranges = await getFoldingRanges(`@doc("Error")
    @doc("Foo")
    @doc("bar")
    model Error {
      code: int32;
      message: string;
    }`);
    deepStrictEqual(ranges,[ 
      { startLine: 0, endLine: 2 },
      { startLine: 3, endLine: 6 }
     ]);
  });

  it("testing for foldingRange with op", async () => {
    const ranges = await getFoldingRanges(`op delete(...PetId): {
      ...Response<200>;
    } | Error;`);
    deepStrictEqual(ranges,     [ 
      { startLine: 0, endLine: 2 }
     ]);
  });

  it("testing for foldingRange with of namespace", async () => {
    const ranges = await getFoldingRanges(`namespace Foo {
    }`);
    deepStrictEqual(ranges,     [ 
      { startLine: 0, endLine: 1 }
     ]);
  });

  it("testing for foldingRange with doc inside of namespace", async () => {
    const ranges = await getFoldingRanges(`namespace Foo {
      @doc("Delete Foo")
      @doc("Create Foo") }`);
    deepStrictEqual(ranges,     [ 
      { startLine: 0, endLine: 2 },
      { startLine: 1, endLine: 2 }
     ]);
  });

  it("testing for foldingRange with doc outside of namespace", async () => {
    const ranges = await getFoldingRanges(`@doc("Delete Foo")
    @doc("Create Foo") 
    namespace Foo {
 }`);
    deepStrictEqual(ranges,     [ 
      { startLine: 0, endLine: 1 },
      { startLine: 2, endLine: 3 }
     ]);
  });

  it("testing folding does not occur with one line", async () => {
    const ranges = await getFoldingRanges(`@doc("Delete Foo")`);
    deepStrictEqual(ranges,[]);
  });

async function getFoldingRanges(
  source: string,
): Promise<FoldingRange[]> {
  const testHost = await createTestServerHost();
  const textDocument = testHost.addOrUpdateDocument("test/test.cadl", source);
  return await testHost.server.getFoldingRanges({
    textDocument
  });
}
});
