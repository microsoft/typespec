import { resolvePath } from "@typespec/compiler";
import { createTester, expectDiagnostics, t, TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeAll, expect, it } from "vitest";
import "../../src/typekit/index.js";

let runner: TesterInstance;

beforeAll(async () => {
  const Tester = createTester(resolvePath(import.meta.dirname, "../.."), {
    libraries: ["@typespec/http", "@typespec/http-client"],
  })
    .importLibraries()
    .using("Http", "HttpClient");

  runner = await Tester.createInstance();
});

it("should get the feature lifecycle for a model property", async () => {
  const { betaProp, program } = await runner.compile(t.code`
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
  const { betaProp, program } = await runner.compile(t.code`
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
  const { betaProp, program } = await runner.compile(t.code`
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
  const { betaProp, program } = await runner.compile(t.code`
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
  const { betaProp, program } = await runner.compile(t.code`
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
  const { betaProp, program } = await runner.compile(t.code`
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
  const { betaProp, program } = await runner.compile(t.code`
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
  const { betaProp, program } = await runner.compile(t.code`
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

it("should report diagnostics when both include and exclude are set", async () => {
  const diagnostics = await runner.diagnose(`
    namespace Test;

    model MyModel {
       id: string;
       @experimental(#{emitterScope: "!myEmitter,otherEmitter"})
       betaProp: string;
    }
    `);

  expectDiagnostics(diagnostics, {
    code: "include-and-exclude-scopes",
    message: "The @experimental should only either include or exclude scopes, not both.",
  });
});
