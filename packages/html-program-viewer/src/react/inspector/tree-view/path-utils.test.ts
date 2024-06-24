import { describe, expect, it } from "vitest";

import { DEFAULT_ROOT_PATH, wildcardPathsFromLevel } from "./path-utils.js";

const root = DEFAULT_ROOT_PATH;

describe("PathUtils", () => {
  it("wildcardPathsFromLevel works", () => {
    expect(wildcardPathsFromLevel(-1)).toEqual([]);

    expect(wildcardPathsFromLevel(0)).toEqual([]);

    expect(wildcardPathsFromLevel(1)).toEqual([root]);

    expect(wildcardPathsFromLevel(2)).toEqual([root, `${root}.*`]);

    expect(wildcardPathsFromLevel(3)).toEqual([root, `${root}.*`, `${root}.*.*`]);

    expect(wildcardPathsFromLevel(4)).toEqual([root, `${root}.*`, `${root}.*.*`, `${root}.*.*.*`]);
  });
});
