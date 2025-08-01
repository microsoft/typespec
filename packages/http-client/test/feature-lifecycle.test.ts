import { t } from "@typespec/compiler/testing";
import { expect, it } from "vitest";
import { Tester } from "./test-host.js";

it("should get the feature lifecycle for a model property", async () => {
  const { betaProp } = await Tester.compile(t.code`
    namespace Test;

    model MyModel {
       id: string;
       @featureLifecycle(FeatureLifecycle.Experimental)
       ${t.modelProperty("betaProp")}: string;
    }
    `);

  expect(betaProp.kind).toBe("modelProperty");
});
