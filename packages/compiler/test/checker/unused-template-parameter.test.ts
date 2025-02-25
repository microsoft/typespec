import { strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { CompilerOptions } from "../../src/index.js";
import { createTestHost } from "../../src/testing/test-host.js";
import { TestHost } from "../../src/testing/types.js";

let testHost: TestHost;

beforeEach(async () => {
  testHost = await createTestHost();
});

const diagnoseWithUnusedTemplateParameter = async (main: string, options: CompilerOptions = {}) => {
  return testHost.diagnose(main, {
    ...options,
    linterRuleSet: {
      enable: {
        "@typespec/compiler/unused-template-parameter": true,
      },
    },
  });
};

describe("compiler: unused template parameter in model template", () => {
  it("report unused template parameter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        model A<T> {
          id: string;
        }
      `,
    );
    const diagnostics = await diagnoseWithUnusedTemplateParameter("main.tsp");
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "@typespec/compiler/unused-template-parameter");
    strictEqual(
      diagnostics[0].message,
      "Templates should use all specified parameters, and parameter 'T' does not exist in type 'A'. Consider removing this parameter.",
    );
  });

  it("no unused template parameter diagnose when the template parameter used in spread property", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        model A<T> {
          ...T;
        }
      `,
    );
    const diagnostics = await diagnoseWithUnusedTemplateParameter("main.tsp");
    strictEqual(diagnostics.length, 0);
  });

  it("no unused template parameter diagnose when the template parameter used in property", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        model A<T> {
          prop:T;
        }
      `,
    );
    const diagnostics = await diagnoseWithUnusedTemplateParameter("main.tsp");
    strictEqual(diagnostics.length, 0);
  });

  it("no unused template parameter diagnose when the template parameter used in property whose type is Union", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        model A<T> {
          unionProp: T | string;
        }
      `,
    );
    const diagnostics = await diagnoseWithUnusedTemplateParameter("main.tsp");
    strictEqual(diagnostics.length, 0);
  });

  it("no unused template parameter diagnose when the template parameter used in property whose type is Tuple", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        model A<T, B> {
          tupleProp: [T, B];
        }
      `,
    );
    const diagnostics = await diagnoseWithUnusedTemplateParameter("main.tsp");
    strictEqual(diagnostics.length, 0);
  });

  it("no unused template parameter diagnose when the template parameter used in decorator", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
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
    );
    const diagnostics = await diagnoseWithUnusedTemplateParameter("main.tsp");
    strictEqual(diagnostics.length, 0);
  });

  it("no unused template parameter diagnose when the template parameter used in base Model", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        model A<T> {
          prop:T;
        }
        model IsModel<T> is A<T>;
      `,
    );
    const diagnostics = await diagnoseWithUnusedTemplateParameter("main.tsp");
    strictEqual(diagnostics.length, 0);
  });

  it("no unused template parameter diagnose when there is a property whose type is template type with the parameter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        model Bar<T> {
          prop: T;
        }
        model useTemplateModelModel<T>{
          prop: Bar<T>;
        }
      `,
    );
    const diagnostics = await diagnoseWithUnusedTemplateParameter("main.tsp");
    strictEqual(diagnostics.length, 0);
  });

  it("no unused template parameter diagnose when the template parameter used in scalar", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @doc(T)  
      scalar Bar<T extends valueof string>;

      model Foo<A, B extends valueof string> {
        a: A;
        usedInScalar: Bar<B>;
      }
      `,
    );
    const diagnostics = await diagnoseWithUnusedTemplateParameter("main.tsp");
    strictEqual(diagnostics.length, 0);
  });

  it("no unused template parameter diagnose when the template parameter used extended Model", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        model A<T> {
          prop:T;
        }
        model ExtendModel<T> extends A<T> {
        }
      `,
    );
    const diagnostics = await diagnoseWithUnusedTemplateParameter("main.tsp");
    strictEqual(diagnostics.length, 0);
  });

  it("no unused template parameter diagnose when the template parameter in typeof expression", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        model A<T> {
          prop:T;
        }
        model ModelWithTypeOfExpression<Type, ContentType extends valueof string>
          is A<Type> {
          contentType: typeof ContentType;
        }
      `,
    );
    const diagnostics = await diagnoseWithUnusedTemplateParameter("main.tsp");
    strictEqual(diagnostics.length, 0);
  });
});

describe("compiler: unused template parameter in operation template", () => {
  it("report unused template parameter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        op templateOperation<T> (): void;
      `,
    );
    const diagnostics = await diagnoseWithUnusedTemplateParameter("main.tsp");
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "@typespec/compiler/unused-template-parameter");
    strictEqual(
      diagnostics[0].message,
      "Templates should use all specified parameters, and parameter 'T' does not exist in type 'templateOperation'. Consider removing this parameter.",
    );
  });

  it("no unused template parameter diagnose when there is a parameter whose type is this template parameter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        op templateOperation<T> (t: T): void;
      `,
    );
    const diagnostics = await diagnoseWithUnusedTemplateParameter("main.tsp");
    strictEqual(diagnostics.length, 0);
  });

  it("no unused template parameter diagnose when the response whose type is this template parameter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        op templateOperation<T> (): T;
      `,
    );
    const diagnostics = await diagnoseWithUnusedTemplateParameter("main.tsp");
    strictEqual(diagnostics.length, 0);
  });
});

describe("compiler: unused template parameter in interface template", () => {
  it("report unused template parameter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      interface templateInterface<T> {
        op test(): void;
      }
      `,
    );
    const diagnostics = await diagnoseWithUnusedTemplateParameter("main.tsp");
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "@typespec/compiler/unused-template-parameter");
    strictEqual(
      diagnostics[0].message,
      "Templates should use all specified parameters, and parameter 'T' does not exist in type 'templateInterface'. Consider removing this parameter.",
    );
  });

  it("no unused template parameter diagnose when there is an operation which uses this template parameter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        interface templateInterface<T> {
          op test(): T;
        }
      `,
    );
    const diagnostics = await diagnoseWithUnusedTemplateParameter("main.tsp");
    strictEqual(diagnostics.length, 0);
  });
});

describe("compiler: unused template parameter in alias template", () => {
  it("report unused template parameter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      alias ResourceValue<T> = string;
      `,
    );
    const diagnostics = await diagnoseWithUnusedTemplateParameter("main.tsp");
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "@typespec/compiler/unused-template-parameter");
    strictEqual(
      diagnostics[0].message,
      "Templates should use all specified parameters, and parameter 'T' does not exist in type 'ResourceValue'. Consider removing this parameter.",
    );
  });

  it("no unused template parameter diagnose when there is a property or decorator which uses this template parameter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        alias TakesValue<StringType extends string, StringValue extends valueof string> = {
          @doc(StringValue)
          property: StringType;
        };
      `,
    );
    const diagnostics = await diagnoseWithUnusedTemplateParameter("main.tsp");
    strictEqual(diagnostics.length, 0);
  });
});
