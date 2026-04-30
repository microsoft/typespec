import { describe, expect, it, vi } from "vitest";

import { createLinterRule, createTypeSpecLibrary } from "../../src/core/library.js";
import { Linter, createLinter, resolveLinterDefinition } from "../../src/core/linter.js";
import {
  type Interface,
  type LibraryInstance,
  type LinterDefinition,
  type LinterRuleContext,
} from "../../src/index.js";
import { expectDiagnosticEmpty, expectDiagnostics, mockFile } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

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

const exitLintRuleSync = createLinterRule({
  name: "exit-lint-rule-sync",
  description: "",
  severity: "warning",
  messages: {
    default: "Exit lint rule sync called",
  },
  async: false,
  create(context: any) {
    return {
      interface: (target) => {
        context.lastInterface = target;
      },
      exit: () => {
        context.reportDiagnostic({
          target: context.lastInterface,
          messageId: "default",
        });
      },
    };
  },
});

const noInterfaceFooAsync = createLinterRule({
  name: "no-interface-foo2-async",
  description: "",
  severity: "warning",
  messages: {
    default: "Cannot call interface 'Foo2' (async rule)",
  },
  async: true,
  create(
    context: LinterRuleContext<{
      readonly default: "Cannot call interface 'Foo2' (async rule)";
    }> & { interfaceToCheck?: Interface[] },
  ) {
    return {
      interface: (target) => {
        if (!context.interfaceToCheck) {
          context.interfaceToCheck = [];
        }
        context.interfaceToCheck.push(target);
      },
      exit: async () => {
        const r = await new Promise<Interface[]>((resolve) => {
          setTimeout(() => {
            resolve(context.interfaceToCheck?.filter((t) => t.name === "Foo2") ?? []);
          }, 0);
        });
        r.forEach((target) => {
          context.reportDiagnostic({
            target,
          });
        });
      },
    };
  },
});

