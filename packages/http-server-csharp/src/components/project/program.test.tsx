import { Output, render } from "@alloy-js/core";
import { describe, expect, it } from "vitest";
import { ProgramCs } from "./program.jsx";

function getFileContent(output: any, path: string): string | undefined {
  for (const item of output.contents) {
    if ("contents" in item && typeof item.contents === "string" && item.path.endsWith(path)) {
      return item.contents;
    }
  }
  return undefined;
}

describe("ProgramCs", () => {
  it("renders Program.cs without swagger", () => {
    const output = render(
      <Output>
        <ProgramCs />
      </Output>,
    );
    const content = getFileContent(output, "Program.cs");
    expect(content).toBeDefined();
    expect(content).toContain("var builder = WebApplication.CreateBuilder(args);");
  });

  it("renders Program.cs with swagger", () => {
    const output = render(
      <Output>
        <ProgramCs useSwaggerUI openApiPath="openapi/spec.yaml" />
      </Output>,
    );
    const content = getFileContent(output, "Program.cs");
    expect(content).toBeDefined();
    expect(content).toContain("builder.Services.AddSwaggerGen()");
  });

  it("renders Program.cs with mocks", () => {
    const output = render(
      <Output>
        <ProgramCs hasMocks />
      </Output>,
    );
    const content = getFileContent(output, "Program.cs");
    expect(content).toBeDefined();
    expect(content).toContain("MockRegistration.Register(builder)");
  });
});
