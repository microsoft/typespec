import type { UnionVariant } from "@typespec/compiler";
import { expectDiagnostics, t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { isTerminalEvent } from "../src/decorators.js";
import { Tester } from "./test-host.js";

describe("@terminalEvent", () => {
  it("marks the model as a terminal event", async () => {
    const { TerminalEvent, program } = await Tester.compile(
      t.code`
@events
union TestEvents {
  { done: false, @data message: string},

  @test("TerminalEvent")
  @terminalEvent
  { done: true }
}
      `,
    );

    expect(isTerminalEvent(program, TerminalEvent as UnionVariant)).toBe(true);
  });

  it("can only be applied to union variants within a union decorated with @events", async () => {
    const diagnostics = await Tester.diagnose(
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
