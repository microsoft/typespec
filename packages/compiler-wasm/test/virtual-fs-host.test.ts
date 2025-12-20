import { describe, it, expect } from "vitest";
import { createVirtualFsHost } from "../src/virtual-fs-host.js";

describe("virtual-fs-host", () => {
  it("should create a virtual filesystem", () => {
    const host = createVirtualFsHost(
      [
        { path: "/main.tsp", contents: "namespace Test {}" },
        { path: "/other.tsp", contents: "namespace Other {}" },
      ],
      [],
    );

    expect(host).toBeDefined();
    expect(host.getExecutionRoot()).toBe("/");
  });

  it("should read files from virtual filesystem", async () => {
    const host = createVirtualFsHost(
      [{ path: "/main.tsp", contents: "namespace Test {}" }],
      [],
    );

    const file = await host.readFile("/main.tsp");
    expect(file.text).toBe("namespace Test {}");
    expect(file.path).toBe("/main.tsp");
  });

  it("should write files to virtual filesystem", async () => {
    const host = createVirtualFsHost([], []);

    await host.writeFile("/output.txt", "Hello, World!");

    const file = await host.readFile("/output.txt");
    expect(file.text).toBe("Hello, World!");
  });

  it("should handle directory operations", async () => {
    const host = createVirtualFsHost(
      [
        { path: "/dir/file1.tsp", contents: "test1" },
        { path: "/dir/file2.tsp", contents: "test2" },
      ],
      [],
    );

    const files = await host.readDir("/dir");
    expect(files).toContain("file1.tsp");
    expect(files).toContain("file2.tsp");
  });

  it("should normalize paths", async () => {
    const host = createVirtualFsHost(
      [{ path: "/main.tsp", contents: "test" }],
      [],
    );

    const file1 = await host.readFile("/main.tsp");
    const file2 = await host.readFile("\\main.tsp");
    
    expect(file1.text).toBe(file2.text);
  });

  it("should throw on file not found", async () => {
    const host = createVirtualFsHost([], []);

    await expect(host.readFile("/nonexistent.tsp")).rejects.toThrow("File not found");
  });
});
