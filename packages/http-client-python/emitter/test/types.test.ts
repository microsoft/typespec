import type { SdkBuiltInType } from "@azure-tools/typespec-client-generator-core";
import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import type { PythonSdkContext } from "../src/lib.js";
import { getType } from "../src/types.js";

function createBuiltInType(
  kind: SdkBuiltInType["kind"],
  encode?: string,
  wireType?: SdkBuiltInType,
): SdkBuiltInType {
  return {
    kind,
    name: kind,
    crossLanguageDefinitionId: `TypeSpec.${kind}`,
    decorators: [],
    encode,
    wireType,
  };
}

function emitBuiltInType(type: SdkBuiltInType): Record<string, any> {
  const context = {
    __simpleTypesMap: new Map(),
  } as PythonSdkContext;
  return getType(context, type);
}

describe("typespec-python: built-in types", () => {
  it("preserves boolean encoded as string", () => {
    deepStrictEqual(
      emitBuiltInType(createBuiltInType("boolean", "string", createBuiltInType("string"))),
      {
        type: "boolean",
        encode: "string",
      },
    );
  });

  it.each(["safeint", "uint32", "uint8"] as const)(
    "preserves %s encoded as string as an integer",
    (kind) => {
      deepStrictEqual(
        emitBuiltInType(createBuiltInType(kind, "string", createBuiltInType("string"))),
        {
          type: "integer",
          encode: "string",
        },
      );
    },
  );

  it.each(["base64", "base64url"] as const)("preserves bytes encoded as %s", (encode) => {
    deepStrictEqual(
      emitBuiltInType(createBuiltInType("bytes", encode, createBuiltInType("string"))),
      {
        type: "bytes",
        encode,
      },
    );
  });

  it("falls back to the wire type for a custom encoding", () => {
    deepStrictEqual(
      emitBuiltInType(createBuiltInType("string", "abc", createBuiltInType("int32"))),
      {
        type: "integer",
        encode: "abc",
      },
    );
  });
});
