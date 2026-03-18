import { expect } from "vitest";
import { MatchResult } from "../../src/match-engine.js";

export function expectPass(result: MatchResult) {
  expect(result).toEqual({ pass: true });
}

export function expectFail(result: MatchResult, messagePattern?: string | RegExp) {
  expect(result.pass).toBe(false);
  if (!result.pass && messagePattern) {
    if (typeof messagePattern === "string") {
      expect(result.message).toContain(messagePattern);
    } else {
      expect(result.message).toMatch(messagePattern);
    }
  }
}
