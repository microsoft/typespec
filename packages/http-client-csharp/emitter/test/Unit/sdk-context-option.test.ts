import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { getSDKContextOptions, setSDKContextOptions } from "../../src/sdk-context-options.js";
import { CreateSdkContextOptions } from "@azure-tools/typespec-client-generator-core";
import { defaultSDKContextOptions } from "../../src/sdk-context-options.js";

describe("Get/Set SDK context options", () => {
  const testOptions: CreateSdkContextOptions = {
    additionalDecorators: [
        "@fooDecorator",
        "@barDecorator"
    ]
};

  it("get context options applies passed in decorators and does not modify state", async () => {
    const contextOptions = getSDKContextOptions(testOptions);
    ValidateOptions(contextOptions);

    // Does not modify state
    ok(defaultSDKContextOptions.additionalDecorators);
    strictEqual(0, defaultSDKContextOptions.additionalDecorators.length);
  });

  it("set context options applies passed in decorators", async () => {
    setSDKContextOptions(testOptions);
    ValidateOptions(defaultSDKContextOptions);
  });

  function ValidateOptions(options: CreateSdkContextOptions) {
    ok(options.additionalDecorators);
    strictEqual(options.additionalDecorators.length, 2);
    strictEqual(options.additionalDecorators[0], "@fooDecorator");
    strictEqual(options.additionalDecorators[1], "@barDecorator");
    ok(options.versioning);
    ok(options.versioning.previewStringRegex);
    strictEqual(options.versioning?.previewStringRegex.toString(), /$/.toString());
  }
});
