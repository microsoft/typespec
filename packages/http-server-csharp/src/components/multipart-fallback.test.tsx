import { Tester } from "#test/tester.js";
import { SourceDirectory, render } from "@alloy-js/core";
import { Namespace, createCSharpNamePolicy } from "@alloy-js/csharp";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { Output } from "@typespec/emitter-framework";
import { beforeEach, expect, it } from "vitest";
import { EmitterOptions } from "../context/emitter-options-context.js";
import { ControllersAndInterfaces } from "./render-root.jsx";
import { MockImplementations } from "./scaffolding/mock-implementations.jsx";

let runner: TesterInstance;

beforeEach(async () => {
  runner = await Tester.createInstance();
});

function findFileContent(output: any, pathSuffix: string): string | undefined {
  function search(dir: any): string | undefined {
    for (const item of dir.contents) {
      if (
        "contents" in item &&
        typeof item.contents === "string" &&
        (item.path === pathSuffix || item.path.endsWith("/" + pathSuffix))
      ) {
        return item.contents;
      }
      if ("contents" in item && Array.isArray(item.contents)) {
        const found = search(item);
        if (found) return found;
      }
    }
    return undefined;
  }
  return search(output);
}

it("keeps multipart interfaces and mocks aligned without canonical metadata", async () => {
  const { PetStore } = await runner.compile(t.code`
    model MultipartParts {
      metadata: HttpPart<string>;
      code: HttpPart<bytes>;
    }

    model DerivedMultipartParts {
      ...MultipartParts;
    }

    interface ${t.interface("PetStore")} {
      @post upload(
        @header contentType: "multipart/form-data",
        @header checksum: string,
        @multipartBody content: DerivedMultipartParts,
      ): void;
    }
  `);

  const canonicalOpsMap = new Map();
  const output = render(
    <Output program={runner.program} namePolicy={createCSharpNamePolicy()}>
      <EmitterOptions.Provider value={{ collectionType: "array", serviceNamespace: "Test" }}>
        <SourceDirectory path=".">
          <Namespace name="Test">
            <SourceDirectory path="generated">
              <ControllersAndInterfaces interfaces={[PetStore]} canonicalOpsMap={canonicalOpsMap} />
            </SourceDirectory>
            <MockImplementations interfaces={[PetStore]} canonicalOpsMap={canonicalOpsMap} />
          </Namespace>
        </SourceDirectory>
      </EmitterOptions.Provider>
    </Output>,
  );

  const interfaceContent = findFileContent(output, "operations/IPetStore.cs");
  const mockContent = findFileContent(output, "mocks/PetStore.cs");

  expect(interfaceContent).toContain("using Microsoft.AspNetCore.WebUtilities;");
  expect(interfaceContent).toContain("UploadAsync(string checksum, MultipartReader reader)");
  expect(mockContent).toContain("using Microsoft.AspNetCore.WebUtilities;");
  expect(mockContent).toContain("UploadAsync(string checksum, MultipartReader reader)");
  expect(interfaceContent).not.toContain("Unresolved Symbol");
  expect(mockContent).not.toContain("Unresolved Symbol");
});
