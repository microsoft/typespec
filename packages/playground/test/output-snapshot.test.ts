import { expect, it } from "vitest";
import {
  boundOutputSnapshot,
  emptyRetainedOutput,
  readOutputSnapshot,
  resolveDisplayedOutput,
  type DisplayedOutput,
} from "../src/react/compilation/output-snapshot.js";

function compiled(outputFiles: string[], hasError: boolean) {
  return {
    program: { hasError: () => hasError },
    outputFiles,
  } as Parameters<typeof resolveDisplayedOutput>[0];
}

function snapshotText(displayed: DisplayedOutput["displayed"], path: string) {
  if (!("outputFileContents" in displayed)) {
    return undefined;
  }
  return displayed.outputFileContents?.get(path);
}

it("retains every file from the latest successful compilation after a failed compile", () => {
  let retained = emptyRetainedOutput();

  retained = resolveDisplayedOutput(
    compiled(["a.yaml", "b.yaml"], false),
    retained,
    new Map([
      ["a.yaml", "a1"],
      ["b.yaml", "b1"],
    ]),
  ).retained;

  retained = resolveDisplayedOutput(
    compiled(["a.yaml", "b.yaml"], false),
    retained,
    new Map([
      ["a.yaml", "a1"],
      ["b.yaml", "b2"],
    ]),
  ).retained;

  const failed = resolveDisplayedOutput(compiled([], true), retained, undefined);

  expect(failed.isOutputStale).toBe(true);
  expect(failed.displayed).toMatchObject({ outputFiles: ["a.yaml", "b.yaml"] });
  expect(snapshotText(failed.displayed, "a.yaml")).toBe("a1");
  expect(snapshotText(failed.displayed, "b.yaml")).toBe("b2");
});

it("keeps text for a file that was emitted but never required to be selected", async () => {
  const disk = new Map<string, string>([
    ["./tsp-output/a.yaml", "alpha"],
    ["./tsp-output/b.yaml", "beta"],
  ]);
  const host = {
    readFile: async (path: string) => {
      const text = disk.get(path);
      if (text === undefined) {
        throw new Error(`File ${path} not found.`);
      }
      return { text };
    },
  };

  const snapshot = await readOutputSnapshot(host, ["a.yaml", "b.yaml"]);
  const retained = resolveDisplayedOutput(
    compiled(["a.yaml", "b.yaml"], false),
    emptyRetainedOutput(),
    snapshot,
  ).retained;

  disk.clear();
  const failed = resolveDisplayedOutput(compiled([], true), retained, undefined);

  expect(snapshotText(failed.displayed, "b.yaml")).toBe("beta");
});

it("does not keep a partial snapshot when a later file cannot be read", async () => {
  const reads: string[] = [];
  const snapshot = await readOutputSnapshot(
    {
      readFile: async (path: string) => {
        reads.push(path);
        if (path.endsWith("b.yaml")) {
          throw new Error("missing");
        }
        return { text: "a" };
      },
    },
    ["a.yaml", "b.yaml"],
  );

  expect(snapshot).toBeUndefined();
  expect(reads).toEqual(["./tsp-output/a.yaml", "./tsp-output/b.yaml"]);
});

it("keeps the previous snapshot when a newer emission cannot be read", () => {
  const retained = {
    outputFiles: ["a.yaml"],
    outputFileContents: new Map([["a.yaml", "previous"]]),
  };

  const resolved = resolveDisplayedOutput(compiled(["a.yaml"], false), retained, undefined);

  expect(resolved.isOutputStale).toBe(false);
  expect(resolved.retained.outputFiles).toEqual(["a.yaml"]);
  expect(resolved.retained.outputFileContents.get("a.yaml")).toBe("previous");
  expect(snapshotText(resolved.displayed, "a.yaml")).toBeUndefined();
});

it("does not restore output when the failed compile is the first compile", () => {
  const failed = resolveDisplayedOutput(compiled([], true), emptyRetainedOutput(), undefined);

  expect(failed.isOutputStale).toBe(false);
  expect(failed.displayed).toMatchObject({ outputFiles: [] });
});

it("always retains a single emitted file", () => {
  const snapshot = boundOutputSnapshot(
    ["only.yaml"],
    new Map([["only.yaml", "x".repeat(100)]]),
    10,
  );

  expect(snapshot.get("only.yaml")).toHaveLength(100);
});

it("skips multi-file output that does not fit in the snapshot budget", () => {
  const snapshot = boundOutputSnapshot(
    ["a.yaml", "b.yaml", "c.yaml"],
    new Map([
      ["a.yaml", "aaaa"],
      ["b.yaml", "bbbbb"],
      ["c.yaml", "c"],
    ]),
    5,
  );

  expect([...snapshot.keys()]).toEqual(["a.yaml", "c.yaml"]);
  expect(snapshot.get("a.yaml")).toBe("aaaa");
  expect(snapshot.get("c.yaml")).toBe("c");
});
