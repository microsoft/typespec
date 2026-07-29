import { Output, render } from "@alloy-js/core";
import { describe, expect, it } from "vitest";
import { AppSettings, LaunchSettings } from "./launch-settings.jsx";

function findFileContent(output: any, pathSuffix: string): string | undefined {
  function search(dir: any): string | undefined {
    for (const item of dir.contents) {
      if (
        "contents" in item &&
        typeof item.contents === "string" &&
        item.path.endsWith(pathSuffix)
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

describe("LaunchSettings", () => {
  it("renders launchSettings.json with correct ports", () => {
    const output = render(
      <Output>
        <LaunchSettings httpPort={5000} httpsPort={5001} />
      </Output>,
    );
    const content = findFileContent(output, "launchSettings.json");
    expect(content).toBeDefined();
    expect(content).toContain("https://localhost:5001");
    expect(content).toContain("http://localhost:5000");
  });
});

describe("AppSettings", () => {
  it("renders appsettings files", () => {
    const output = render(
      <Output>
        <AppSettings />
      </Output>,
    );
    const content = findFileContent(output, "appsettings.json");
    expect(content).toBeDefined();
    expect(content).toContain("AllowedHosts");
  });
});
