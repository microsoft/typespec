import { describe, expect, it } from "vitest";
import { getNextVersion, getPrereleaseVersionRange } from "../src/prerelease.js";

describe("getPrereleaseVersionRange", () => {
  it.each([
    {
      currentVersion: "0.1.0",
      preReleaseTag: "dev",
      expectedRange: "^0.1.0 || >=0.2.0-dev <0.2.0",
    },
    {
      currentVersion: "0.1.0-alpha.0",
      preReleaseTag: "dev",
      expectedRange: "^0.1.0-alpha.0 || >=0.1.0-alpha.1-dev <0.1.0-alpha.1",
    },
    {
      currentVersion: "1.0.0-rc.0",
      preReleaseTag: "dev",
      expectedRange: "^1.0.0-rc.0",
    },
    {
      currentVersion: "1.1.0",
      preReleaseTag: "dev",
      expectedRange: "^1.1.0",
    },
  ])(
    "limits range to major version ($currentVersion)",
    ({ currentVersion, preReleaseTag, expectedRange }) => {
      const range = getPrereleaseVersionRange(
        {
          manifest: { name: "test", version: currentVersion },
          oldVersion: currentVersion,
          nextVersion: getNextVersion(currentVersion),
          newVersion: `${getNextVersion(currentVersion)}-${preReleaseTag}.0`,
          packageJsonPath: "test/package.json",
        },
        preReleaseTag,
      );

      expect(range).toBe(expectedRange);
    },
  );
});
