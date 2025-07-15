// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { UsageFlags } from "@azure-tools/typespec-client-generator-core";
import { resolvePath } from "@typespec/compiler";
import { configurationFileName, tspOutputFileName } from "./constants.js";
import { CSharpEmitterContext } from "./sdk-context.js";
import { CodeModel } from "./type/code-model.js";
import { Configuration } from "./type/configuration.js";

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
    prettierOutput(JSON.stringify(buildJson(context, codeModel), transformJSONProperties, 2)),
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

  return doBuildJson(codeModel, stack);

  function doBuildJson(obj: any, stack: any[]): any {
    // check if this is a primitive type or null or undefined
    if (!obj || typeof obj !== "object") {
      return obj;
    }
    // we switch here for object, arrays and primitives
    if (Array.isArray(obj)) {
      // array types
      return obj.map((item) => doBuildJson(item, stack));
    } else {
      // this is an object
      if (shouldHaveRef(obj)) {
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
        return handleObject(obj, undefined, stack);
      }
    }
  }

  function handleObject(obj: any, id: string | undefined, stack: any[]): any {
    if (stack.includes(obj)) {
      // we have a cyclical reference, we should not continue
      context.logger.warn(`Cyclical reference detected in the code model (id: ${id}).`);
      return undefined;
    }

    const result: any = id === undefined ? {} : { $id: id };
    stack.push(obj);

    for (const property in obj) {
      if (property === "__raw") {
        continue; // skip __raw property
      }
      const v = obj[property];
      result[property] = doBuildJson(v, stack);
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

function transformJSONProperties(this: any, key: string, value: any): any {
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
