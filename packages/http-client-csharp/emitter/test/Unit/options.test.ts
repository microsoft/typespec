vi.resetModules();

import { EmitContext, Program } from "@typespec/compiler";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it, vi } from "vitest";
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
