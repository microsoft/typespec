import { TestHost } from "@typespec/compiler/testing";
import assert, { deepStrictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import { InputTypeKind } from "../../src/type/input-type-kind.js";
import { InputEnumType, InputListType } from "../../src/type/input-type.js";
import {
  createEmitterContext,
  createEmitterTestHost,
  createNetSdkContext,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Test GetInputType for array", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("array as request", async () => {
    const program = await typeSpecCompile(
      `
        op test(@body input: string[]): string[];
      `,
      runner
    );
    runner.compileAndDiagnose;
    const context = createEmitterContext(program);
    const sdkContext = createNetSdkContext(context);
    const root = createModel(sdkContext);
    deepStrictEqual(root.Clients[0].Operations[0].Parameters[0].Type.Kind, InputTypeKind.Array);
    deepStrictEqual(
      {
        Kind: InputTypeKind.Array,
        Name: InputTypeKind.Array,
        ElementType: {
          Kind: "string",
          IsNullable: false,
          Encode: undefined,
        },
        IsNullable: false,
      } as InputListType,
      root.Clients[0].Operations[0].Parameters[0].Type
    );
  });

  it("array as response", async () => {
    const program = await typeSpecCompile(
      `
        op test(): string[];
      `,
      runner
    );
    const context = createEmitterContext(program);
    const sdkContext = createNetSdkContext(context);
    const root = createModel(sdkContext);
    deepStrictEqual(root.Clients[0].Operations[0].Responses[0].BodyType?.Kind, InputTypeKind.Array);
    deepStrictEqual(
      {
        Kind: InputTypeKind.Array,
        Name: InputTypeKind.Array,
        ElementType: {
          Kind: "string",
          IsNullable: false,
          Encode: undefined,
        },
        IsNullable: false,
      } as InputListType,
      root.Clients[0].Operations[0].Responses[0].BodyType
    );
  });
});

describe("Test GetInputType for enum", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("Fixed string enum", async () => {
    const program = await typeSpecCompile(
      `
        #suppress "@azure-tools/typespec-azure-core/use-extensible-enum" "Enums should be defined without the @fixed decorator."
        @doc("fixed string enum")
        @fixed
        enum SimpleEnum {
            @doc("Enum value one")
            One: "1",
            @doc("Enum value two")
            Two: "2",
            @doc("Enum value four")
            Four: "4"
        }
        #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Operation 'test' should be defined using a signature from the Azure.Core namespace."
        @doc("test fixed enum.")
        op test(@doc("fixed enum as input.")@body input: SimpleEnum): string[];
      `,
      runner,
      { IsNamespaceNeeded: true, IsAzureCoreNeeded: true }
    );
    const context = createEmitterContext(program);
    const sdkContext = createNetSdkContext(context);
    const root = createModel(sdkContext);
    deepStrictEqual(
      {
        Kind: "enum",
        Name: "SimpleEnum",
        Namespace: "Azure.Csharp.Testing",
        Accessibility: undefined,
        Deprecated: undefined,
        Description: "fixed string enum",
        ValueType: {
          Kind: "string",
          IsNullable: false,
          Encode: undefined,
        },
        Values: [
          {
            Name: "One",
            Value: "1",
            Description: "Enum value one",
          },
          {
            Name: "Two",
            Value: "2",
            Description: "Enum value two",
          },
          {
            Name: "Four",
            Value: "4",
            Description: "Enum value four",
          },
        ],
        IsExtensible: false,
        IsNullable: false,
        Usage: "Input",
      } as InputEnumType,
      root.Clients[0].Operations[0].Parameters[0].Type,
      `Enum type is not correct, got ${JSON.stringify(
        root.Clients[0].Operations[0].Parameters[0].Type
      )}`
    );
    const type = root.Clients[0].Operations[0].Parameters[0].Type as InputEnumType;
    assert(type.ValueType !== undefined);
    deepStrictEqual(type.Name, "SimpleEnum");
    deepStrictEqual(type.IsExtensible, false);
  });
  it("Fixed int enum", async () => {
    const program = await typeSpecCompile(
      `
      #suppress "@azure-tools/typespec-azure-core/use-extensible-enum" "Enums should be defined without the @fixed decorator."
      @doc("Fixed int enum")
      @fixed
      enum FixedIntEnum {
          @doc("Enum value one")
          One: 1,
          @doc("Enum value two")
          Two: 2,
          @doc("Enum value four")
          Four: 4
      }
      #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Operation 'test' should be defined using a signature from the Azure.Core namespace."
      @doc("test fixed enum.")
      op test(@doc("fixed enum as input.")@body input: FixedIntEnum): string[];
    `,
      runner,
      { IsNamespaceNeeded: true, IsAzureCoreNeeded: true }
    );
    const context = createEmitterContext(program);
    const sdkContext = createNetSdkContext(context);
    const root = createModel(sdkContext);
    deepStrictEqual(
      {
        Kind: "enum",
        Name: "FixedIntEnum",
        Namespace: "Azure.Csharp.Testing",
        Accessibility: undefined,
        Deprecated: undefined,
        Description: "Fixed int enum",
        ValueType: {
          Kind: "int32",
          IsNullable: false,
          Encode: undefined,
        },
        Values: [
          {
            Name: "One",
            Value: 1,
            Description: "Enum value one",
          },
          {
            Name: "Two",
            Value: 2,
            Description: "Enum value two",
          },
          {
            Name: "Four",
            Value: 4,
            Description: "Enum value four",
          },
        ],
        IsExtensible: false,
        IsNullable: false,
        Usage: "Input",
      } as InputEnumType,
      root.Clients[0].Operations[0].Parameters[0].Type,
      `Enum type is not correct, got ${JSON.stringify(
        root.Clients[0].Operations[0].Parameters[0].Type
      )}`
    );
    const type = root.Clients[0].Operations[0].Parameters[0].Type as InputEnumType;
    assert(type.ValueType !== undefined);
    deepStrictEqual(type.Name, "FixedIntEnum");
    deepStrictEqual(type.IsExtensible, false);
  });

  it("fixed enum", async () => {
    const program = await typeSpecCompile(
      `
        @doc("Fixed enum")
        enum FixedEnum {
            One: "1",
            Two: "2",
            Four: "4"
        }
        op test(@body input: FixedEnum): string[];
      `,
      runner
    );
    const context = createEmitterContext(program);
    const sdkContext = createNetSdkContext(context);
    const root = createModel(sdkContext);
    deepStrictEqual(
      {
        Kind: "enum",
        Name: "FixedEnum",
        Namespace: "Azure.Csharp.Testing",
        Accessibility: undefined,
        Deprecated: undefined,
        Description: "Fixed enum",
        ValueType: {
          Kind: "string",
          IsNullable: false,
          Encode: undefined,
        },
        Values: [
          { Name: "One", Value: "1", Description: undefined },
          { Name: "Two", Value: "2", Description: undefined },
          { Name: "Four", Value: "4", Description: undefined },
        ],
        IsExtensible: false,
        IsNullable: false,
        Usage: "Input",
      } as InputEnumType,
      root.Clients[0].Operations[0].Parameters[0].Type,
      `Enum type is not correct, got ${JSON.stringify(
        root.Clients[0].Operations[0].Parameters[0].Type
      )}`
    );
    const type = root.Clients[0].Operations[0].Parameters[0].Type as InputEnumType;
    assert(type.ValueType !== undefined);
    deepStrictEqual(type.Name, "FixedEnum");
    deepStrictEqual((type as InputEnumType).IsExtensible, false);
  });
});
