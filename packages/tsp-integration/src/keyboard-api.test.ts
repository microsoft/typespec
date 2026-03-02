import { Readable, Writable } from "stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerConsoleShortcuts } from "./keyboard-api.js";
import type { TspRunner } from "./validate.js";

let runner: TspRunner;
let stdin: NodeJS.ReadStream;
let stdout: Writable;
let cleanup: () => void;

beforeEach(() => {
  runner = {
    rerunAll: vi.fn(),
    rerunFailed: vi.fn(),
    cancelCurrentRun: vi.fn(),
    exit: vi.fn(),
    isCancelling: false,
  } as any;
  stdout = new Writable({
    write(chunk, __, callback) {
      callback();
    },
  });

  stdin = new Readable({ read: () => "" }) as NodeJS.ReadStream;
  stdin.isTTY = true;
  stdin.setRawMode = () => stdin;
  cleanup = registerConsoleShortcuts(runner, stdin, stdout);
});

afterEach(() => {
  cleanup?.();
});

describe("when no test is running", () => {
  it("calls exit when q is pressed", () => {
    stdin.emit("data", "q");
    expect(runner.exit).toHaveBeenCalled();
  });

  it("calls rerunAll when a is pressed", () => {
    stdin.emit("data", "a");
    expect(runner.rerunAll).toHaveBeenCalled();
  });

  it("calls rerunFailed when f is pressed", () => {
    stdin.emit("data", "f");
    expect(runner.rerunFailed).toHaveBeenCalled();
  });
});

describe("when tests are running", () => {
  beforeEach(() => {
    runner.runningPromise = Promise.resolve() as any;
  });
  describe("calls cancelCurrentRun when cancel keys are pressed", () => {
    it.each(["q", "c", "a", "f", "space", "\x03"])(`%s`, (key) => {
      stdin.emit("data", key);
      expect(runner.cancelCurrentRun).toHaveBeenCalled();
    });
  });

  it("does NOT call cancelCurrentRun when other keys are pressed", () => {
    stdin.emit("data", "b");
    stdin.emit("data", "d");
    expect(runner.cancelCurrentRun).not.toHaveBeenCalled();
  });
});
