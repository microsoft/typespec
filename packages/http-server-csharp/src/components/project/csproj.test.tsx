import { Output, render } from "@alloy-js/core";
import { describe, expect, it } from "vitest";
import { Csproj } from "./csproj.jsx";

function getFileContent(output: any, path: string): string | undefined {
  for (const item of output.contents) {
    if ("contents" in item && typeof item.contents === "string" && item.path.endsWith(path)) {
      return item.contents;
    }
  }
  return undefined;
}

describe("Csproj", () => {
  it("renders a basic .csproj file", () => {
    const output = render(
      <Output>
        <Csproj projectName="TestProject" />
      </Output>,
    );
    const content = getFileContent(output, "TestProject.csproj");
    expect(content).toBeDefined();
    expect(content).toContain("Microsoft.NET.Sdk.Web");
    expect(content).toContain("<TargetFramework>net9.0</TargetFramework>");
    expect(content).toContain("<Nullable>enable</Nullable>");
  });

  it("includes SwaggerUI package when enabled", () => {
    const output = render(
      <Output>
        <Csproj projectName="TestProject" useSwaggerUI />
      </Output>,
    );
    const content = getFileContent(output, "TestProject.csproj");
    expect(content).toBeDefined();
    expect(content).toContain("SwashBuckle.AspNetCore");
  });
});
