import type { OutputDirectory } from "@alloy-js/core";
import { assert } from "vitest";

export function assertFileContents(res: OutputDirectory, contents: string) {
  const testFile = res.contents.find((file) => file.path === "test.cs")!;
  assert(testFile, "test.cs file not rendered");
  assert.equal(testFile.contents, contents);
}
