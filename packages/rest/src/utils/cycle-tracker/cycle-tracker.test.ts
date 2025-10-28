import { expect, it } from "vitest";
import { CycleTracker } from "./cycle-tracker.js";

it("find cycle at start", () => {
  const tracker = new CycleTracker<string>();
  expect(tracker.add("a")).toEqual(undefined);
  expect(tracker.add("b")).toEqual(undefined);
  expect(tracker.add("c")).toEqual(undefined);
  const cycle = tracker.add("a");
  expect(cycle).toEqual(["a", "b", "c"]);
});

it("find cycle in middle", () => {
  const tracker = new CycleTracker<string>();
  expect(tracker.add("a")).toEqual(undefined);
  expect(tracker.add("b")).toEqual(undefined);
  expect(tracker.add("c")).toEqual(undefined);
  const cycle = tracker.add("b");
  expect(cycle).toEqual(["b", "c"]);
});
