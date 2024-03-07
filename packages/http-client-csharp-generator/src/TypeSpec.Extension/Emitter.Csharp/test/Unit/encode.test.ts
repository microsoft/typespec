import { TestHost } from "@typespec/compiler/testing";
import assert, { deepStrictEqual } from "assert";
import isEqual from "lodash.isequal";
import {
    createEmitterContext,
    createEmitterTestHost,
    createNetSdkContext,
    navigateModels,
    typeSpecCompile
} from "./utils/TestUtil.js";
import { getAllHttpServices } from "@typespec/http";
import {
    InputEnumType,
    InputModelType,
    InputPrimitiveType
} from "../../src/type/inputType.js";
import { loadOperation } from "../../src/lib/operation.js";
import { InputTypeKind } from "../../src/type/inputTypeKind.js";
import { InputPrimitiveTypeKind } from "../../src/type/inputPrimitiveTypeKind.js";

describe("Test encode duration", () => {
    let runner: TestHost;

    beforeEach(async () => {
        runner = await createEmitterTestHost();
    });

    it("encode iso8601 for duration query parameter ", async () => {
        const program = await typeSpecCompile(
            `
            op test(
                @query
                @encode(DurationKnownEncoding.ISO8601)
                input: duration
              ): NoContentResponse;
      `,
            runner
        );
        const context = createEmitterContext(program);
        const sdkContext = createNetSdkContext(context);
        const [services] = getAllHttpServices(program);
        const modelMap = new Map<string, InputModelType>();
        const enumMap = new Map<string, InputEnumType>();
        const operation = loadOperation(
            sdkContext,
            services[0].operations[0],
            "",
            [],
            services[0].namespace,
            modelMap,
            enumMap
        );
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Primitive,
                    Name: InputPrimitiveTypeKind.DurationISO8601,
                    IsNullable: false
                } as InputPrimitiveType,
                operation.Parameters[0].Type
            )
        );
    });

    it("encode seconds-int32 for duration query parameter ", async () => {
        const program = await typeSpecCompile(
            `
            op test(
                @query
                @encode(DurationKnownEncoding.seconds, int32)
                input: duration
              ): NoContentResponse;
      `,
            runner
        );
        const context = createEmitterContext(program);
        const sdkContext = createNetSdkContext(context);
        const [services] = getAllHttpServices(program);
        const modelMap = new Map<string, InputModelType>();
        const enumMap = new Map<string, InputEnumType>();
        const operation = loadOperation(
            sdkContext,
            services[0].operations[0],
            "",
            [],
            services[0].namespace,
            modelMap,
            enumMap
        );
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Primitive,
                    Name: InputPrimitiveTypeKind.DurationSeconds,
                    IsNullable: false
                } as InputPrimitiveType,
                operation.Parameters[0].Type
            )
        );
    });

    it("encode seconds-float for duration query parameter ", async () => {
        const program = await typeSpecCompile(
            `
            op test(
                @query
                @encode(DurationKnownEncoding.seconds, float)
                input: duration
              ): NoContentResponse;
      `,
            runner
        );
        const context = createEmitterContext(program);
        const sdkContext = createNetSdkContext(context);
        const [services] = getAllHttpServices(program);
        const modelMap = new Map<string, InputModelType>();
        const enumMap = new Map<string, InputEnumType>();
        const operation = loadOperation(
            sdkContext,
            services[0].operations[0],
            "",
            [],
            services[0].namespace,
            modelMap,
            enumMap
        );
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Primitive,
                    Name: InputPrimitiveTypeKind.DurationSecondsFloat,
                    IsNullable: false
                } as InputPrimitiveType,
                operation.Parameters[0].Type
            )
        );
    });

    it("encode iso8601 on duration model property", async () => {
        const program = await typeSpecCompile(
            `
            @doc("This is a model.")
            model ISO8601DurationProperty {
                @encode(DurationKnownEncoding.ISO8601)
                value: duration;
            }
      `,
            runner
        );
        const context = createEmitterContext(program);
        const sdkContext = createNetSdkContext(context);
        const [services] = getAllHttpServices(program);
        const modelMap = new Map<string, InputModelType>();
        const enumMap = new Map<string, InputEnumType>();
        navigateModels(sdkContext, services[0].namespace, modelMap, enumMap);
        const durationProperty = modelMap.get("ISO8601DurationProperty");
        assert(durationProperty !== undefined);
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Primitive,
                    Name: InputPrimitiveTypeKind.DurationISO8601,
                    IsNullable: false
                } as InputPrimitiveType,
                durationProperty.Properties[0].Type
            )
        );
    });

    it("encode iso8601 on duration model property", async () => {
        const program = await typeSpecCompile(
            `
            @doc("This is a model.")
            model ISO8601DurationProperty {
                @encode(DurationKnownEncoding.ISO8601)
                value: duration;
            }
      `,
            runner
        );
        const context = createEmitterContext(program);
        const sdkContext = createNetSdkContext(context);
        const [services] = getAllHttpServices(program);
        const modelMap = new Map<string, InputModelType>();
        const enumMap = new Map<string, InputEnumType>();
        navigateModels(sdkContext, services[0].namespace, modelMap, enumMap);
        const durationProperty = modelMap.get("ISO8601DurationProperty");
        assert(durationProperty !== undefined);
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Primitive,
                    Name: InputPrimitiveTypeKind.DurationISO8601,
                    IsNullable: false
                } as InputPrimitiveType,
                durationProperty.Properties[0].Type
            )
        );
    });

    it("encode seconds-int32 on duration model property", async () => {
        const program = await typeSpecCompile(
            `
            @doc("This is a model.")
            model Int32SecondsDurationProperty {
                @encode(DurationKnownEncoding.seconds, int32)
                value: duration;
            }
      `,
            runner
        );
        const context = createEmitterContext(program);
        const sdkContext = createNetSdkContext(context);
        const [services] = getAllHttpServices(program);
        const modelMap = new Map<string, InputModelType>();
        const enumMap = new Map<string, InputEnumType>();
        navigateModels(sdkContext, services[0].namespace, modelMap, enumMap);
        const durationProperty = modelMap.get("Int32SecondsDurationProperty");
        assert(durationProperty !== undefined);
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Primitive,
                    Name: InputPrimitiveTypeKind.DurationSeconds,
                    IsNullable: false
                },
                durationProperty.Properties[0].Type
            )
        );
    });

    it("encode seconds-int32 on duration model property", async () => {
        const program = await typeSpecCompile(
            `
            @doc("This is a model.")
            model FloatSecondsDurationProperty {
                @encode(DurationKnownEncoding.seconds, float)
                value: duration;
            }
      `,
            runner
        );
        const context = createEmitterContext(program);
        const sdkContext = createNetSdkContext(context);
        const [services] = getAllHttpServices(program);
        const modelMap = new Map<string, InputModelType>();
        const enumMap = new Map<string, InputEnumType>();
        navigateModels(sdkContext, services[0].namespace, modelMap, enumMap);
        const durationProperty = modelMap.get("FloatSecondsDurationProperty");
        assert(durationProperty !== undefined);
        assert(
            isEqual(
                {
                    Kind: InputTypeKind.Primitive,
                    Name: InputPrimitiveTypeKind.DurationSecondsFloat,
                    IsNullable: false
                },
                durationProperty.Properties[0].Type
            )
        );
    });
});
