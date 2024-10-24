// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { deepStrictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { Model } from "../../src/core/types.js";
import { getVisibility } from "../../src/core/visibility/core.js";
import { BasicTestRunner, createTestRunner } from "../../src/testing/index.js";

describe("visibility (legacy)", function () {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  describe("@withDefaultKeyVisibility", () => {
    it("sets the default visibility on a key property when not already present", async () => {
      const { TestModel } = (await runner.compile(
        `
        model OriginalModel {
          @key
          name: string;
        }

        @test
        model TestModel is DefaultKeyVisibility<OriginalModel, "read"> {
        } `,
      )) as { TestModel: Model };

      deepStrictEqual(getVisibility(runner.program, TestModel.properties.get("name")!), ["read"]);
    });

    it("allows visibility applied to a key property to override the default", async () => {
      const { TestModel } = (await runner.compile(
        `
        model OriginalModel {
          @key
          @visibility("read", "update")
          name: string;
        }

        @test
        model TestModel is DefaultKeyVisibility<OriginalModel, "create"> {
        } `,
      )) as { TestModel: Model };

      deepStrictEqual(getVisibility(runner.program, TestModel.properties.get("name")!), [
        "read",
        "update",
      ]);
    });
  });
});
