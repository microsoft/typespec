import type { Namespace } from "@typespec/compiler";
import { describe, expect, it } from "vitest";
import { ref, type ProtoFile, type ProtoOption } from "../src/ast.js";
import { writeProtoFile } from "../src/write.js";

function writeService(options?: ProtoOption[]): string {
  const file: ProtoFile = {
    package: "example",
    options: {},
    imports: [],
    declarations: [
      {
        kind: "service",
        name: "Service",
        operations: [
          {
            kind: "method",
            stream: 0,
            name: "Run",
            input: ref("RunRequest"),
            returns: ref("RunResponse"),
            options,
          },
        ],
      },
    ],
    source: {} as Namespace,
  };

  return writeProtoFile(file);
}

describe("method options", () => {
  it.each([undefined, []])("ends the rpc with a semicolon without options (%j)", (options) => {
    expect(writeService(options)).toContain(`service Service {
  rpc Run(RunRequest) returns (RunResponse);
}`);
  });

  it("writes scalar values", () => {
    expect(
      writeService([
        { name: "deprecated", value: true },
        { name: "(example.enabled)", value: false },
        { name: "(example.count)", value: 42 },
        { name: "(example.offset)", value: -7 },
        { name: "(example.ratio)", value: 1.5 },
        { name: "(example.label)", value: "plain" },
      ]),
    ).toContain(`service Service {
  rpc Run(RunRequest) returns (RunResponse) {
    option deprecated = true;
    option (example.enabled) = false;
    option (example.count) = 42;
    option (example.offset) = -7;
    option (example.ratio) = 1.5;
    option (example.label) = "plain";
  }
}`);
  });

  it("escapes quotes, backslashes, and whitespace in strings", () => {
    expect(
      writeService([
        {
          name: "(example.label)",
          value: 'say "hi" from C:\\path\\\nline\r\tend',
        },
        { name: "(example.info)", value: { text: '\\"\n' } },
      ]),
    ).toContain(`  rpc Run(RunRequest) returns (RunResponse) {
    option (example.label) = "say \\"hi\\" from C:\\\\path\\\\\\nline\\r\\tend";
    option (example.info) = {
      text: "\\\\\\"\\n"
    };
  }`);
  });

  it("writes nested message literals with increasing indentation", () => {
    expect(
      writeService([
        {
          name: "(example.info)",
          value: {
            name: "outer",
            inner: {
              count: 2,
              enabled: true,
              deepest: { ratio: 0.25 },
            },
            empty: {},
            after: "last",
          },
        },
      ]),
    ).toContain(`  rpc Run(RunRequest) returns (RunResponse) {
    option (example.info) = {
      name: "outer"
      inner {
        count: 2
        enabled: true
        deepest {
          ratio: 0.25
        }
      }
      empty {
      }
      after: "last"
    };
  }`);
  });

  it("writes an empty message literal", () => {
    expect(writeService([{ name: "(example.info)", value: {} }])).toContain(
      `  rpc Run(RunRequest) returns (RunResponse) {
    option (example.info) = {
    };
  }`,
    );
  });
});
