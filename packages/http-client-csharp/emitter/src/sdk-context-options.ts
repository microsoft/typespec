import { CreateSdkContextOptions } from "@azure-tools/typespec-client-generator-core";

export let defaultSDKContextOptions: CreateSdkContextOptions = {
  versioning: undefined,
  additionalDecorators: [],
};

export function setSDKContextOptions(options: CreateSdkContextOptions) {
  defaultSDKContextOptions = {
    versioning: options.versioning ?? defaultSDKContextOptions.versioning,
    additionalDecorators: getAdditionalDecorators(options),
  };
}

function getAdditionalDecorators(options: CreateSdkContextOptions) {
  if (options.additionalDecorators) {
    if (defaultSDKContextOptions.additionalDecorators) {
      return [...defaultSDKContextOptions.additionalDecorators, ...options.additionalDecorators];
    } else {
      return options.additionalDecorators;
    }
  } else {
    return defaultSDKContextOptions.additionalDecorators;
  }
}
