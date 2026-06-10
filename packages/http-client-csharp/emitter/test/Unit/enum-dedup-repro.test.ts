vi.resetModules();

import { TestHost } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { beforeEach, describe, it, vi } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Anonymous enum dedupe", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("does not duplicate anonymous enums synthesized from inline union operation parameters", async () => {
    const program = await typeSpecCompile(
      `
        op listKeys(
          @path accountName: string,
          @query expand?: "kerb",
        ): { keys: string[] };
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);

    const expandEnums = root.enums.filter((e) => e.name === "ListKeysRequestExpand");
    strictEqual(
      expandEnums.length,
      1,
      `Expected exactly one 'ListKeysRequestExpand' enum. Found ${expandEnums.length}: ${root.enums
        .map((e) => `${e.namespace}.${e.name} (xLangId='${e.crossLanguageDefinitionId}')`)
        .join(", ")}`,
    );
  });
});
