import { strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { createTestHost } from "../../src/testing/test-host.js";
import { TestHost } from "../../src/testing/types.js";

describe("compiler: unused template parameter in model template", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("report unused template parameter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        model A<T> {
          id: string;
        }
      `,
    );
    const diagnostics = await testHost.diagnose("main.tsp");
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "unused-template-parameter");
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
    const diagnostics = await testHost.diagnose("main.tsp");
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
    const diagnostics = await testHost.diagnose("main.tsp");
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
    const diagnostics = await testHost.diagnose("main.tsp");
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
    const diagnostics = await testHost.diagnose("main.tsp");
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
    const diagnostics = await testHost.diagnose("main.tsp");
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
    const diagnostics = await testHost.diagnose("main.tsp");
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
    const diagnostics = await testHost.diagnose("main.tsp");
    strictEqual(diagnostics.length, 0);
  });
});
