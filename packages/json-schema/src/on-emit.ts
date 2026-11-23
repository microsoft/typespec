import { createAssetEmitter } from "@typespec/asset-emitter";
import {
  type EmitContext,
  type Enum,
  interpolatePath,
  type Model,
  NoTarget,
  type Scalar,
  type Union,
} from "@typespec/compiler";
import { getJsonSchemaTypes } from "./decorators.js";
import { JsonSchemaEmitter } from "./json-schema-emitter.js";
import { type JSONSchemaEmitterOptions, reportDiagnostic } from "./lib.js";
export { $flags, $lib, EmitterOptionsSchema, type JSONSchemaEmitterOptions } from "./lib.js";

export const namespace = "TypeSpec.JsonSchema";
export type JsonSchemaDeclaration = Model | Union | Enum | Scalar;

/**
 * Internal: TypeSpec emitter entry point
 */
export async function $onEmit(context: EmitContext<JSONSchemaEmitterOptions>) {
  if (context.options["file-name"]?.match(/[/\\]/)) {
    reportDiagnostic(context.program, {
      code: "invalid-file-name",
      target: NoTarget,
    });
    return;
  }

  if (context.options["file-name"]?.includes("#")) {
    reportDiagnostic(context.program, {
      code: "invalid-file-name",
      messageId: "fragment",
      target: NoTarget,
    });
    return;
  }

  const fileName = interpolatePath(context.options["file-name"] ?? "{name}.{ext}", {
    name: "{name}",
    ext: context.options["file-type"] === "json" ? "json" : "yaml",
  });
  if (fileName === "" || fileName === "." || fileName === "..") {
    reportDiagnostic(context.program, {
      code: "invalid-file-name",
      messageId: "empty",
      target: NoTarget,
    });
    return;
  }

  const emitter = createAssetEmitter(context.program, JsonSchemaEmitter as any, context);

  if (emitter.getOptions().emitAllModels) {
    emitter.emitProgram({ emitTypeSpecNamespace: false });
  } else {
    for (const item of getJsonSchemaTypes(context.program)) {
      emitter.emitType(item);
    }
  }

  await emitter.writeOutput();
}
