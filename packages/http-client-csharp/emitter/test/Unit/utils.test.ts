import * as childProcess from "child_process";
import { EventEmitter } from "events";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { execCSharpGenerator } from "../../src/lib/utils.js";
import { CSharpEmitterContext } from "../../src/sdk-context.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("execCSharpGenerator tests", () => {
  let spawnMock: any;
  let sdkContext: CSharpEmitterContext;
  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.mock("child_process", () => ({
      spawn: vi.fn(),
    }));
    const runner = await createEmitterTestHost();
    const program = await typeSpecCompile(``, runner);
    const context = createEmitterContext(program);
    sdkContext = await createCSharpSdkContext(context);
    spawnMock = vi.mocked(childProcess.spawn, true);

    const mockProc = new EventEmitter() as any;
    mockProc.stdout = new EventEmitter();
    mockProc.stderr = new EventEmitter();

    spawnMock.mockReturnValue(mockProc);

    setTimeout(() => {
      mockProc.stdout.emit("data", Buffer.from('"mock stdout output"'));
      mockProc.stderr.emit("data", Buffer.from('"mock stderr output"'));
    }, 10);

    setTimeout(() => {
      mockProc.stdout.emit("end");
      mockProc.stderr.emit("end");
      mockProc.emit("exit", 0); // `execCSharpGenerator` waits for this
    }, 20);
  });

  it("should pass --new-project to dotnet command when newProject is TRUE", async () => {
    const result = await execCSharpGenerator(sdkContext, {
      generatorPath: "/path/to/generator",
      outputFolder: "/output/folder",
      generatorName: "TestGenerator",
      newProject: true,
      debug: false,
    });

    expect(spawnMock).toHaveBeenCalledWith(
      "dotnet",
      [
        "--roll-forward",
        "Major",
        "/path/to/generator",
        "/output/folder",
        "-g",
        "TestGenerator",
        "--new-project",
      ],
      { stdio: "pipe" },
    );
    expect(result.exitCode).toBe(0);
  });

  it("should NOT pass --new-project to dotnet command when newProject is FALSE", async () => {
    const result = await execCSharpGenerator(sdkContext, {
      generatorPath: "/path/to/generator",
      outputFolder: "/output/folder",
      generatorName: "TestGenerator",
      newProject: false,
      debug: false,
    });

    expect(spawnMock).toHaveBeenCalledWith(
      "dotnet",
      ["--roll-forward", "Major", "/path/to/generator", "/output/folder", "-g", "TestGenerator"],
      { stdio: "pipe" },
    );
    expect(result.exitCode).toBe(0);
  });
});
