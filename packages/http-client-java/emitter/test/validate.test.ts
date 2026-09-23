import { describe, expect, it, vi } from "vitest";
import {
  findJavaRuntimeVersion,
  getJavaMajorVersion,
  validateDependencies,
} from "../src/validate.js";
import { spawnAsync } from "../src/utils.js";

vi.mock("../src/utils.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/utils.js")>();
  return {
    ...actual,
    spawnAsync: vi.fn().mockResolvedValue({ stdout: "", stderr: 'openjdk version "17.0.11"' }),
  };
});

describe("validate", () => {
  it("checks Java without spawning javac", async () => {
    await validateDependencies(undefined);
    expect(spawnAsync).toHaveBeenCalledOnce();
    expect(spawnAsync).toHaveBeenCalledWith("java", ["-version"], { stdio: "pipe" });
  });

  it("getJavaMajorVersion", () => {
    expect(getJavaMajorVersion("1.8.0")).toBe(8);
    expect(getJavaMajorVersion("21.0.3")).toBe(21);
    expect(getJavaMajorVersion("24")).toBe(24);
  });

  it("findJavaRuntimeVersion", () => {
    expect(findJavaRuntimeVersion('java version "1.8.0_422"')).toBe("1.8.0");
    expect(findJavaRuntimeVersion('openjdk version "21.0.3" 2024-04-16')).toBe("21.0.3");
    expect(findJavaRuntimeVersion('openjdk version "17.0.11" 2024-04-16')).toBe("17.0.11");
  });
});
