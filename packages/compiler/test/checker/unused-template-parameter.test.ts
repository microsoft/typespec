import { beforeEach, describe, it } from "vitest";
import { createUnusedTemplateParameterLinterRule } from "../../src/core/linter-rules/unused-template-parameter.rule.js";
import { LinterRuleTester, createLinterRuleTester } from "../../src/testing/rule-tester.js";
import { createTestRunner } from "../../src/testing/test-host.js";

let ruleTester: LinterRuleTester;

beforeEach(async () => {
  const runner = await createTestRunner();
  ruleTester = createLinterRuleTester(
    runner,
    createUnusedTemplateParameterLinterRule(),
    "@typespec/compiler",
  );
});

describe("compiler: unused template parameter in model template", () => {
  it("report unused template parameter", async () => {
    await ruleTester.expect("model A<T> { id: string; }").toEmitDiagnostics([
      {
        code: "@typespec/compiler/unused-template-parameter",
        message:
          "Templates should use all specified parameters, and parameter 'T' does not exist in type 'A'. Consider removing this parameter.",
      },
    ]);
  });

  it("no unused template parameter diagnose when the template parameter used in spread property", async () => {
    await ruleTester
      .expect(
        `
        model A<T> {
          ...T;
        }
      `,
      )
      .toBeValid();
  });

  it("no unused template parameter diagnose when the template parameter used in property", async () => {
    await ruleTester
      .expect(
        `
        model A<T> {
          prop:T;
        }
      `,
      )
      .toBeValid();
  });

  it("no unused template parameter diagnose when the template parameter used in property whose type is Union", async () => {
    await ruleTester
      .expect(
        `
        model A<T> {
          unionProp: T | string;
        }
      `,
      )
      .toBeValid();
  });

  it("no unused template parameter diagnose when the template parameter used in property whose type is Tuple", async () => {
    await ruleTester
      .expect(
        `
        model A<T, B> {
          tupleProp: [T, B];
        }
      `,
      )
      .toBeValid();
  });

  it("no unused template parameter diagnose when the template parameter used in decorator", async () => {
    await ruleTester
      .expect(
        `
        @friendlyName(NameTemplate, T)
        model A<
          T extends Reflection.Model,
          NameTemplate extends valueof string = "CreateOrUpdate{name}"
        > {
          ...T;
          id: string;
        }
      `,
      )
      .toBeValid();
  });

  it("no unused template parameter diagnose when the template parameter used in base Model", async () => {
    await ruleTester
      .expect(
        `
        model A<T> {
          prop:T;
        }
        model IsModel<T> is A<T>;
      `,
      )
      .toBeValid();
  });

  it("no unused template parameter diagnose when there is a property whose type is template type with the parameter", async () => {
    await ruleTester
      .expect(
        `
        model Bar<T> {
          prop: T;
        }
        model useTemplateModelModel<T>{
          prop: Bar<T>;
        }
      `,
      )
      .toBeValid();
  });

  it("no unused template parameter diagnose when the template parameter used in scalar", async () => {
    await ruleTester
      .expect(
        `
        @doc(T)  
        scalar Bar<T extends valueof string>;

        model Foo<A, B extends valueof string> {
          a: A;
          usedInScalar: Bar<B>;
        }
      `,
      )
      .toBeValid();
  });

  it("no unused template parameter diagnose when the template parameter used extended Model", async () => {
    await ruleTester
      .expect(
        `
        model A<T> {
          prop:T;
        }
        model ExtendModel<T> extends A<T> {
        }
      `,
      )
      .toBeValid();
  });

  it("no unused template parameter diagnose when the template parameter in typeof expression", async () => {
    await ruleTester
      .expect(
        `
        model A<T> {
          prop:T;
        }
        model ModelWithTypeOfExpression<Type, ContentType extends valueof string>
          is A<Type> {
          contentType: typeof ContentType;
        }
      `,
      )
      .toBeValid();
  });
});

describe("compiler: unused template parameter in operation template", () => {
  it("report unused template parameter", async () => {
    await ruleTester.expect(`op templateOperation<T> (): void;`).toEmitDiagnostics([
      {
        code: "@typespec/compiler/unused-template-parameter",
        message:
          "Templates should use all specified parameters, and parameter 'T' does not exist in type 'templateOperation'. Consider removing this parameter.",
      },
    ]);
  });

  it("no unused template parameter diagnose when there is a parameter whose type is this template parameter", async () => {
    await ruleTester
      .expect(
        `
        op templateOperation<T> (t: T): void;
      `,
      )
      .toBeValid();
  });

  it("no unused template parameter diagnose when the response whose type is this template parameter", async () => {
    await ruleTester
      .expect(
        `
        op templateOperation<T> (): T;
      `,
      )
      .toBeValid();
  });
});

describe("compiler: unused template parameter in interface template", () => {
  it("report unused template parameter", async () => {
    await ruleTester
      .expect(
        `
      interface templateInterface<T> {
        op test(): void;
      }
      `,
      )
      .toEmitDiagnostics([
        {
          code: "@typespec/compiler/unused-template-parameter",
          message:
            "Templates should use all specified parameters, and parameter 'T' does not exist in type 'templateInterface'. Consider removing this parameter.",
        },
      ]);
  });

  it("no unused template parameter diagnose when there is an operation which uses this template parameter", async () => {
    await ruleTester
      .expect(
        `
        interface templateInterface<T> {
          op test(): T;
        }
      `,
      )
      .toBeValid();
  });
});

describe("compiler: unused template parameter in alias template", () => {
  it("report unused template parameter", async () => {
    await ruleTester
      .expect(
        `
      alias ResourceValue<T> = string;
      `,
      )
      .toEmitDiagnostics([
        {
          code: "@typespec/compiler/unused-template-parameter",
          message:
            "Templates should use all specified parameters, and parameter 'T' does not exist in type 'ResourceValue'. Consider removing this parameter.",
        },
      ]);
  });

  it("no unused template parameter diagnose when there is a property or decorator which uses this template parameter", async () => {
    await ruleTester
      .expect(
        `
        alias TakesValue<StringType extends string, StringValue extends valueof string> = {
          @doc(StringValue)
          property: StringType;
        };
      `,
      )
      .toBeValid();
  });
});