const noModelWithName = createLinterRule({
  name: "no-model-with-name",
  description: "Prevents models with a configurable name",
  severity: "warning",
  messages: {
    default: "Cannot use this model name",
  },
  defaultOptions: { bannedName: "Blocked" },
  create(context) {
    return {
      model: (target) => {
        if (target.name === context.options.bannedName) {
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
    let result;
    if (typeof code === "string") {
      result = await Tester.compile(code);
    } else {
      const mainCode = code["main.tsp"];
      const otherFiles = Object.fromEntries(
        Object.entries(code).filter(([name]) => name !== "main.tsp"),
      );
      result =
        Object.keys(otherFiles).length > 0
          ? await Tester.files(otherFiles).compile(mainCode)
          : await Tester.compile(mainCode);
    }

    const library: LibraryInstance = {
      entrypoint: {} as any,
      metadata: { type: "module", name: "@typespec/test-linter" },
      module: { type: "module", path: "", mainFile: "", manifest: { name: "", version: "" } },
      definition: createTypeSpecLibrary({
        name: "@typespec/test-linter",
        diagnostics: {},
      }),
      linter: resolveLinterDefinition("@typespec/test-linter", linterDef),
    };

    const linter = createLinter(result.program, (libName) =>
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
    expectDiagnosticEmpty((await linter.lint()).diagnostics);
  });

  it("registering a rule doesn't enable it: async", async () => {
    const linter = await createTestLinter(`interface Foo2 {}`, {
      rules: [noInterfaceFooAsync],
    });
    expectDiagnosticEmpty((await linter.lint()).diagnostics);
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
      expectDiagnosticEmpty((await linter.lint()).diagnostics);
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
      expectDiagnostics((await linter.lint()).diagnostics, {
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
      expectDiagnostics((await linter.lint()).diagnostics, {
        severity: "warning",
        code: "@typespec/test-linter/no-model-foo",
        message: `Cannot call model 'Foo'`,
      });
    });

    it("emit a diagnostic if rule report one: async", async () => {
      const linter = await createTestLinter(`interface Foo2 {}`, {
        rules: [noInterfaceFooAsync],
      });
      expectDiagnosticEmpty(
        await linter.extendRuleSet({
          enable: { "@typespec/test-linter/no-interface-foo2-async": true },
        }),
      );
      expectDiagnostics((await linter.lint()).diagnostics, {
        severity: "warning",
        code: "@typespec/test-linter/no-interface-foo2-async",
        message: `Cannot call interface 'Foo2' (async rule)`,
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
      expectDiagnosticEmpty((await linter.lint()).diagnostics);
    });

    it("emit no diagnostic if rule report none: async", async () => {
      const linter = await createTestLinter(`interface Foo3 {}`, {
        rules: [noInterfaceFooAsync],
      });
      expectDiagnosticEmpty(
        await linter.extendRuleSet({
          enable: { "@typespec/test-linter/no-interface-foo2-async": true },
        }),
      );
      expectDiagnosticEmpty((await linter.lint()).diagnostics);
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
      expectDiagnostics((await linter.lint()).diagnostics, {
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
      expectDiagnostics((await linter.lint()).diagnostics, {
        severity: "warning",
        code: "@typespec/test-linter/no-model-foo",
        message: `Cannot call model 'Foo'`,
      });
    });
  });

  describe("(integration) loading in program", () => {
    async function diagnoseReal(code: string) {
      return await Tester.files({
        "node_modules/my-lib/package.json": JSON.stringify({ name: "my-lib", main: "index.js" }),
        "node_modules/my-lib/index.js": mockFile.js({
          $lib: createTypeSpecLibrary({
            name: "my-lib",
            diagnostics: {},
          }),
          $linter: { rules: [noModelFoo] },
        }),
      }).diagnose(code, {
        compilerOptions: {
          linterRuleSet: {
            enable: { "my-lib/no-model-foo": true },
          },
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

  describe("async and sync rule together", () => {
    it("runs both async and sync rules", async () => {
      const linter = await createTestLinterAndEnableRules(
        {
          "main.tsp": `
        model Foo {}
        interface Foo2 {}
      `,
        },
        {
          rules: [noModelFoo, noInterfaceFooAsync, exitLintRuleSync],
        },
      );

      const resultSync = await linter.lint();
      expectDiagnostics(
        resultSync.diagnostics,
        [
          {
            severity: "warning",
            code: "@typespec/test-linter/no-model-foo",
            message: `Cannot call model 'Foo'`,
          },
          {
            severity: "warning",
            code: "@typespec/test-linter/exit-lint-rule-sync",
            message: "Exit lint rule sync called",
          },
          {
            severity: "warning",
            code: "@typespec/test-linter/no-interface-foo2-async",
            message: `Cannot call interface 'Foo2' (async rule)`,
          },
        ],
        {
          strict: true,
        },
      );
    });
  });

  describe("rule options", () => {
    it("uses default options when enabled with true", async () => {
      const linter = await createTestLinter(`model Blocked {}`, {
        rules: [noModelWithName],
      });
      expectDiagnosticEmpty(
        await linter.extendRuleSet({
          enable: { "@typespec/test-linter/no-model-with-name": true },
        }),
      );
      expectDiagnostics((await linter.lint()).diagnostics, {
        severity: "warning",
        code: "@typespec/test-linter/no-model-with-name",
        message: "Cannot use this model name",
      });
    });

    it("uses custom options when provided as object", async () => {
      const linter = await createTestLinter(`model CustomBanned {}`, {
        rules: [noModelWithName],
      });
      expectDiagnosticEmpty(
        await linter.extendRuleSet({
          enable: {
            "@typespec/test-linter/no-model-with-name": { bannedName: "CustomBanned" },
          },
        }),
      );
      expectDiagnostics((await linter.lint()).diagnostics, {
        severity: "warning",
        code: "@typespec/test-linter/no-model-with-name",
        message: "Cannot use this model name",
      });
    });

    it("custom options override default options", async () => {
      // "Blocked" is the default banned name, but we override to "Other"
      // so "Blocked" should NOT trigger the rule
      const linter = await createTestLinter(`model Blocked {}`, {
        rules: [noModelWithName],
      });
      expectDiagnosticEmpty(
        await linter.extendRuleSet({
          enable: {
            "@typespec/test-linter/no-model-with-name": { bannedName: "Other" },
          },
        }),
      );
      expectDiagnosticEmpty((await linter.lint()).diagnostics);
    });

    it("options are accessible in the rule context", async () => {
      let capturedOptions: any;
      const ruleWithCapture = createLinterRule({
        name: "capture-options",
        description: "",
        severity: "warning",
        messages: { default: "test" },
        defaultOptions: { key1: "val1", key2: 42 },
        create(context) {
          capturedOptions = context.options;
          return {};
        },
      });

      const linter = await createTestLinter(`model Foo {}`, {
        rules: [ruleWithCapture],
      });
      expectDiagnosticEmpty(
        await linter.extendRuleSet({
          enable: { "@typespec/test-linter/capture-options": { key1: "override" } },
        }),
      );
      await linter.lint();
      expect(capturedOptions).toEqual({ key1: "override", key2: 42 });
    });

    it("rule without options gets empty object in context", async () => {
      let capturedOptions: any;
      const ruleNoOptions = createLinterRule({
        name: "no-options-rule",
        description: "",
        severity: "warning",
        messages: { default: "test" },
        create(context) {
          capturedOptions = context.options;
          return {};
        },
      });

      const linter = await createTestLinter(`model Foo {}`, {
        rules: [ruleNoOptions],
      });
      expectDiagnosticEmpty(
        await linter.extendRuleSet({
          enable: { "@typespec/test-linter/no-options-rule": true },
        }),
      );
      await linter.lint();
      expect(capturedOptions).toEqual({});
    });

    it("options from enable value override ruleset defaults", async () => {
      const linter = await createTestLinter(`model Foo {} model Bar {}`, {
        rules: [noModelWithName],
        ruleSets: {
          custom: {
            enable: {
              "@typespec/test-linter/no-model-with-name": { bannedName: "Foo" },
            },
          },
        },
      });

      // Extend with the ruleset that bans "Foo"
      expectDiagnosticEmpty(
        await linter.extendRuleSet({ extends: ["@typespec/test-linter/custom"] }),
      );
      expectDiagnostics((await linter.lint()).diagnostics, {
        severity: "warning",
        code: "@typespec/test-linter/no-model-with-name",
      });
    });

    describe("option schema validation", () => {
      const ruleWithSchema = createLinterRule({
        name: "with-schema",
        description: "Rule with option schema validation",
        severity: "warning",
        messages: { default: "test" },
        optionSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            count: { type: "number" },
          },
          required: ["name"],
          additionalProperties: false,
        },
        create() {
          return {};
        },
      });

      it("reports diagnostic when options fail schema validation", async () => {
        const linter = await createTestLinter(`model Foo {}`, {
          rules: [ruleWithSchema],
        });
        const diagnostics = await linter.extendRuleSet({
          enable: {
            "@typespec/test-linter/with-schema": { name: 123 } as any,
          },
        });
        expectDiagnostics(diagnostics, {
          code: "invalid-rule-options",
          severity: "error",
        });
      });

      it("reports diagnostic when required option is missing", async () => {
        const linter = await createTestLinter(`model Foo {}`, {
          rules: [ruleWithSchema],
        });
        const diagnostics = await linter.extendRuleSet({
          enable: {
            "@typespec/test-linter/with-schema": { count: 5 } as any,
          },
        });
        expectDiagnostics(diagnostics, {
          code: "invalid-rule-options",
          severity: "error",
        });
      });

      it("reports diagnostic when additional properties are provided", async () => {
        const linter = await createTestLinter(`model Foo {}`, {
          rules: [ruleWithSchema],
        });
        const diagnostics = await linter.extendRuleSet({
          enable: {
            "@typespec/test-linter/with-schema": { name: "test", extra: true } as any,
          },
        });
        expectDiagnostics(diagnostics, {
          code: "invalid-rule-options",
          severity: "error",
        });
      });

      it("accepts valid options matching the schema", async () => {
        const linter = await createTestLinter(`model Foo {}`, {
          rules: [ruleWithSchema],
        });
        const diagnostics = await linter.extendRuleSet({
          enable: {
            "@typespec/test-linter/with-schema": { name: "valid", count: 10 },
          },
        });
        expectDiagnosticEmpty(diagnostics);
      });

      it("does not validate options when enabled with true (uses defaults)", async () => {
        const linter = await createTestLinter(`model Foo {}`, {
          rules: [ruleWithSchema],
        });
        const diagnostics = await linter.extendRuleSet({
          enable: {
            "@typespec/test-linter/with-schema": true,
          },
        });
        expectDiagnosticEmpty(diagnostics);
      });

      it("does not validate when rule has no optionSchema", async () => {
        const linter = await createTestLinter(`model Foo {}`, {
          rules: [noModelWithName],
        });
        // noModelWithName has no optionSchema, so any object should be accepted
        const diagnostics = await linter.extendRuleSet({
          enable: {
            "@typespec/test-linter/no-model-with-name": { anything: "goes" } as any,
          },
        });
        expectDiagnosticEmpty(diagnostics);
      });

      it("does not run the rule when options are invalid", async () => {
        const modelListener = vi.fn();
        const ruleWithRequiredOption = createLinterRule({
          name: "required-option-rule",
          description: "Rule that requires a name option",
          severity: "warning",
          messages: { default: "always fires" },
          optionSchema: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
            required: ["name"],
          },
          create() {
            return {
              model: modelListener,
            };
          },
        });

        const linter = await createTestLinter(`model Foo {}`, {
          rules: [ruleWithRequiredOption],
        });

        // Provide invalid options (missing required "name")
        const configDiagnostics = await linter.extendRuleSet({
          enable: {
            "@typespec/test-linter/required-option-rule": { notName: "value" } as any,
          },
        });
        expectDiagnostics(configDiagnostics, {
          code: "invalid-rule-options",
          severity: "error",
        });

        // Rule should not have run
        await linter.lint();
        expect(modelListener).not.toHaveBeenCalled();
      });
    });
  });
});
