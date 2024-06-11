import { TestHost } from "@typespec/compiler/testing";
import { getAllHttpServices } from "@typespec/http";
import assert, { deepStrictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { loadOperation } from "../../src/lib/operation.js";
import { InputDurationType, InputEnumType, InputModelType } from "../../src/type/input-type.js";
import {
  createEmitterContext,
  createEmitterTestHost,
  createNetSdkContext,
  navigateModels,
  typeSpecCompile,
} from "./utils/test-util.js";

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
    deepStrictEqual(
      {
        Kind: "duration",
        Encode: "ISO8601",
        WireType: {
          Kind: "string",
          IsNullable: false,
          Encode: undefined,
        },
        IsNullable: false,
      } as InputDurationType,
      operation.Parameters[0].Type
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
    deepStrictEqual(
      {
        Kind: "duration",
        Encode: "seconds",
        WireType: {
          Kind: "int32",
          IsNullable: false,
          Encode: undefined,
        },
        IsNullable: false,
      } as InputDurationType,
      operation.Parameters[0].Type
    );
  });

  it("encode seconds-float for duration query parameter ", async () => {
    const program = await typeSpecCompile(
      `
            op test(
                @query
                @encode(DurationKnownEncoding.seconds, float32)
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
    deepStrictEqual(
      {
        Kind: "duration",
        Encode: "seconds",
        WireType: {
          Kind: "float32",
          IsNullable: false,
          Encode: undefined,
        },
        IsNullable: false,
      } as InputDurationType,
      operation.Parameters[0].Type
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
    deepStrictEqual(
      {
        Kind: "duration",
        Encode: "ISO8601",
        WireType: {
          Kind: "string",
          IsNullable: false,
          Encode: undefined,
        },
        IsNullable: false,
      } as InputDurationType,
      durationProperty.Properties[0].Type
    );
  });

  it("encode seconds int32 on duration model property", async () => {
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
    deepStrictEqual(
      {
        Kind: "duration",
        Encode: "seconds",
        WireType: {
          Kind: "int32",
          IsNullable: false,
          Encode: undefined,
        },
        IsNullable: false,
      } as InputDurationType,
      durationProperty.Properties[0].Type
    );
  });

  it("encode seconds float32 on duration model property", async () => {
    const program = await typeSpecCompile(
      `
            @doc("This is a model.")
            model FloatSecondsDurationProperty {
                @encode(DurationKnownEncoding.seconds, float32)
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
    deepStrictEqual(
      {
        Kind: "duration",
        Encode: "seconds",
        WireType: {
          Kind: "float32",
          IsNullable: false,
          Encode: undefined,
        },
        IsNullable: false,
      } as InputDurationType,
      durationProperty.Properties[0].Type
    );
  });
});
