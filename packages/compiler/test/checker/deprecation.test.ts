import { describe, expect, it } from "vitest";
import type { DiagnosticMatch } from "../../src/testing/index.js";
import {
  expectDiagnosticEmpty,
  expectDiagnostics,
  extractCursor,
  mockFile,
} from "../../src/testing/index.js";
import { Tester } from "../tester.js";

async function expectDeprecations(
  source: string,
  deprecations: string[],
  tester: typeof Tester = Tester,
) {
  const expectedDiagnostics: DiagnosticMatch[] = [];
  for (const deprecation of deprecations) {
    const { source: newSource, pos } = extractCursor(source);
    expectedDiagnostics.push({
      code: "deprecated",
      message: `Deprecated: ${deprecation}`,
      severity: "warning",
      pos,
    });

    // Continue with the updated source
    source = newSource;
  }

  expectDiagnostics(await tester.diagnose(source), expectedDiagnostics);
}

describe("#deprecated directive", () => {
  it("emits deprecation for use of deprecated model types", async () => {
    await expectDeprecations(
      `
          #deprecated "OldFoo is deprecated"
          model OldFoo {}

          op get(): ┆OldFoo;

          model Bar {
            foo: string | ┆OldFoo;
          }
        `,
      ["OldFoo is deprecated", "OldFoo is deprecated"],
    );
  });

  it("emits deprecation for use of model that extends deprecated parent", async () => {
    await expectDeprecations(
      `
          #deprecated "OldFoo is deprecated"
          model OldFoo {}

          model NewFoo extends ┆OldFoo {}
          model IsFoo is ┆NewFoo {}
          model NewIsFoo is IsFoo {}
          `,
      ["OldFoo is deprecated", "OldFoo is deprecated"],
    );
  });

  it("emits deprecation for use of deprecated model properties", async () => {
    await expectDeprecations(
      `
          model Foo {
            #deprecated "Use id instead"
            name: string;
          }

          model Bar {
            value: ┆Foo.name;
          }

          op get(name: ┆Foo.name): string;
        `,
      ["Use id instead", "Use id instead"],
    );
  });

  it("emits deprecation for use of deprecated model properties from extended models", async () => {
    await expectDeprecations(
      `
          model Foo {
            #deprecated "Use id instead"
            name: string;
          }

          model Bar extends Foo {}
          model Baz is Foo {}
          model Buz { ...Foo }

          op get(name: ┆Bar.name): string;
          op put(name: ┆Baz.name): string;
          op delete(name: ┆Buz.name): string;
        `,
      ["Use id instead", "Use id instead", "Use id instead"],
    );
  });

  it("emits deprecation for use of deprecated templated model", async () => {
    await expectDeprecations(
      `
        #deprecated "Foo is deprecated"
        model Foo<T> {}

        model Bar {
          foo: ┆Foo<string>;
        }
        `,
      ["Foo is deprecated"],
    );
  });

  it("emits deprecation for use of deprecated scalar", async () => {
    await expectDeprecations(
      `
          #deprecated "Name is deprecated"
          scalar Name extends string;
          scalar OtherName extends ┆Name;

          model Bar {
            name: ┆Name;
            otherName: ┆OtherName;
          }
          `,
      ["Name is deprecated", "Name is deprecated", "Name is deprecated"],
    );
  });

  it("emits deprecation for use of deprecated operation type", async () => {
    await expectDeprecations(
      `
          #deprecated "oldGet is deprecated"
          op oldGet(): string;

          op someGet is ┆oldGet;
          op newGet is someGet; // No diagnostic here
         `,
      ["oldGet is deprecated"],
    );
  });

  it("emits deprecation for references of deprecated operations from extended interfaces", async () => {
    await expectDeprecations(
      `
          interface Foo {
            #deprecated "Foo is deprecated"
            foo(): void;
          }

          interface Bar extends Foo {}

          op baz is ┆Bar.foo;
        `,
      ["Foo is deprecated"],
    );
  });

  it("emits deprecation for usage on alias types", async () => {
    await expectDeprecations(
      `
          model Foo<T> { val: T; }
          model Bar {}

          #deprecated "StringFoo is deprecated"
          alias StringFoo = Foo<string>;

          op get(): ┆StringFoo;
          op otherGet(): Foo<string>; // No diagnostic here, only on alias
          op put(str: string | ┆StringFoo): void;

          model Baz {
            foo: ┆StringFoo;
          }
        `,
      ["StringFoo is deprecated", "StringFoo is deprecated", "StringFoo is deprecated"],
    );
  });

  it("emits deprecation for use of deprecated decorator signatures", async () => {
    const tester = Tester.files({ "test.js": mockFile.js({ $testDec: () => {} }) });

    await expectDeprecations(
      `
        import "./test.js";
        using TypeSpec.Reflection;

        #deprecated "testDec is deprecated"
        extern dec testDec(target: Model);

        ┆@testDec
        model Foo {}
        `,
      ["testDec is deprecated"],
      tester,
    );
  });

  it("emits diagnostic when multiple #deprecated directives are used on a node", async () => {
    const diagnostics = await Tester.diagnose(`
          #deprecated "Foo is deprecated"
          #deprecated "Foo is deprecated again"
          model Foo {}
          `);

    expectDiagnostics(diagnostics, [{ code: "duplicate-deprecation" }]);
  });

  describe("referencing in template constraint", () => {
    it("emits diagnostic when template is not instantiated", async () => {
      await expectDeprecations(
        `
            #deprecated "OldFoo is deprecated"
            model OldFoo {}
            
            model Bar<T extends ┆OldFoo> {}
          `,
        ["OldFoo is deprecated"],
      );
    });

    it("doesn't emit more diagnostic if instantiating template", async () => {
      await expectDeprecations(
        `
            #deprecated "OldFoo is deprecated"
            model OldFoo {}
            
            model Bar<T extends ┆OldFoo> {}
          
            alias T1 = Bar<{one: string}>;
            alias T2 = Bar<{two: string}>;
          `,
        ["OldFoo is deprecated"],
      );
    });

    it("can suppress", async () => {
      const diagnostics = await Tester.diagnose(`
          #deprecated "OldFoo is deprecated"
          model OldFoo {}
          
          #suppress "deprecated" "Using it anyway"
          model Bar<T extends OldFoo> {}
        `);

      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("referencing in template argument", () => {
    it("emits diagnostic", async () => {
      await expectDeprecations(
        `
            #deprecated "OldFoo is deprecated"
            model OldFoo {}
            
            model Bar<T> {...T}

            alias T1 = Bar<┆OldFoo>;
          `,
        ["OldFoo is deprecated"],
      );
    });

    it("can suppress", async () => {
      const diagnostics = await Tester.diagnose(`
          #deprecated "OldFoo is deprecated"
          model OldFoo {}
          
          model Bar<T> {...T}

          #suppress "deprecated" "Using it anyway"
          alias T1 = Bar<OldFoo>;
        `);

      expectDiagnosticEmpty(diagnostics);
    });
  });

  it("can have its diagnostics suppressed", async () => {
    // cspell:ignore Morp
    const diagnostics = await Tester.diagnose(`
        #deprecated "Foo is deprecated"
        model Foo {
          #deprecated "Name is deprecated"
          name: string;
        }

        model Bar {
          #suppress "deprecated" "Using it anyway"
          name: Foo;
        }

        op foo(
          #suppress "deprecated" "Using it anyway"
          foo: Foo
        ): string;

        model Baz {
          #suppress "deprecated" "Using it anyway"
          ...Foo;
        }

        model Buz {
          #suppress "deprecated" "Using it anyway"
          name: Foo.name;
        }
        `);

    expectDiagnosticEmpty(diagnostics);
  });

  describe("skips type deprecation warning when referenced in a deprecated parent context", () => {
    const signatures = [
      ["parameter", "op test(body: ┆Legacy.Old): void;"],
      ["nested parameter", "op test(body: { nested: ┆Legacy.Old }): void;"],
      ["spread parameter", "op test(...┆┆Legacy.Old): void;"],
      ["array parameter", "op test(body: ┆Legacy.Old[]): void;"],
      ["tuple parameter", "op test(body: [┆Legacy.Old]): void;"],
      ["union parameter", "op test(body: string | ┆Legacy.Old): void;"],
      ["intersection parameter", "op test(body: ┆Legacy.Old & {}): void;"],
      ["templated parameter", "op test(body: Box<┆Legacy.Old>): void;"],
      ["response", "op test(): ┆Legacy.Old;"],
      ["nested response", "op test(): { body: ┆Legacy.Old };"],
      ["spread response", "op test(): { ...┆┆Legacy.Old };"],
      ["array response", "op test(): ┆Legacy.Old[];"],
      ["tuple response", "op test(): [┆Legacy.Old];"],
      ["union response", "op test(): string | ┆Legacy.Old;"],
      ["intersection response", "op test(): ┆Legacy.Old & {};"],
      ["templated response", "op test(): Box<┆Legacy.Old>;"],
      ["operation template parameter", "op test is Generic<┆Legacy.Old, void>;"],
      ["operation template body", "op test is Generic<{ body: ┆Legacy.Old }, void>;"],
      ["operation template response", "op test is Generic<{}, ┆Legacy.Old>;"],
      ["operation template nested body", "op test is Generic<{ body: Box<┆Legacy.Old[]> }, void>;"],
      [
        "operation template nested response",
        "op test is Generic<{}, { body: Box<┆Legacy.Old[]> }>;",
      ],
      ["named template argument", "op test is Generic<R = ┆Legacy.Old, P = {}>;"],
      ["template constraint", "op test<T extends ┆Legacy.Old>(body: T): T;"],
      ["template default", "op test<T = ┆Legacy.Old>(body: T): T;"],
    ];

    describe.each(["standalone", "interface", "deprecated interface"])("%s operation", (scope) => {
      describe.each([false, true])("deprecated: %s", (deprecated) => {
        it.each(signatures)("%s", async (_name, signature) => {
          const suppressed = deprecated || scope === "deprecated interface";
          const operation = `${deprecated ? '#deprecated "Operation is deprecated"' : ""}
            ${signature}`;
          const source = `
            namespace Legacy {
              #deprecated "Old is deprecated"
              model Old { value: string; }
            }
            model Box<T> { value: T; }
            op Generic<P extends {}, R>(...P): R;

            ${
              scope === "standalone"
                ? operation
                : `${scope === "deprecated interface" ? '#deprecated "API is deprecated"' : ""}
                  interface API { ${operation} }`
            }
          `;
          await expectDeprecations(
            suppressed ? source.replaceAll("┆", "") : source,
            suppressed ? [] : Array(signature.split("┆").length - 1).fill("Old is deprecated"),
          );
        });
      });
    });

    it("still warns in an independently declared model used by a deprecated operation", async () => {
      await expectDeprecations(
        `
          #deprecated "Old is deprecated"
          model Old {}
          model Body { value: ┆Old; }

          #deprecated "Operation is deprecated"
          op test(body: Body): Body;
        `,
        ["Old is deprecated"],
      );
    });

    it("still warns in active operations next to a deprecated operation", async () => {
      await expectDeprecations(
        `
          #deprecated "Old is deprecated"
          model Old {}
          interface API {
            #deprecated "Operation is deprecated"
            op old(body: Old): Old;
            op active(body: ┆Old): ┆Old;
          }
        `,
        ["Old is deprecated", "Old is deprecated"],
      );
    });

    it("offers the existing suppression code fix for an active operation body", async () => {
      const diagnostics = await Tester.diagnose(`
        #deprecated "Old is deprecated"
        model Old {}
        op test(body: { nested: Old }): void;
      `);
      expectDiagnostics(diagnostics, [{ code: "deprecated" }]);
      expect(diagnostics[0].codefixes).toContainEqual(
        expect.objectContaining({ id: "suppress", label: 'Suppress warning: "deprecated"' }),
      );
    });

    it("deprecated model used in deprecated types", async () => {
      await expectDeprecations(
        `
            #deprecated "OldFoo is deprecated"
            model OldFoo {
              foo: string;
            }

            #deprecated "oldOp is deprecated"
            op oldOp(): OldFoo;

            #deprecated "OldBar is deprecated"
            model OldBar is OldFoo {}

            #deprecated "OldBlah is deprecated"
            model OldBlah extends OldFoo {}

            #deprecated "OldFooReference is deprecated"
            model OldFooReference {
              foo: OldFoo.foo;
            }

            #deprecated "OldFooProperty is deprecated"
            model OldFooProperty {
              foo: OldFoo;
            }

            #deprecated "OldBaz is deprecated"
            interface OldBaz {
              op oldBaz(): OldFoo;
              op oldBazTwo(): string | OldFoo;
              op oldBazThree(): OldFoo & { bar: string };
            }
          `,
        [],
      );
    });

    it("deprecated operation used in deprecated types", async () => {
      await expectDeprecations(
        `
            #deprecated "oldFoo is deprecated"
            op oldFoo(): string;

            #deprecated "oldBar is deprecated"
            op oldBar is oldFoo;

            #deprecated "OldBaz is deprecated"
            interface OldBaz {
              op oldBaz is oldBar;
            }
          `,
        [],
      );
    });
  });
});

describe("--ignore-deprecated flag", () => {
  it("suppresses deprecation warnings", async () => {
    const diagnostics = await Tester.diagnose(
      `
          #deprecated "OldFoo is deprecated"
          model OldFoo {}

          op get(): OldFoo;

          model Bar {
            foo: string | OldFoo;
          }
      `,
      {
        compilerOptions: {
          ignoreDeprecated: true,
        },
      },
    );

    expectDiagnosticEmpty(diagnostics);
  });
});
