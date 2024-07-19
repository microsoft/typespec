// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

export const projectedNameJsonKey = "json";
export const projectedNameCSharpKey = "csharp";
export const projectedNameClientKey = "client";
export const mockApiVersion = "0000-00-00";
export const tspOutputFileName = "tspCodeModel.json";
export const configurationFileName = "Configuration.json";
export let createSDKContextoptions = {
  additionalDecorators: ["TypeSpec\\.@projectedName"],
};
export function getSDKContextOptions(): any {
  return createSDKContextoptions;
}
export function setSDKContextOptions(options: any): void {
  createSDKContextoptions = options;
}
export function addAdditionalDecorators(additionalDecorators: string[]): void {
  createSDKContextoptions.additionalDecorators =
    createSDKContextoptions.additionalDecorators.concat(additionalDecorators);
}
