// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { resolvePath } from "@typespec/compiler";
import { CSharpEmitterContext } from "./sdk-context.js";
import { CodeModel } from "./type/code-model.js";
import { configurationFileName, tspOutputFileName } from "./constants.js";
import { PreserveType, stringifyRefs } from "json-serialize-refs";
import { UsageFlags } from "@azure-tools/typespec-client-generator-core";
import { Configuration } from "./type/configuration.js";


/**
 * Write the code model to the output folder.
 * @param context - The CSharp emitter context
 * @param codeModel - The code model
 * @param outputFolder - The output folder
 * @beta
 */
export async function writeCodeModel(
  context: CSharpEmitterContext,
  codeModel: CodeModel,
  outputFolder: string,
) {
  await context.program.host.writeFile(
    resolvePath(outputFolder, tspOutputFileName),
    prettierOutput(stringifyRefs(codeModel, transformJSONProperties, 1, PreserveType.Objects)),
  );
}

export async function writeConfiguration(context: CSharpEmitterContext, configurations: Configuration, outputFolder: string) {
  await context.program.host.writeFile(
    resolvePath(outputFolder, configurationFileName),
    prettierOutput(JSON.stringify(configurations, null, 2)),
  );
}

function transformJSONProperties(this: any, key: string, value: any): any {
  // convertUsageNumbersToStrings
  if (this["kind"] === "model" || this["kind"] === "enum") {
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
