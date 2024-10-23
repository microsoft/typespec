import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { FoldingRange } from "vscode-languageserver/node.js";
import { createTestServerHost } from "../../src/testing/test-server-host.js";

describe("compiler: server: foldingRange", () => {
  it("includes consecutive single line comments separated by whitespaces in folding range", async () => {
    const ranges = await getFoldingRanges(`//foo
    
    //bar

    //test`);
    deepStrictEqual(ranges, [{ endCharacter: 10, endLine: 4, startCharacter: 0, startLine: 0 }]);
  });

  it("doesn't fold consecutive single and multi-line comment together", async () => {
    const ranges = await getFoldingRanges(`*/
    foobar
    */

    //bar

    //test`);
    deepStrictEqual(ranges, [
      { endCharacter: 10, endLine: 6, startCharacter: 4, startLine: 4 },
      { endCharacter: 6, endLine: 2, startCharacter: 0, startLine: 0 },
    ]);
  });

  it("single line comments separated by multiple line comments does not fold", async () => {
    const ranges = await getFoldingRanges(`//foo
    /*foobar*/
    //bar
    /*bartest*/
    //test`);
    deepStrictEqual(ranges, []);
  });

  it("single line comments separated by  decorators does not fold", async () => {
    const ranges = await getFoldingRanges(`//foo
    @doc("foobar")
    //bar`);
    deepStrictEqual(ranges, []);
  });

  it("includes comments in folding range", async () => {
    const ranges = await getFoldingRanges(`/**
    description of model foo
    **/`);
    deepStrictEqual(ranges, [{ endCharacter: 7, endLine: 2, startCharacter: 0, startLine: 0 }]);
  });

  it("does not include one line comments in folding range", async () => {
    const ranges = await getFoldingRanges(`//foo`);
    deepStrictEqual(ranges, []);
  });

  it("includes decorator in folding range", async () => {
    const ranges = await getFoldingRanges(`@doc("Error")
    @doc("Foo")
    @doc("bar")
    @doc("FooBar")`);
    deepStrictEqual(ranges, [{ endCharacter: 18, endLine: 3, startCharacter: 0, startLine: 0 }]);
  });

  it("includes model in folding range", async () => {
    const ranges = await getFoldingRanges(`model Error {
      code: int32;}`);
    deepStrictEqual(ranges, [{ endCharacter: 19, endLine: 1, startCharacter: 0, startLine: 0 }]);
  });

  it("includes model and decorators in folding range", async () => {
    const ranges = await getFoldingRanges(`@doc("Error")
    @doc("Foo")
    @doc("bar")
    model Error {
      code: int32;
      message: string;
    }`);
    deepStrictEqual(ranges, [
      { endCharacter: 15, endLine: 2, startCharacter: 0, startLine: 0 },
      { endCharacter: 5, endLine: 6, startCharacter: 4, startLine: 3 },
    ]);
  });

  it("includes op in folding range", async () => {
    const ranges = await getFoldingRanges(`op delete(...PetId): {
      ...Response<200>;
    } | Error;`);
    deepStrictEqual(ranges, [
      { endCharacter: 14, endLine: 2, startCharacter: 0, startLine: 0 },
      { endCharacter: 13, endLine: 2, startCharacter: 9, startLine: 0 },
      { endCharacter: 13, endLine: 2, startCharacter: 21, startLine: 0 },
      { endCharacter: 5, endLine: 2, startCharacter: 21, startLine: 0 },
    ]);
  });

  it("includes namespace in folding range", async () => {
    const ranges = await getFoldingRanges(`namespace Foo {
    }`);
    deepStrictEqual(ranges, [{ endCharacter: 5, endLine: 1, startCharacter: 0, startLine: 0 }]);
  });

  it("includes namespace and decorator in folding range", async () => {
    const ranges = await getFoldingRanges(`namespace Foo {
      @doc("Delete Foo")
      @doc("Create Foo") }`);
    deepStrictEqual(ranges, [
      { endCharacter: 26, endLine: 2, startCharacter: 0, startLine: 0 },
      { endCharacter: 24, endLine: 2, startCharacter: 6, startLine: 1 },
    ]);
  });

  it("includes decorator before namespace in folding range", async () => {
    const ranges = await getFoldingRanges(`@doc("Delete Foo")
    @doc("Create Foo") 
    namespace Foo {
 }`);
    deepStrictEqual(ranges, [
      { endCharacter: 22, endLine: 1, startCharacter: 0, startLine: 0 },
      { endCharacter: 2, endLine: 3, startCharacter: 4, startLine: 2 },
    ]);
  });

  it("folding range with one line", async () => {
    const ranges = await getFoldingRanges(`@doc("Delete Foo")`);
    deepStrictEqual(ranges, []);
  });

  async function getFoldingRanges(source: string): Promise<FoldingRange[]> {
    const testHost = await createTestServerHost();
    const textDocument = testHost.addOrUpdateDocument("test/test.tsp", source);
    return await testHost.server.getFoldingRanges({
      textDocument,
    });
  }
});
