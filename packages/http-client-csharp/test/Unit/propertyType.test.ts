import { TestHost } from "@typespec/compiler/testing";
import assert, { deepStrictEqual } from "assert";
import { createModel } from "../../src/lib/clientModelBuilder.js";
import {
    typeSpecCompile,
    createEmitterContext,
    createEmitterTestHost,
    createNetSdkContext
} from "./utils/TestUtil.js";
import { InputEnumType, InputListType } from "../../src/type/inputType.js";
import isEqual from "lodash.isequal";
import { InputTypeKind } from "../../src/type/inputTypeKind.js";
import { InputPrimitiveTypeKind } from "../../src/type/inputPrimitiveTypeKind.js";

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
        deepStrictEqual(
            root.Clients[0].Operations[0].Parameters[0].Type.Kind,
            InputTypeKind.Array
        );
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Array,
                    Name: InputTypeKind.Array,
                    ElementType: {
                        Kind: InputTypeKind.Primitive,
                        Name: InputPrimitiveTypeKind.String,
                        IsNullable: false
                    },
                    IsNullable: false
                } as InputListType,
                root.Clients[0].Operations[0].Parameters[0].Type
            )
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
        deepStrictEqual(
            root.Clients[0].Operations[0].Responses[0].BodyType?.Kind,
            InputTypeKind.Array
        );
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Array,
                    Name: InputTypeKind.Array,
                    ElementType: {
                        Kind: InputTypeKind.Primitive,
                        Name: InputPrimitiveTypeKind.String,
                        IsNullable: false
                    },
                    IsNullable: false
                } as InputListType,
                root.Clients[0].Operations[0].Responses[0].BodyType
            )
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
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Enum,
                    Name: "SimpleEnum",
                    Namespace: "Azure.Csharp.Testing",
                    Accessibility: undefined,
                    Deprecated: undefined,
                    Description: "fixed string enum",
                    EnumValueType: "String",
                    AllowedValues: [
                        {
                            Name: "One",
                            Value: "1",
                            Description: "Enum value one"
                        },
                        {
                            Name: "Two",
                            Value: "2",
                            Description: "Enum value two"
                        },
                        {
                            Name: "Four",
                            Value: "4",
                            Description: "Enum value four"
                        }
                    ],
                    IsExtensible: false,
                    IsNullable: false,
                    Usage: "Input"
                } as InputEnumType,
                root.Clients[0].Operations[0].Parameters[0].Type
            )
        );
        const type = root.Clients[0].Operations[0].Parameters[0]
            .Type as InputEnumType;
        assert(type.EnumValueType !== undefined);
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
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Enum,
                    Name: "FixedIntEnum",
                    Namespace: "Azure.Csharp.Testing",
                    Accessibility: undefined,
                    Deprecated: undefined,
                    Description: "Fixed int enum",
                    EnumValueType: "Float32",
                    AllowedValues: [
                        {
                            Name: "One",
                            Value: 1,
                            Description: "Enum value one"
                        },
                        {
                            Name: "Two",
                            Value: 2,
                            Description: "Enum value two"
                        },
                        {
                            Name: "Four",
                            Value: 4,
                            Description: "Enum value four"
                        }
                    ],
                    IsExtensible: false,
                    IsNullable: false,
                    Usage: "Input"
                } as InputEnumType,
                root.Clients[0].Operations[0].Parameters[0].Type
            )
        );
        const type = root.Clients[0].Operations[0].Parameters[0]
            .Type as InputEnumType;
        assert(type.EnumValueType !== undefined);
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
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Enum,
                    Name: "FixedEnum",
                    Namespace: "Azure.Csharp.Testing",
                    Accessibility: undefined,
                    Deprecated: undefined,
                    Description: "Fixed enum",
                    EnumValueType: "String",
                    AllowedValues: [
                        { Name: "One", Value: "1", Description: undefined },
                        { Name: "Two", Value: "2", Description: undefined },
                        { Name: "Four", Value: "4", Description: undefined }
                    ],
                    IsExtensible: false,
                    IsNullable: false,
                    Usage: "Input"
                } as InputEnumType,
                root.Clients[0].Operations[0].Parameters[0].Type
            )
        );
        const type = root.Clients[0].Operations[0].Parameters[0]
            .Type as InputEnumType;
        assert(type.EnumValueType !== undefined);
        deepStrictEqual(type.Name, "FixedEnum");
        deepStrictEqual((type as InputEnumType).IsExtensible, false);
    });
});
