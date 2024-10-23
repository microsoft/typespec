import { Interface, Namespace, Operation } from "@typespec/compiler";
import { TestHost, expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { getAllTagMetadatas } from "./../src/decorators.js";
import { createOpenAPITestHost, diagnoseOpenApiFor, openApiFor } from "./test-host.js";

describe("openapi3: tagMetadata", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createOpenAPITestHost();
  });

  it("applies @tagMetadata decorator to namespaces, interfaces, and operations", async (): Promise<void> => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "@typespec/openapi3";
      using TypeSpec.OpenAPI;

      @test
      @tagMetadata("namespace")
      namespace OpNamespace {
        @test
        @tagMetadata("namespaceOp")
        op NamespaceOperation(): string;
      }

      @test
      @tagMetadata("interface")
      interface OpInterface {
        @test
        @tagMetadata("interfaceOp")
        InterfaceOperation(): string;
      }

      @test
      interface UntaggedInterface {
        @test
        @tagMetadata("taggedOp")
        TaggedOperation(): string;
      }

      @test
      @tagMetadata("recursiveNamespace")
      namespace RecursiveNamespace {
        @test
        @tagMetadata("recursiveInterface")
        interface RecursiveInterface {
          @test
          @tagMetadata("recursiveOperation")
          RecursiveOperation(): string;
        }
      }
      `,
    );

    const {
      OpNamespace,
      OpInterface,
      NamespaceOperation,
      UntaggedInterface,
      InterfaceOperation,
      TaggedOperation,
      RecursiveNamespace,
      RecursiveInterface,
      RecursiveOperation,
    } = (await testHost.compile("./")) as {
      OpNamespace: Namespace;
      OpInterface: Interface;
      UntaggedInterface: Interface;
      NamespaceOperation: Operation;
      InterfaceOperation: Operation;
      TaggedOperation: Operation;
      RecursiveNamespace: Namespace;
      RecursiveInterface: Interface;
      RecursiveOperation: Operation;
    };

    deepStrictEqual(getAllTagMetadatas(testHost.program, OpNamespace), [{ name: "namespace" }]);
    deepStrictEqual(getAllTagMetadatas(testHost.program, OpInterface), [{ name: "interface" }]);
    deepStrictEqual(getAllTagMetadatas(testHost.program, UntaggedInterface), undefined);
    deepStrictEqual(getAllTagMetadatas(testHost.program, NamespaceOperation), [
      { name: "namespace" },
      { name: "namespaceOp" },
    ]);
    deepStrictEqual(getAllTagMetadatas(testHost.program, InterfaceOperation), [
      { name: "interface" },
      { name: "interfaceOp" },
    ]);
    deepStrictEqual(getAllTagMetadatas(testHost.program, TaggedOperation), [{ name: "taggedOp" }]);

    // Check recursive tag walking
    deepStrictEqual(getAllTagMetadatas(testHost.program, RecursiveNamespace), [
      { name: "recursiveNamespace" },
    ]);
    deepStrictEqual(getAllTagMetadatas(testHost.program, RecursiveInterface), [
      { name: "recursiveNamespace" },
      { name: "recursiveInterface" },
    ]);
    deepStrictEqual(getAllTagMetadatas(testHost.program, RecursiveOperation), [
      { name: "recursiveNamespace" },
      { name: "recursiveInterface" },
      { name: "recursiveOperation" },
    ]);
  });

  it("emit diagnostic if tagName is not a string", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
      @tagMetadata(123)
      namespace PetStore{};
      `,
    );

    expectDiagnostics(diagnostics, {
      code: "invalid-argument",
    });
  });

  it("emit diagnostic if description is not a string", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
      @tagMetadata("tagName", { description: 123, })
      namespace PetStore{};
      `,
    );

    expectDiagnostics(diagnostics, {
      code: "invalid-argument",
    });
  });

  it("set the additional information with @tagMetadata decorator", async () => {
    const res = await openApiFor(
      `
      @service
      @tagMetadata(
        "pet",
        {
          description: "Pets operations",
          externalDocs: {
            url: "https://example.com",
            description: "More info.",
          },
        }
      )
      namespace PetStore {
        op NamespaceOperation(): string;
      }
      `,
    );
    deepStrictEqual(res.paths["/"].get.tags, ["pet"]);
    deepStrictEqual(res.tags, [
      {
        name: "pet",
        description: "Pets operations",
        externalDocs: {
          description: "More info.",
          url: "https://example.com",
        },
      },
    ]);
  });
});
