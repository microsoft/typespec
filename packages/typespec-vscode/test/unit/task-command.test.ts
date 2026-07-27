import { describe, expect, it } from "vitest";
import { Executable } from "vscode-languageclient/node";
import { resolveTaskCommand } from "../../src/task-command.js";

describe("resolveTaskCommand", () => {
  const cli: Executable = { command: "node", args: ["/compiler/cmd/tsp.js"] };

  it("passes the target path as a single literal argument", () => {
    const { command, args } = resolveTaskCommand("/work/main.tsp", [], cli, "/work");
    expect(command).toBe("node");
    expect(args).toEqual(["/compiler/cmd/tsp.js", "compile", "/work/main.tsp"]);
  });

  it("does not interpret shell metacharacters in the path (injection is neutralized)", () => {
    const malicious = "/work/$(rm -rf ~)`whoami`; echo pwned/main.tsp";
    const { args } = resolveTaskCommand(malicious, [], cli, "/work");
    // The whole path stays a single argument, untouched by any shell parsing.
    expect(args).toContain(malicious);
    expect(args).toEqual(["/compiler/cmd/tsp.js", "compile", malicious]);
  });

  it("appends the task arguments verbatim", () => {
    const { args } = resolveTaskCommand(
      "/work/main.tsp",
      ["--watch", "--option", "out=/my folder"],
      cli,
      "/work",
    );
    expect(args).toEqual([
      "/compiler/cmd/tsp.js",
      "compile",
      "/work/main.tsp",
      "--watch",
      "--option",
      "out=/my folder",
    ]);
  });

  it("resolves ${workspaceFolder} variables in each element", () => {
    const cliWithVar: Executable = { command: "node", args: ["${workspaceFolder}/tsp.js"] };
    const { command, args } = resolveTaskCommand(
      "${workspaceFolder}/main.tsp",
      ["--output-dir", "${workspaceFolder}/out"],
      cliWithVar,
      "/work",
    );
    expect(command).toBe("node");
    expect(args).toEqual([
      "/work/tsp.js",
      "compile",
      "/work/main.tsp",
      "--output-dir",
      "/work/out",
    ]);
  });
});
