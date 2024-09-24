import type { UnionVariant } from "@typespec/compiler";
import { expectDiagnostics, type BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { isTerminalEvent } from "../src/decorators.js";
import { createSSETestRunner } from "./test-host.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createSSETestRunner();
});

describe("@terminalEvent", () => {
  it("marks the model as a terminal event", async () => {
    const { TerminalEvent } = await runner.compile(
      `
@events
union TestEvents {
  { done: false, @data message: string},

  @test("TerminalEvent")
  @terminalEvent
  { done: true }
}
      `,
    );

    expect(isTerminalEvent(runner.program, TerminalEvent as UnionVariant)).toBe(true);
  });

  it("can only be applied to union variants within a union decorated with @events", async () => {
    const diagnostics = await runner.diagnose(
      `
union TestEvents {
  { done: false, @data message: string},

  @terminalEvent
  { done: true }
}
      `,
    );

    expectDiagnostics(diagnostics, {
      code: "@typespec/sse/terminal-event-not-in-events",
      severity: "error",
    });
  });
});
