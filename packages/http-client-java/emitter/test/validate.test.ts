import { describe, expect, it } from "vitest";
import { findJavaVersion, getJavaMajorVersion } from "../src/validate.js";

describe("validate", () => {
  it("findJavaVersion", () => {
    expect(findJavaVersion("javac 21.0.3")).toBe("21.0.3");
    expect(findJavaVersion("javac 24")).toBe("24");
    expect(findJavaVersion("javac 1.8.0_422")).toBe("1.8.0");
  });

  it("getJavaMajorVersion", () => {
    expect(getJavaMajorVersion("21.0.3")).toBe(21);
    expect(getJavaMajorVersion("24")).toBe(24);
  });
});
