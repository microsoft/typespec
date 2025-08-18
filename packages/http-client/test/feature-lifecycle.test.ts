import { t } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { expect, it } from "vitest";
import "../src/typekit/index.js";
import { Tester } from "./test-host.js";

it("should get the feature lifecycle for a model property", async () => {
  const { betaProp, program } = await Tester.compile(t.code`
    namespace Test;

    model MyModel {
       id: string;
       @experimental
       ${t.modelProperty("betaProp")}: string;
    }
    `);

  const featureLifecycle = $(program).client.getFeatureLifecycle(betaProp);
  expect(featureLifecycle).toBe("Experimental");
});

it("should get the feature lifecycle for a model property within scope", async () => {
  const { betaProp, program } = await Tester.compile(t.code`
    namespace Test;

    model MyModel {
       id: string;
       @experimental(#{emitterScope: "myEmitter"})
       ${t.modelProperty("betaProp")}: string;
    }
    `);

  const featureLifecycle = $(program).client.getFeatureLifecycle(betaProp, {
    emitterName: "myEmitter",
  });
  expect(featureLifecycle).toBe("Experimental");
});

it("should get the feature lifecycle for a model property within scope (multiple scopes)", async () => {
  const { betaProp, program } = await Tester.compile(t.code`
    namespace Test;

    model MyModel {
       id: string;
       @experimental(#{emitterScope: "myEmitter, otherEmitter"})
       ${t.modelProperty("betaProp")}: string;
    }
    `);

  const featureLifecycle = $(program).client.getFeatureLifecycle(betaProp, {
    emitterName: "myEmitter",
  });
  expect(featureLifecycle).toBe("Experimental");
});

it("should get the feature lifecycle for a model property with scope and unscoped decorator", async () => {
  const { betaProp, program } = await Tester.compile(t.code`
    namespace Test;

    model MyModel {
       id: string;
       @experimental
       ${t.modelProperty("betaProp")}: string;
    }
    `);

  const featureLifecycle = $(program).client.getFeatureLifecycle(betaProp, {
    emitterName: "myEmitter",
  });
  expect(featureLifecycle).toBe("Experimental");
});

it("should not get featureLifecycle when not in scope", async () => {
  const { betaProp, program } = await Tester.compile(t.code`
    namespace Test;

    model MyModel {
       id: string;
       @experimental(#{emitterScope: "notMyEmitter"})
       ${t.modelProperty("betaProp")}: string;
    }
    `);

  const featureLifecycle = $(program).client.getFeatureLifecycle(betaProp, {
    emitterName: "myEmitter",
  });
  expect(featureLifecycle).toBeUndefined();
});

it("should not get featureLifecycle when no scope passed to query", async () => {
  const { betaProp, program } = await Tester.compile(t.code`
    namespace Test;

    model MyModel {
       id: string;
       @experimental(#{emitterScope: "notMyEmitter"})
       ${t.modelProperty("betaProp")}: string;
    }
    `);

  const featureLifecycle = $(program).client.getFeatureLifecycle(betaProp);
  expect(featureLifecycle).toBeUndefined();
});

it("should get featureLifecycle when not in excluded scopes", async () => {
  const { betaProp, program } = await Tester.compile(t.code`
    namespace Test;

    model MyModel {
       id: string;
       @experimental(#{emitterScope: "!notMyEmitter"})
       ${t.modelProperty("betaProp")}: string;
    }
    `);

  const featureLifecycle = $(program).client.getFeatureLifecycle(betaProp, {
    emitterName: "myEmitter",
  });
  expect(featureLifecycle).toBe("Experimental");
});

it("should not get featureLifecycle when in excluded scopes", async () => {
  const { betaProp, program } = await Tester.compile(t.code`
    namespace Test;

    model MyModel {
       id: string;
       @experimental(#{emitterScope: "!myEmitter"})
       ${t.modelProperty("betaProp")}: string;
    }
    `);

  const featureLifecycle = $(program).client.getFeatureLifecycle(betaProp, {
    emitterName: "myEmitter",
  });
  expect(featureLifecycle).toBeUndefined();
});
