import { Output, render } from "@alloy-js/core";
import { describe, expect, it } from "vitest";
import { MockHelpers } from "./mock-scaffolding.jsx";

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

describe("MockHelpers", () => {
  it("renders initializer interface", () => {
    const output = render(
      <Output>
        <MockHelpers interfaceRegistrations={[]} />
      </Output>,
    );
    const content = findFileContent(output, "IInitializer.cs");
    expect(content).toBeDefined();
    expect(content).toContain("IInitializer");
  });

  it("renders initializer implementation", () => {
    const output = render(
      <Output>
        <MockHelpers interfaceRegistrations={[]} />
      </Output>,
    );
    const content = findFileContent(output, "Initializer.cs");
    expect(content).toBeDefined();
    expect(content).toContain("class Initializer : IInitializer");
  });

  it("renders mock registration with interface registrations", () => {
    const output = render(
      <Output>
        <MockHelpers interfaceRegistrations={["IPetStore, MockPetStore"]} />
      </Output>,
    );
    const content = findFileContent(output, "MockRegistration.cs");
    expect(content).toBeDefined();
    expect(content).toContain("MockRegistration");
    expect(content).toContain("IPetStore, MockPetStore");
  });
});
