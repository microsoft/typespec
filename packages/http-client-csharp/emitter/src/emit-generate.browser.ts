// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

// Browser implementation: sends code model to a playground server for generation.

import { resolvePath } from "@typespec/compiler";
import type { GenerateOptions } from "./emit-generate.js";
import { CSharpEmitterContext } from "./sdk-context.js";

const SERVER_URL = "https://csharp-playground-server.azurewebsites.net";
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function generate(
  sdkContext: CSharpEmitterContext,
  codeModelJson: string,
  configJson: string,
  options: GenerateOptions,
): Promise<void> {
  const response = await fetch(`${SERVER_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      codeModel: codeModelJson,
      configuration: configJson,
      generatorName: options.generatorName,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Playground server error (${response.status}): ${errorText}`);
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new Error(`Unexpected response content-type: ${contentType}`);
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
    throw new Error(
      `Response too large: ${contentLength} bytes exceeds ${MAX_RESPONSE_SIZE} byte limit`,
    );
  }

  const result = await response.json();

  if (!result || !Array.isArray(result.files)) {
    throw new Error("Invalid response: expected { files: [...] }");
  }

  for (const file of result.files) {
    if (typeof file.path !== "string" || typeof file.content !== "string") {
      throw new Error(`Invalid file entry: expected { path: string, content: string }`);
    }
    await sdkContext.program.host.writeFile(
      resolvePath(options.outputFolder, file.path),
      file.content,
    );
  }
}
