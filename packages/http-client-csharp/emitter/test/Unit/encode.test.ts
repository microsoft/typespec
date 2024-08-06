import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import {
  createEmitterContext,
  createEmitterTestHost,
  createNetSdkContext,
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
    const type = root.Clients[0].Operations[0].Parameters[1].Type;
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

            op test(): ISO8601DurationProperty;
      `,
      runner
    );
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const codeModel = createModel(sdkContext);
    const models = codeModel.Models;
    const durationModel = models.find((m) => m.Name === "ISO8601DurationProperty");
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

            op test(): Int32SecondsDurationProperty;
      `,
      runner
    );
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const codeModel = createModel(sdkContext);
    const models = codeModel.Models;
    const durationModel = models.find((m) => m.Name === "Int32SecondsDurationProperty");
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

            op test(): FloatSecondsDurationProperty;
      `,
      runner
    );
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const codeModel = createModel(sdkContext);
    const models = codeModel.Models;
    const durationModel = models.find((m) => m.Name === "FloatSecondsDurationProperty");
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
