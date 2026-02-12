import { beforeEach, describe, it } from "vitest";
import { CompilerOptions } from "../../src/index.js";
import {
  TestHost,
  createTestHost,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "../../src/testing/index.js";

describe("compiler: unused using statements", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  const diagnoseWithUnusedUsing = async (main: string, options: CompilerOptions = {}) => {
    return testHost.diagnose(main, {
      ...options,
      linterRuleSet: {
        enable: {
          "@typespec/compiler/unused-using": true,
        },
      },
    });
  };

  it("no unused diagnostic when using is used", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      
      using N;
      using M;
      model Z { a: X, b: Y}
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N;
      model X { x: int32 }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      namespace M;
      model Y { y: int32 }
      `,
    );

    const diagnostics = await testHost.diagnose("./");
    expectDiagnosticEmpty(diagnostics);
  });

  it("report for unused using", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      
      model Z { a: N.X, b: Y}
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N;
      model X { x: int32 }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      using N;
      model Y { y: int32 }
      `,
    );

    const diagnostics = await diagnoseWithUnusedUsing("./");
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/compiler/unused-using",
        message: "'using N' is declared but never used.",
        severity: "warning",
      },
    ]);
  });

  it("report for same unused using from different file", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      
      using N;
      model Z { a: Y, b: Y}
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N;
      model X { x: int32 }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      using N;
      model Y { y: int32 }
      `,
    );

    const diagnostics = await diagnoseWithUnusedUsing("./");
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/compiler/unused-using",
        message: "'using N' is declared but never used.",
        severity: "warning",
      },
      {
        code: "@typespec/compiler/unused-using",
        message: "'using N' is declared but never used.",
        severity: "warning",
      },
    ]);
  });

  it("report for multiple unused using in one file", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      
      using N;
      using M;
      model Z { a: N.X, b: M.Y}
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N;
      model X { x: int32 }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      namespace M;
      model Y { y: int32 }
      `,
    );

    const diagnostics = await diagnoseWithUnusedUsing("./");
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/compiler/unused-using",
        message: "'using N' is declared but never used.",
        severity: "warning",
      },
      {
        code: "@typespec/compiler/unused-using",
        message: "'using M' is declared but never used.",
        severity: "warning",
      },
    ]);
  });

  it("report for unused using when there is used using", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      
      using N;
      using M;
      model Z { a: X, b: M.Y}
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N;
      model X { x: int32 }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      namespace M;
      model Y { y: int32 }
      `,
    );

    const diagnostics = await diagnoseWithUnusedUsing("./");
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/compiler/unused-using",
        message: "'using M' is declared but never used.",
        severity: "warning",
      },
    ]);
  });

  it("using in namespaces", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      namespace N{
        model X { x: int32 }
      }
      namespace M{
        model XX {xx: Z.Y }
      }
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace Z;
      using N;
      using M;
      @test model Y { ... X }
      `,
    );

    const diagnostics = await diagnoseWithUnusedUsing("./");
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/compiler/unused-using",
        message: "'using M' is declared but never used.",
        severity: "warning",
      },
    ]);
  });

  it("using in the same file", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      namespace N {
        using M;
        model X { x: XX }
      }
      namespace M {
        using N;
        model XX {xx: N.X }
      }
      `,
    );

    const diagnostics = await diagnoseWithUnusedUsing("./");
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/compiler/unused-using",
        message: "'using N' is declared but never used.",
        severity: "warning",
      },
    ]);
  });

  it("works with dotted namespaces", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      using N.M;
      namespace Z {
        alias test = Y;
      }
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N.M;
      model X { x: int32 }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      using N.M;
      @test model Y { ...N.M.X  }
      `,
    );

    const diagnostics = await diagnoseWithUnusedUsing("./");
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/compiler/unused-using",
        message: "'using N.M' is declared but never used.",
        severity: "warning",
      },
      {
        code: "@typespec/compiler/unused-using",
        message: "'using N.M' is declared but never used.",
        severity: "warning",
      },
    ]);
  });

  it("TypeSpec.Xyz namespace doesn't need TypeSpec prefix in using", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      import "./c.tsp";
      using TypeSpec.Xyz;
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace TypeSpec.Xyz;
      model X { x: Y }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      using Xyz;
      @test model Y { x: Xyz.X, z: Z }
      `,
    );
    testHost.addTypeSpecFile(
      "c.tsp",
      `
      using Xyz;
      @test model Z {x: X }
      `,
    );

    const diagnostics = await diagnoseWithUnusedUsing("./");
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/compiler/unused-using",
        message: "'using TypeSpec.Xyz' is declared but never used.",
        severity: "warning",
      },
      {
        code: "@typespec/compiler/unused-using",
        message: "'using Xyz' is declared but never used.",
        severity: "warning",
      },
    ]);
  });

  it("2 namespace with the same last name", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      using N.A;
      using M.A;
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N.A {
        model B { }
      }
      namespace M.A {
        model B { }
      }
      `,
    );

    const diagnostics = await diagnoseWithUnusedUsing("./");
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/compiler/unused-using",
        message: "'using N.A' is declared but never used.",
        severity: "warning",
      },
      {
        code: "@typespec/compiler/unused-using",
        message: "'using M.A' is declared but never used.",
        severity: "warning",
      },
    ]);
  });

  it("one namespace from two file, no unused using when just refering to one of them", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      using N.M;
      model Z { b: B2}
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N.M {
        model B2 { }
      }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      namespace N.M {
        model B { }
      }
      `,
    );

    const diagnostics = await diagnoseWithUnusedUsing("./");
    expectDiagnosticEmpty(diagnostics);
  });

  it("one namespace from two file, show unused using when none is referred", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      using N.M;
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N.M {
        model B2 { }
      }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      namespace N.M {
        model B { }
      }
      `,
    );

    const diagnostics = await diagnoseWithUnusedUsing("./");
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/compiler/unused-using",
        message: "'using N.M' is declared but never used.",
        severity: "warning",
      },
    ]);
  });

  it("unused invalid using, no unnecessary diagnostic when there is other error", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      using N.M2;
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N.M;
      model X { x: int32 }
      `,
    );

    const diagnostics = await diagnoseWithUnusedUsing("./");
    expectDiagnostics(diagnostics, [
      {
        code: "invalid-ref",
        severity: "error",
      },
    ]);
  });

  it("unused using along with duplicate usings, no unnecessary diagnostic when there is other error", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      using N.M;
      using N.M;
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N.M;
      model X { x: int32 }
      `,
    );

    const diagnostics = await diagnoseWithUnusedUsing("./");
    expectDiagnostics(diagnostics, [
      {
        code: "duplicate-using",
        message: 'duplicate using of "N.M" namespace',
      },
      {
        code: "duplicate-using",
        message: 'duplicate using of "N.M" namespace',
      },
    ]);
  });

  it("does not throws errors for different usings with the same bindings if not used", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      
      namespace Ns {
        using N;
        namespace Ns2 {
          using M;
          namespace Ns3 {
            using L;
            alias a2 = A2;
          }
        }
        alias a = A3;
      }
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N {
        model A1 { }
      }
      namespace M {
        model A { }
      }
      namespace L {
        model A2 { }
      }
      namespace Ns.N {
        model A3 { }
      }
      `,
    );
    const diagnostics = await diagnoseWithUnusedUsing("./");
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/compiler/unused-using",
        message: "'using M' is declared but never used.",
        severity: "warning",
      },
    ]);
  });

  it("using multi-level namespace", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      import "./c.tsp";
      import "./d.tsp";
      
      namespace Ns1 {
        model A1 { }
        namespace Ns2 {
          model A2 { }
          namespace Ns3 {
            model A3 { }
          }
        }
      }
      model Test {
        a: A;
        b: B;
        c: C;
        d: D;
      }
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      using Ns1;
      using Ns1.Ns2;
      using Ns1.Ns2.Ns3;
      model A { }
      `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      using Ns1;
      using Ns1.Ns2;
      using Ns1.Ns2.Ns3;
      model B { a: A1 }
      `,
    );
    testHost.addTypeSpecFile(
      "c.tsp",
      `
      using Ns1;
      using Ns1.Ns2;
      using Ns1.Ns2.Ns3;
      model C { a: A2 }
      `,
    );
    testHost.addTypeSpecFile(
      "d.tsp",
      `
      using Ns1;
      using Ns1.Ns2;
      using Ns1.Ns2.Ns3;
      model D { a: A3 }
      `,
    );
    const diagnostics = await diagnoseWithUnusedUsing("./");
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/compiler/unused-using",
        message: "'using Ns1' is declared but never used.",
        severity: "warning",
      },
      {
        code: "@typespec/compiler/unused-using",
        message: "'using Ns1.Ns2' is declared but never used.",
        severity: "warning",
      },
      {
        code: "@typespec/compiler/unused-using",
        message: "'using Ns1.Ns2.Ns3' is declared but never used.",
        severity: "warning",
      },
      {
        code: "@typespec/compiler/unused-using",
        message: "'using Ns1.Ns2' is declared but never used.",
        severity: "warning",
      },
      {
        code: "@typespec/compiler/unused-using",
        message: "'using Ns1.Ns2.Ns3' is declared but never used.",
        severity: "warning",
      },
      {
        code: "@typespec/compiler/unused-using",
        message: "'using Ns1' is declared but never used.",
        severity: "warning",
      },
      {
        code: "@typespec/compiler/unused-using",
        message: "'using Ns1.Ns2.Ns3' is declared but never used.",
        severity: "warning",
      },
      {
        code: "@typespec/compiler/unused-using",
        message: "'using Ns1' is declared but never used.",
        severity: "warning",
      },
      {
        code: "@typespec/compiler/unused-using",
        message: "'using Ns1.Ns2' is declared but never used.",
        severity: "warning",
      },
    ]);
  });

  it("no report unused using when the ref is ambiguous (error) while others not impacted", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      using N;
      using M;
      model B extends A {};
      model B2 extends C {};
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N {
        model A { }
      }
      namespace M {
        model A { }
        model C { }
      }
      `,
    );

    const diagnostics = await diagnoseWithUnusedUsing("./", { nostdlib: true });
    expectDiagnostics(diagnostics, [
      {
        code: "ambiguous-symbol",
        message:
          '"A" is an ambiguous name between N.A, M.A. Try using fully qualified name instead: N.A, M.A',
      },
    ]);
  });

  it("no not-used using for decorator", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./doc.js";
      namespace Test;
      using A;
      @dec1
      namespace Foo {}
      `,
    );

    testHost.addJsFile("doc.js", {
      namespace: "Test.A",
      $dec1() {},
    });

    const diagnostics = await diagnoseWithUnusedUsing("./");
    expectDiagnosticEmpty(diagnostics);
  });

  it("unused using for TypeSpec", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      namespace Foo;
      using TypeSpec;
      model Bar { a : TypeSpec.int32 }
    `,
    );

    const diagnostics = await diagnoseWithUnusedUsing("./", { nostdlib: true });
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/compiler/unused-using",
        message: "'using TypeSpec' is declared but never used.",
        severity: "warning",
      },
    ]);
  });

  it("works same name in different namespace", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./other.tsp";
      namespace Main {
        using Other;
        model OtherModel {
        }
        model MainModel {
          a: OtherModel;
        }
      }
    `,
    );
    testHost.addTypeSpecFile(
      "other.tsp",
      `
      namespace Other {
        model OtherModel {
        }
      }
    `,
    );
    const diagnostics = await diagnoseWithUnusedUsing("./", { nostdlib: true });
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/compiler/unused-using",
        message: "'using Other' is declared but never used.",
        severity: "warning",
      },
    ]);
  });

  it("not used using for lib", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "my-lib";
      using LibNs;
      model A { x: int16; }
      `,
    );
    testHost.addTypeSpecFile(
      "node_modules/my-lib/package.json",
      JSON.stringify({
        name: "my-test-lib",
        exports: { ".": { typespec: "./main.tsp" } },
      }),
    );
    testHost.addTypeSpecFile(
      "node_modules/my-lib/main.tsp",
      `
      import "./lib-a.tsp";
      namespace LibNs {
        model LibMainModel{ }
      }
      `,
    );
    testHost.addTypeSpecFile(
      "node_modules/my-lib/lib-a.tsp",
      `
      namespace LibNs;
      model LibAModel { }
      `,
    );

    const diagnostics = await diagnoseWithUnusedUsing("./", { nostdlib: true });
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/compiler/unused-using",
        message: "'using LibNs' is declared but never used.",
        severity: "warning",
      },
    ]);
  });

  it("no not-used using for lib", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "my-lib";
      using LibNs;
      model A { x: LibAModel; }
      `,
    );
    testHost.addTypeSpecFile(
      "node_modules/my-lib/package.json",
      JSON.stringify({
        name: "my-test-lib",
        exports: { ".": { typespec: "./main.tsp" } },
      }),
    );
    testHost.addTypeSpecFile(
      "node_modules/my-lib/main.tsp",
      `
      import "./lib-a.tsp";
      namespace LibNs {
        model LibMainModel{ }
      }
      `,
    );
    testHost.addTypeSpecFile(
      "node_modules/my-lib/lib-a.tsp",
      `
      namespace LibNs;
      model LibAModel { }
      `,
    );

    const diagnostics = await diagnoseWithUnusedUsing("./", { nostdlib: true });
    expectDiagnosticEmpty(diagnostics);
  });

  it("unused using when type referenced directly", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./other.tsp";
      namespace Main {
        using Other;

        model MainModel {
          a: Other.OtherModel;
        }
      }
    `,
    );
    testHost.addTypeSpecFile(
      "other.tsp",
      `
      namespace Other {
        model OtherModel {
        }
      }
    `,
    );
    const diagnostics = await diagnoseWithUnusedUsing("./", { nostdlib: true });
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/compiler/unused-using",
        message: "'using Other' is declared but never used.",
        severity: "warning",
      },
    ]);
  });
});
