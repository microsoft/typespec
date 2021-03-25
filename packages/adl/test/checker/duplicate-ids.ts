import { strictEqual, ok, rejects } from "assert";
import { ModelType, NamespaceType, Type } from "../../compiler/types.js";
import { createTestHost, TestHost } from "../test-host.js";

describe("duplicate declarations", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("throws for duplicate template parameters", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      model A<T, T> { }
    `
    );

    await rejects(testHost.compile("/"));
  });

  it("throws for duplicate model declarations in global scope", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      model A { }
      model A { }
    `
    );

    await rejects(testHost.compile("/"));
  });

  it("throws for duplicate model declarations in a single namespace", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      namespace Foo;
      model A { }
      model A { }
    `
    );

    await rejects(testHost.compile("/"));
  });

  it("throws for duplicate model declarations in across multiple namespaces", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      namespace N {
        model A { };
      }

      namespace N {
        model A { };
      }
    `
    );

    await rejects(testHost.compile("/"));
  });

  it("throws for duplicate model declarations in across multiple files and namespaces", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      namespace N {
        model A { };
      }
    `
    );
    testHost.addAdlFile(
      "b.adl",
      `
      namespace N {
        model A { };
      }
    `
    );

    await rejects(testHost.compile("/"));
  });
});
