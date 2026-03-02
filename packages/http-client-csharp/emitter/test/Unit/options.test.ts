vi.resetModules();

import { EmitContext, Program } from "@typespec/compiler";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createConfiguration } from "../../src/emitter.js";
import { CSharpEmitterOptions } from "../../src/options.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Test license info", () => {
  let program: Program;

  beforeEach(async () => {
    const runner = await createEmitterTestHost();
    program = await typeSpecCompile(
      `
        `,
      runner,
    );
  });

  it("should set licenseInfo into config", async () => {
    const context: EmitContext<CSharpEmitterOptions> = createEmitterContext(program, {
      license: {
        name: "Foo license",
        company: "Microsoft",
        link: "https://example.com",
        header: "Foo License",
        description: "license description",
      },
    });
    const sdkContext = await createCSharpSdkContext(context);
    const config = createConfiguration(context.options, "namespace", sdkContext);
    ok(config.license);
    strictEqual(config.license.name, "Foo license");
    strictEqual(config.license.company, "Microsoft");
    strictEqual(config.license.link, "https://example.com");
    strictEqual(config.license.header, "Foo License");
    strictEqual(config.license.description, "license description");
  });

  it("should use known description for known license names", async () => {
    const context: EmitContext<CSharpEmitterOptions> = createEmitterContext(program, {
      license: {
        name: "MIT License",
        company: "Microsoft",
        link: "https://example.com",
        header: "MIT License",
      },
    });
    const sdkContext = await createCSharpSdkContext(context);
    const config = createConfiguration(context.options, "namespace", sdkContext);
    ok(config.license);
    strictEqual(config.license.name, "MIT License");
    strictEqual(config.license.company, "Microsoft");
    strictEqual(config.license.link, "https://example.com");
    strictEqual(config.license.header, "MIT License");
    strictEqual(
      config.license.description,
      `Copyright (c) Microsoft

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.`,
    );
  });

  it("should use description from options for known license", async () => {
    const context: EmitContext<CSharpEmitterOptions> = createEmitterContext(program, {
      license: {
        name: "MIT License",
        company: "Microsoft",
        link: "https://example.com",
        header: "MIT License",
        description: "custom description",
      },
    });
    const sdkContext = await createCSharpSdkContext(context);
    const config = createConfiguration(context.options, "namespace", sdkContext);
    ok(config.license);
    strictEqual(config.license.name, "MIT License");
    strictEqual(config.license.company, "Microsoft");
    strictEqual(config.license.link, "https://example.com");
    strictEqual(config.license.header, "MIT License");
    strictEqual(config.license.description, "custom description");
  });
});

describe("Configuration tests", async () => {
  let program: Program;

  beforeEach(async () => {
    const runner = await createEmitterTestHost();
    program = await typeSpecCompile(
      `
        `,
      runner,
    );
  });

  it("Can create configuration with custom options", async () => {
    interface TestEmitterOptions extends CSharpEmitterOptions {
      namespace?: string;
    }
    const customOptions: TestEmitterOptions = {
      "package-name": "custom-package",
      "unreferenced-types-handling": "removeOrInternalize",
      "disable-xml-docs": true,
      license: {
        name: "Custom License",
        company: "Custom Company",
        header: "Custom Header",
        link: "https://custom-link.com",
        description: "Custom Description",
      },
      namespace: "CustomNamespace",
    };
    const context = createEmitterContext(program, customOptions);
    const sdkContext = await createCSharpSdkContext(context);
    const config = createConfiguration(customOptions, "rootNamespace", sdkContext);

    expect(config["package-name"]).toBe("custom-package");
    expect(config["unreferenced-types-handling"]).toBe("removeOrInternalize");
    expect(config["disable-xml-docs"]).toBe(true);
    expect(config.license).toEqual({
      name: "Custom License",
      company: "Custom Company",
      header: "Custom Header",
      link: "https://custom-link.com",
      description: "Custom Description",
    });
    expect(config["namespace"]).toBe("CustomNamespace");

    // Should not have the skipped keys
    expect(config["new-project"]).toBeUndefined();
    expect(config["update-code-model"]).toBeUndefined();
    expect(config["sdk-context-options"]).toBeUndefined();
    expect(config["save-inputs"]).toBeUndefined();
    expect(config["debug"]).toBeUndefined();
    expect(config["logLevel"]).toBeUndefined();
    expect(config["generator-name"]).toBeUndefined();
    expect(config["api-version"]).toBeUndefined();
    expect(config["generate-protocol-methods"]).toBeUndefined();
    expect(config["generate-convenience-methods"]).toBeUndefined();
  });

  it("should populate api-versions from sdkContext metadata", async () => {
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const config = createConfiguration(context.options, "namespace", sdkContext);

    // The test TypeSpec has a versioned service, so api-versions should be populated
    const apiVersions = config["api-versions"];
    expect(apiVersions).toBeDefined();
    expect(typeof apiVersions).toBe("object");
    // The default test TypeSpec defines Azure.Csharp.Testing with version "2023-01-01-preview"
    expect(apiVersions!["Azure.Csharp.Testing"]).toBe("2023-01-01-preview");
  });

  it("should not populate api-versions when metadata has no apiVersions", async () => {
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    // Clear the apiVersions to simulate a scenario with no versions
    sdkContext.sdkPackage.metadata.apiVersions = undefined;
    const config = createConfiguration(context.options, "namespace", sdkContext);

    expect(config["api-versions"]).toBeUndefined();
  });

  it("should not populate api-versions when metadata has empty apiVersions map", async () => {
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    // Set an empty map
    sdkContext.sdkPackage.metadata.apiVersions = new Map();
    const config = createConfiguration(context.options, "namespace", sdkContext);

    expect(config["api-versions"]).toBeUndefined();
  });
});
