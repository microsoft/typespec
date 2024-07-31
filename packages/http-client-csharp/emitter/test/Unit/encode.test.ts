import { TestHost } from "@typespec/compiler/testing";
import { getAllHttpServices } from "@typespec/http";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import { InputEnumType, InputModelType } from "../../src/type/input-type.js";
import {
  createEmitterContext,
  createEmitterTestHost,
  createNetSdkContext,
  navigateModels,
  typeSpecCompile,
} from "./utils/test-util.js";
import { createModel } from "../../src/lib/client-model-builder.js";

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
    const sdkContext = await createNetSdkContext(context);
    const root = createModel(sdkContext);
    const type = root.Clients[0].Operations[0].Parameters[1].Type;
    strictEqual(type.Kind, "duration");
    strictEqual(type.Name, "duration");
    strictEqual(type.CrossLanguageDefinitionId, "TypeSpec.duration");
    strictEqual(type.Encode, "ISO8601");
    strictEqual(type.WireType.Kind, "string");
    strictEqual(type.WireType.Name, "string");
    strictEqual(type.WireType.CrossLanguageDefinitionId, "TypeSpec.string");
    strictEqual(type.BaseType, undefined);
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
    const sdkContext = await createNetSdkContext(context);
    const root = createModel(sdkContext);
    const type = root.Clients[0].Operations[0].Parameters[1].Type;
    strictEqual(type.Kind, "duration");
    strictEqual(type.Name, "duration");
    strictEqual(type.CrossLanguageDefinitionId, "TypeSpec.duration");
    strictEqual(type.Encode, "seconds");
    strictEqual(type.WireType.Kind, "int32");
    strictEqual(type.WireType.Name, "int32");
    strictEqual(type.WireType.CrossLanguageDefinitionId, "TypeSpec.int32");
    strictEqual(type.BaseType, undefined);
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
    const sdkContext = await createNetSdkContext(context);
    const root = createModel(sdkContext);
    const type = root.Clients[0].Operations[0].Parameters[0].Type;
    strictEqual(type.Kind, "duration");
    strictEqual(type.Name, "duration");
    strictEqual(type.CrossLanguageDefinitionId, "TypeSpec.duration");
    strictEqual(type.Encode, "seconds");
    strictEqual(type.WireType.Kind, "float32");
    strictEqual(type.WireType.Name, "float32");
    strictEqual(type.WireType.CrossLanguageDefinitionId, "TypeSpec.float32");
    strictEqual(type.BaseType, undefined);
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
    const sdkContext = await createNetSdkContext(context);
    const [services] = getAllHttpServices(program);
    const modelMap = new Map<string, InputModelType>();
    const enumMap = new Map<string, InputEnumType>();
    navigateModels(sdkContext, services[0].namespace, modelMap, enumMap);
    const durationModel = modelMap.get("ISO8601DurationProperty");
    ok(durationModel);
    const type = durationModel.Properties[0].Type;
    strictEqual(type.Kind, "duration");
    strictEqual(type.Name, "duration");
    strictEqual(type.CrossLanguageDefinitionId, "TypeSpec.duration");
    strictEqual(type.Encode, "ISO8601");
    strictEqual(type.WireType.Kind, "string");
    strictEqual(type.WireType.CrossLanguageDefinitionId, "TypeSpec.string");
    strictEqual(type.BaseType, undefined);
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
    const sdkContext = await createNetSdkContext(context);
    const [services] = getAllHttpServices(program);
    const modelMap = new Map<string, InputModelType>();
    const enumMap = new Map<string, InputEnumType>();
    navigateModels(sdkContext, services[0].namespace, modelMap, enumMap);
    const durationModel = modelMap.get("Int32SecondsDurationProperty");
    ok(durationModel);
    const type = durationModel.Properties[0].Type;
    strictEqual(type.Kind, "duration");
    strictEqual(type.Name, "duration");
    strictEqual(type.CrossLanguageDefinitionId, "TypeSpec.duration");
    strictEqual(type.Encode, "seconds");
    strictEqual(type.WireType.Kind, "int32");
    strictEqual(type.WireType.CrossLanguageDefinitionId, "TypeSpec.int32");
    strictEqual(type.BaseType, undefined);
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
    const sdkContext = await createNetSdkContext(context);
    const [services] = getAllHttpServices(program);
    const modelMap = new Map<string, InputModelType>();
    const enumMap = new Map<string, InputEnumType>();
    navigateModels(sdkContext, services[0].namespace, modelMap, enumMap);
    const durationModel = modelMap.get("FloatSecondsDurationProperty");
    ok(durationModel);
    const type = durationModel.Properties[0].Type;
    strictEqual(type.Kind, "duration");
    strictEqual(type.Name, "duration");
    strictEqual(type.CrossLanguageDefinitionId, "TypeSpec.duration");
    strictEqual(type.Encode, "seconds");
    strictEqual(type.WireType.Kind, "float32");
    strictEqual(type.WireType.CrossLanguageDefinitionId, "TypeSpec.float32");
    strictEqual(type.BaseType, undefined);
  });
});
