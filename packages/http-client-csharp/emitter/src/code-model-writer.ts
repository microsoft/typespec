// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { UsageFlags } from "@azure-tools/typespec-client-generator-core";
import { resolvePath } from "@typespec/compiler";
import { configurationFileName, tspOutputFileName } from "./constants.js";
import { isRawJsonProperty } from "./lib/raw-json.js";
import type { CSharpEmitterContext } from "./sdk-context.js";
import type { CodeModel } from "./type/code-model.js";
import type { Configuration } from "./type/configuration.js";

/**
 * Version of the saved code model format. Data property names starting with `$` are escaped
 * with an extra `$`, so that `$id` and `$ref` are unambiguously serializer metadata.
 */
const codeModelVersion = 2;

/**
 * Serializes the code model to a JSON string with reference tracking.
 * @param context - The CSharp emitter context
 * @param codeModel - The code model to serialize
 * @beta
 */
export function serializeCodeModel(context: CSharpEmitterContext, codeModel: CodeModel): string {
  return prettierOutput(JSON.stringify(buildJson(context, codeModel), null, 2));
}

/**
 * Writes the code model to the output folder. Should only be used by autorest.csharp.
 * @param context - The CSharp emitter context
 * @param codeModel - The code model to write
 * @param outputFolder - The output folder to write the code model to
 * @beta
 */
export async function writeCodeModel(
  context: CSharpEmitterContext,
  codeModel: CodeModel,
  outputFolder: string,
) {
  await context.program.host.writeFile(
    resolvePath(outputFolder, tspOutputFileName),
    serializeCodeModel(context, codeModel),
  );
}

/**
 * This function builds a json from code model with refs and ids in it.
 * @param context - The CSharp emitter context
 * @param codeModel - The code model to build
 */
function buildJson(context: CSharpEmitterContext, codeModel: CodeModel): any {
  const objectsIds = new Map<any, string>();
  const stack: any[] = [];
  const rawArrays = new Set<any[]>();

  const root = doBuildJson(codeModel, stack);
  // Marks the document as using escaped data property names, so that a reader can tell
  // serializer metadata ($id/$ref) apart from user data with the same name.
  return { $version: codeModelVersion, ...root };

  function doBuildJson(obj: any, stack: any[], raw = false): any {
    // check if this is a primitive type or null or undefined
    if (!obj || typeof obj !== "object") {
      return obj;
    }
    // we switch here for object, arrays and primitives
    if (Array.isArray(obj)) {
      // array types
      if (raw) {
        // raw JSON has no reference metadata, so a cycle through it cannot be represented
        if (rawArrays.has(obj)) {
          throw new TypeError("Cannot serialize cyclic raw JSON");
        }
        rawArrays.add(obj);
        const result = obj.map((item) => doBuildJson(item, stack, raw));
        rawArrays.delete(obj);
        return result;
      }
      return obj.map((item) => doBuildJson(item, stack));
    } else {
      // this is an object
      if (!raw && shouldHaveRef(obj)) {
        // we will add the $id property to the object if this is the first time we see it
        // or returns a $ref if we have seen it before
        let id = objectsIds.get(obj);
        if (id) {
          // we have seen this object before
          return {
            $ref: id,
          };
        } else {
          // this is the first time we see this object
          id = (objectsIds.size + 1).toString();
          objectsIds.set(obj, id);
          return handleObject(obj, id, stack);
        }
      } else {
        // this is not an object to ref
        return handleObject(obj, undefined, stack, raw);
      }
    }
  }

  function handleObject(obj: any, id: string | undefined, stack: any[], raw = false): any {
    if (stack.includes(obj)) {
      if (raw) {
        throw new TypeError("Cannot serialize cyclic raw JSON");
      }
      // we have a cyclical reference, we should not continue
      context.logger.warn(`Cyclical reference detected in the code model (id: ${id}).`);
      return undefined;
    }

    const result: any = Object.create(null);
    if (id !== undefined) {
      result.$id = id;
    }
    stack.push(obj);

    for (const property of Object.keys(obj)) {
      const rawValue = raw || isRawJsonProperty(obj, property);
      if (!rawValue && property === "__raw") {
        continue; // skip __raw property
      }
      const v = rawValue ? obj[property] : transformJSONProperties(property, obj[property]);
      // Only serializer metadata uses a single leading $. Escape data keys, including the escape prefix.
      const key = property.startsWith("$") ? `$${property}` : property;
      result[key] = doBuildJson(v, stack, rawValue);
    }

    stack.pop();
    return result;
  }

  function shouldHaveRef(obj: any): boolean {
    // we only add reference to those types with a crossLanguageDefinitionId or a kind property.
    // TODO -- crossLanguageDefinitionId should be enough but there is something that should be referenced but does not have it.
    return "crossLanguageDefinitionId" in obj || "kind" in obj;
  }
}

export async function writeConfiguration(
  context: CSharpEmitterContext,
  configurations: Configuration,
  outputFolder: string,
) {
  await context.program.host.writeFile(
    resolvePath(outputFolder, configurationFileName),
    prettierOutput(JSON.stringify(configurations, null, 2)),
  );
}

function transformJSONProperties(key: string, value: any): any {
  // convertUsageNumbersToStrings
  if (key === "usage" && typeof value === "number") {
    if (value === 0) {
      return "None";
    }
    const result: string[] = [];
    for (const prop in UsageFlags) {
      if (!isNaN(Number(prop))) {
        if ((value & Number(prop)) !== 0) {
          result.push(UsageFlags[prop]);
        }
      }
    }
    return result.join(",");
  }

  // skip __raw if there is one
  if (key === "__raw") {
    return undefined;
  }

  return value;
}

function prettierOutput(output: string) {
  return output + "\n";
}
