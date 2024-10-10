import { describe, it } from "vitest";

import { createLinterRule, createTypeSpecLibrary } from "../../src/core/library.js";
import { Linter, createLinter, resolveLinterDefinition } from "../../src/core/linter.js";
import type { LibraryInstance, LinterDefinition } from "../../src/index.js";
import {
  createTestHost,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "../../src/testing/index.js";

const noModelFoo = createLinterRule({
  name: "no-model-foo",
  description: "",
  severity: "warning",
  messages: {
    default: "Cannot call model 'Foo'",
  },
  create(context) {
    return {
      model: (target) => {
        if (target.name === "Foo") {
          context.reportDiagnostic({
            target,
          });
        }
      },
    };
  },
});

describe("compiler: linter", () => {
  async function createTestLinter(
    code: string | Record<string, string>,
    linterDef: LinterDefinition,
  ): Promise<Linter> {
    const host = await createTestHost();
    if (typeof code === "string") {
      host.addTypeSpecFile("main.tsp", code);
    } else {
      for (const [name, content] of Object.entries(code)) {
        host.addTypeSpecFile(name, content);
      }
    }

    const library: LibraryInstance = {
      entrypoint: undefined,
      metadata: { type: "module", name: "@typespec/test-linter" },
      module: { type: "module", path: "", mainFile: "", manifest: { name: "", version: "" } },
      definition: createTypeSpecLibrary({
        name: "@typespec/test-linter",
        diagnostics: {},
      }),
      linter: resolveLinterDefinition("@typespec/test-linter", linterDef),
    };

    await host.compile("main.tsp");

    const linter = createLinter(host.program, (libName) =>
      Promise.resolve(libName === "@typespec/test-linter" ? library : undefined),
    );
    return linter;
  }

  async function createTestLinterAndEnableRules(
    code: string | Record<string, string>,
    linterDef: LinterDefinition,
  ): Promise<Linter> {
    const linter = await createTestLinter(code, linterDef);

    expectDiagnosticEmpty(
      await linter.extendRuleSet({
        enable: Object.fromEntries(
          linterDef.rules.map((x) => [`@typespec/test-linter/${x.name}`, true]),
        ),
      }),
    );
    return linter;
  }

  it("registering a rule doesn't enable it", async () => {
    const linter = await createTestLinter(`model Foo {}`, {
      rules: [noModelFoo],
    });
    expectDiagnosticEmpty(linter.lint());
  });

  it("enabling a rule that doesn't exists emit a diagnostic", async () => {
    const linter = await createTestLinter(`model Foo {}`, {
      rules: [noModelFoo],
    });
    expectDiagnostics(
      await linter.extendRuleSet({ enable: { "@typespec/test-linter/not-a-rule": true } }),
      {
        severity: "error",
        code: "unknown-rule",
        message: `Rule "not-a-rule" is not found in library "@typespec/test-linter"`,
      },
    );
  });

  it("enabling a rule from a library that is not found emit a diagnostic", async () => {
    const linter = await createTestLinter(`model Foo {}`, {
      rules: [noModelFoo],
    });
    expectDiagnostics(
      await linter.extendRuleSet({
        enable: { [`@typespec/not-a-linter/${noModelFoo.name}`]: true },
      }),
      {
        severity: "error",
        code: "unknown-rule",
        message: `Rule "no-model-foo" is not found in library "@typespec/not-a-linter"`,
      },
    );
  });

  it("enabling a rule set that doesn't exists emit a diagnostic", async () => {
    const linter = await createTestLinter(`model Foo {}`, {
      rules: [noModelFoo],
    });
    expectDiagnostics(
      await linter.extendRuleSet({ extends: ["@typespec/test-linter/not-a-rule"] }),
      {
        severity: "error",
        code: "unknown-rule-set",
        message: `Rule set "not-a-rule" is not found in library "@typespec/test-linter"`,
      },
    );
  });

  it("emit a diagnostic if enabling and disabling the same rule", async () => {
    const linter = await createTestLinter(`model Foo {}`, {
      rules: [noModelFoo],
    });
    expectDiagnostics(
      await linter.extendRuleSet({
        enable: { "@typespec/test-linter/no-model-foo": true },
        disable: { "@typespec/test-linter/no-model-foo": "Reason" },
      }),
      {
        severity: "error",
        code: "rule-enabled-disabled",
        message: `Rule "@typespec/test-linter/no-model-foo" has been enabled and disabled in the same ruleset.`,
      },
    );
  });

  describe("diagnostic location", () => {
    it("doesn't emit diagnostic when in the library", async () => {
      const files = {
        "main.tsp": `
          import "my-lib";
          model Bar {}
        `,
        "node_modules/my-lib/package.json": JSON.stringify({ name: "my-lib", tspMain: "main.tsp" }),
        "node_modules/my-lib/main.tsp": "model Foo {}",
      };
      const linter = await createTestLinterAndEnableRules(files, {
        rules: [noModelFoo],
      });
      expectDiagnosticEmpty(linter.lint());
    });

    it("emit diagnostic when in the user code", async () => {
      const files = {
        "main.tsp": `
          import "my-lib";
          model Foo {}
        `,
        "node_modules/my-lib/package.json": JSON.stringify({ name: "my-lib", tspMain: "main.tsp" }),
        "node_modules/my-lib/main.tsp": "model Bar {}",
      };
      const linter = await createTestLinterAndEnableRules(files, {
        rules: [noModelFoo],
      });
      expectDiagnostics(linter.lint(), {
        severity: "warning",
        code: "@typespec/test-linter/no-model-foo",
        message: `Cannot call model 'Foo'`,
      });
    });
  });

  describe("when enabling a rule", () => {
    it("emit a diagnostic if rule report one", async () => {
      const linter = await createTestLinter(`model Foo {}`, {
        rules: [noModelFoo],
      });
      expectDiagnosticEmpty(
        await linter.extendRuleSet({
          enable: { "@typespec/test-linter/no-model-foo": true },
        }),
      );
      expectDiagnostics(linter.lint(), {
        severity: "warning",
        code: "@typespec/test-linter/no-model-foo",
        message: `Cannot call model 'Foo'`,
      });
    });

    it("emit no diagnostic if rules report none", async () => {
      const linter = await createTestLinter(`model Bar {}`, {
        rules: [noModelFoo],
      });
      expectDiagnosticEmpty(
        await linter.extendRuleSet({
          enable: { "@typespec/test-linter/no-model-foo": true },
        }),
      );
      expectDiagnosticEmpty(linter.lint());
    });
  });

  describe("when enabling a ruleset", () => {
    it("/all ruleset is automatically provided and include all rules", async () => {
      const linter = await createTestLinter(`model Foo {}`, {
        rules: [noModelFoo],
      });
      expectDiagnosticEmpty(
        await linter.extendRuleSet({
          extends: ["@typespec/test-linter/all"],
        }),
      );
      expectDiagnostics(linter.lint(), {
        severity: "warning",
        code: "@typespec/test-linter/no-model-foo",
        message: `Cannot call model 'Foo'`,
      });
    });
    it("extending specific ruleset enable the rules inside", async () => {
      const linter = await createTestLinter(`model Foo {}`, {
        rules: [noModelFoo],
        ruleSets: {
          custom: {
            enable: { "@typespec/test-linter/no-model-foo": true },
          },
        },
      });
      expectDiagnosticEmpty(
        await linter.extendRuleSet({
          extends: ["@typespec/test-linter/custom"],
        }),
      );
      expectDiagnostics(linter.lint(), {
        severity: "warning",
        code: "@typespec/test-linter/no-model-foo",
        message: `Cannot call model 'Foo'`,
      });
    });
  });

  describe("(integration) loading in program", () => {
    async function diagnoseReal(code: string) {
      const host = await createTestHost();
      host.addTypeSpecFile("main.tsp", code);
      host.addTypeSpecFile(
        "node_modules/my-lib/package.json",
        JSON.stringify({ name: "my-lib", main: "index.js" }),
      );
      host.addJsFile("node_modules/my-lib/index.js", {
        $lib: createTypeSpecLibrary({
          name: "my-lib",
          diagnostics: {},
          linter: { rules: [noModelFoo] },
        }),
      });

      return await host.diagnose("main.tsp", {
        linterRuleSet: {
          enable: { "my-lib/no-model-foo": true },
        },
      });
    }

    it("emit diagnostic when rule report", async () => {
      const diagnostics = await diagnoseReal(`
      model Foo {}`);

      expectDiagnostics(diagnostics, { code: "my-lib/no-model-foo" });
    });

    it("doesn't emit diagnostic when suppressed", async () => {
      const diagnostics = await diagnoseReal(`
      #suppress "my-lib/no-model-foo"
      model Foo {}`);

      expectDiagnosticEmpty(diagnostics);
    });
  });
});
