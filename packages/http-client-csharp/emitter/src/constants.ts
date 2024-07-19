// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { CreateSdkContextOptions } from "@azure-tools/typespec-client-generator-core";

export const projectedNameJsonKey = "json";
export const projectedNameCSharpKey = "csharp";
export const projectedNameClientKey = "client";
export const mockApiVersion = "0000-00-00";
export const tspOutputFileName = "tspCodeModel.json";
export const configurationFileName = "Configuration.json";
export let createSDKContextoptions: CreateSdkContextOptions = {};
export function getSDKContextOptions(): CreateSdkContextOptions {
  return createSDKContextoptions;
}
export function setSDKContextOptions(options: CreateSdkContextOptions): void {
  createSDKContextoptions = options;
}
export function addAdditionalDecorators(additionalDecorators: string[]): void {
  if (!createSDKContextoptions.additionalDecorators) {
    createSDKContextoptions.additionalDecorators = additionalDecorators;
  } else {
    createSDKContextoptions.additionalDecorators =
      createSDKContextoptions.additionalDecorators.concat(additionalDecorators);
  }
}
