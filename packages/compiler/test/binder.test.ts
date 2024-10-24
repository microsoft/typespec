import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { Binder, createBinder } from "../src/core/binder.js";
import { createLogger } from "../src/core/logger/logger.js";
import { createTracer } from "../src/core/logger/tracer.js";
import { parse } from "../src/core/parser.js";
import type { Program } from "../src/core/program.js";
import { createSourceFile } from "../src/core/source-file.js";
import {
  AliasStatementNode,
  InterfaceStatementNode,
  JsSourceFileNode,
  ModelStatementNode,
  NodeFlags,
  ProjectionExpressionStatementNode,
  ProjectionLambdaExpressionNode,
  ProjectionStatementNode,
  Sym,
  SymbolFlags,
  SymbolTable,
  SyntaxKind,
  UnionStatementNode,
} from "../src/core/types.js";
import { expectDiagnosticEmpty } from "../src/testing/expect.js";

describe("compiler: binder", () => {
  let binder: Binder;
  beforeEach(() => {
    binder = createBinder(createProgramShim());
  });

  it("binds blockless namespaces", () => {
    const code = `
      namespace A.B;
      namespace C {

      }
      model D { }
    `;
    const script = bindTypeSpec(code);
    strictEqual(script.namespaces.length, 3);
    assertBindings("root", script.symbol.exports!, {
      A: {
        declarations: [SyntaxKind.NamespaceStatement],
        flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
        exports: {
          B: {
            flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
            exports: {
              C: {
                flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
                exports: {},
              },
              D: {
                flags: SymbolFlags.Model | SymbolFlags.Declaration,
              },
            },
          },
        },
      },
    });
  });

  it("namespace inside blockless namespace with the same name", () => {
    const code = `
      namespace A.B;
      namespace A.B {
        model D { }
      }
    `;
    const script = bindTypeSpec(code);
    strictEqual(script.namespaces.length, 4);
    assertBindings("root", script.symbol.exports!, {
      A: {
        declarations: [SyntaxKind.NamespaceStatement],
        flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
        exports: {
          B: {
            flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
            exports: {
              A: {
                declarations: [SyntaxKind.NamespaceStatement],
                flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
                exports: {
                  B: {
                    flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
                    exports: {
                      D: {
                        flags: SymbolFlags.Model | SymbolFlags.Declaration,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  });
  it("binds namespaces", () => {
    const code = `
      namespace A {
        namespace B {

        }
      }
    `;
    const script = bindTypeSpec(code);
    strictEqual(script.namespaces.length, 2);
    assertBindings("root", script.symbol.exports!, {
      A: {
        declarations: [SyntaxKind.NamespaceStatement],
        flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
        exports: {
          B: {
            flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
            exports: {},
          },
        },
      },
    });
  });

  it("binds duplicate namespaces declared in the same file", () => {
    const code = `
      namespace test;
      namespace A {
        namespace B {

        }

        op get1(): void;
      }

      namespace A {
        namespace B {

        }

        op get2(): void;
      }
    `;
    const script = bindTypeSpec(code);
    strictEqual(script.namespaces.length, 5);
    assertBindings("root", script.symbol.exports!, {
      test: {
        declarations: [SyntaxKind.NamespaceStatement],
        flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
        exports: {
          A: {
            declarations: [SyntaxKind.NamespaceStatement, SyntaxKind.NamespaceStatement],
            flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
            exports: {
              B: {
                declarations: [SyntaxKind.NamespaceStatement, SyntaxKind.NamespaceStatement],
                flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
                exports: {},
              },
              get1: {
                flags: SymbolFlags.Operation | SymbolFlags.Declaration,
              },
              get2: {
                flags: SymbolFlags.Operation | SymbolFlags.Declaration,
              },
            },
          },
        },
      },
    });
  });

  it("binds models", () => {
    const code = `
      namespace A {
        model A { }
      }

      model B<Foo, Bar> { }
    `;
    const script = bindTypeSpec(code);
    strictEqual(script.namespaces.length, 1);
    assertBindings("root", script.symbol.exports!, {
      A: {
        declarations: [SyntaxKind.NamespaceStatement],
        flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
        exports: {
          A: {
            flags: SymbolFlags.Model | SymbolFlags.Declaration,
          },
        },
      },
      B: {
        declarations: [SyntaxKind.ModelStatement],
        flags: SymbolFlags.Model | SymbolFlags.Declaration,
      },
    });

    const BNode = script.statements[1] as ModelStatementNode;
    assertBindings("B", BNode.locals!, {
      Foo: { flags: SymbolFlags.TemplateParameter | SymbolFlags.Declaration },
      Bar: { flags: SymbolFlags.TemplateParameter | SymbolFlags.Declaration },
    });
  });
  it("binds enums", () => {
    const code = `
      namespace A {
        enum A { }
      }

      enum B { }
    `;
    const script = bindTypeSpec(code);
    strictEqual(script.namespaces.length, 1);
    assertBindings("root", script.symbol.exports!, {
      A: {
        declarations: [SyntaxKind.NamespaceStatement],
        flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
        exports: {
          A: {
            flags: SymbolFlags.Enum | SymbolFlags.Declaration,
          },
        },
      },
      B: {
        declarations: [SyntaxKind.EnumStatement],
        flags: SymbolFlags.Enum | SymbolFlags.Declaration,
      },
    });
  });

  it("binds operations", () => {
    const code = `
      namespace A {
        op Foo(): void;
      }

      op Foo(): void;
    `;
    const script = bindTypeSpec(code);
    strictEqual(script.namespaces.length, 1);
    assertBindings("root", script.symbol.exports!, {
      A: {
        declarations: [SyntaxKind.NamespaceStatement],
        flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
        exports: {
          Foo: {
            declarations: [SyntaxKind.OperationStatement],
            flags: SymbolFlags.Operation | SymbolFlags.Declaration,
          },
        },
      },
      Foo: {
        declarations: [SyntaxKind.OperationStatement],
        flags: SymbolFlags.Operation | SymbolFlags.Declaration,
      },
    });
  });

  it("binds interfaces", () => {
    const code = `
      namespace A {
        interface Foo { }
      }

      interface Bar<T, U> { }
    `;
    const script = bindTypeSpec(code);
    strictEqual(script.namespaces.length, 1);
    assertBindings("root", script.symbol.exports!, {
      A: {
        declarations: [SyntaxKind.NamespaceStatement],
        flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
        exports: {
          Foo: {
            declarations: [SyntaxKind.InterfaceStatement],
            flags: SymbolFlags.Interface | SymbolFlags.Declaration,
          },
        },
      },
      Bar: {
        declarations: [SyntaxKind.InterfaceStatement],
        flags: SymbolFlags.Interface | SymbolFlags.Declaration,
      },
    });

    const INode = script.statements[1] as InterfaceStatementNode;
    assertBindings("Bar", INode.locals!, {
      T: { flags: SymbolFlags.TemplateParameter | SymbolFlags.Declaration },
      U: { flags: SymbolFlags.TemplateParameter | SymbolFlags.Declaration },
    });
  });

  it("binds union statements", () => {
    const code = `
      namespace A {
        union Foo { }
      }

      union Bar<T, U> { }
    `;
    const script = bindTypeSpec(code);
    strictEqual(script.namespaces.length, 1);
    assertBindings("root", script.symbol.exports!, {
      A: {
        declarations: [SyntaxKind.NamespaceStatement],
        flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
        exports: {
          Foo: {
            declarations: [SyntaxKind.UnionStatement],
            flags: SymbolFlags.Union | SymbolFlags.Declaration,
          },
        },
      },
      Bar: {
        declarations: [SyntaxKind.UnionStatement],
        flags: SymbolFlags.Union | SymbolFlags.Declaration,
      },
    });

    const UNode = script.statements[1] as UnionStatementNode;
    assertBindings("Bar", UNode.locals!, {
      T: { flags: SymbolFlags.TemplateParameter | SymbolFlags.Declaration },
      U: { flags: SymbolFlags.TemplateParameter | SymbolFlags.Declaration },
    });
  });

  it("binds alias statements", () => {
    const code = `
      namespace A {
        alias Foo = string;
      }

      alias Bar<T, U> = { a: T, b: U };
    `;
    const script = bindTypeSpec(code);
    strictEqual(script.namespaces.length, 1);
    assertBindings("root", script.symbol.exports!, {
      A: {
        declarations: [SyntaxKind.NamespaceStatement],
        flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
        exports: {
          Foo: {
            declarations: [SyntaxKind.AliasStatement],
            flags: SymbolFlags.Alias | SymbolFlags.Declaration,
          },
        },
      },
      Bar: {
        declarations: [SyntaxKind.AliasStatement],
        flags: SymbolFlags.Alias | SymbolFlags.Declaration,
      },
    });

    const ANode = script.statements[1] as AliasStatementNode;
    assertBindings("Bar", ANode.locals!, {
      T: { flags: SymbolFlags.TemplateParameter | SymbolFlags.Declaration },
      U: { flags: SymbolFlags.TemplateParameter | SymbolFlags.Declaration },
    });
  });

  it("binds projection statements", () => {
    const code = `
      projection Foo#proj {
        to(a) { }
      }
      projection model#proj {
        to(a) { }
        from(a) { }
      }
      projection op#proj {
        to(a) { }
      }
    `;
    const script = bindTypeSpec(code);
    strictEqual(script.namespaces.length, 0);
    assertBindings("root", script.symbol.exports!, {
      proj: {
        declarations: [
          SyntaxKind.ProjectionStatement,
          SyntaxKind.ProjectionStatement,
          SyntaxKind.ProjectionStatement,
        ],
        flags: SymbolFlags.Projection | SymbolFlags.Declaration,
      },
    });
    const toNode = (script.statements[0] as ProjectionStatementNode).to!;
    assertBindings("Foo#proj to", toNode.locals!, {
      a: { flags: SymbolFlags.ProjectionParameter | SymbolFlags.Declaration },
    });
  });

  it("binds projection lambda expressions", () => {
    const code = `
      projection model#proj {
        to() {
          (a) => { 1; };
        }
      }
    `;
    const script = bindTypeSpec(code);
    const lambdaNode = (
      (script.statements[0] as ProjectionStatementNode).to!
        .body[0] as ProjectionExpressionStatementNode
    ).expr as ProjectionLambdaExpressionNode;
    assertBindings("lambda", lambdaNode.locals!, {
      a: { flags: SymbolFlags.FunctionParameter | SymbolFlags.Declaration },
    });
  });

  it("binds JS files", () => {
    const $myDec = () => {};
    const $myDec2 = () => {};
    $myDec2.namespace = "Bar";

    const fn = () => {};
    const fn2 = () => {};
    fn2.namespace = "Bar";

    const exports = {
      namespace: "Foo",
      $myDec,
      $myDec2,
      fn,
      fn2,
    };

    const sourceFile = bindJs(exports);
    assertBindings("jsFile", sourceFile.symbol.exports!, {
      Foo: {
        flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
        declarations: [SyntaxKind.JsNamespaceDeclaration],
        exports: {
          Bar: {
            flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
            declarations: [SyntaxKind.JsNamespaceDeclaration],
            exports: {
              "@myDec2": {
                flags: SymbolFlags.Decorator | SymbolFlags.Declaration | SymbolFlags.Implementation,
                declarations: [SyntaxKind.JsSourceFile],
              },
              fn2: {
                flags: SymbolFlags.Function | SymbolFlags.Declaration | SymbolFlags.Implementation,
                declarations: [SyntaxKind.JsSourceFile],
              },
            },
          },
          "@myDec": {
            flags: SymbolFlags.Decorator | SymbolFlags.Declaration | SymbolFlags.Implementation,
            declarations: [SyntaxKind.JsSourceFile],
          },
          fn: {
            flags: SymbolFlags.Function | SymbolFlags.Declaration | SymbolFlags.Implementation,
            declarations: [SyntaxKind.JsSourceFile],
          },
        },
      },
    });
  });

  it("binds $decorators in JS file", () => {
    const exports = {
      $decorators: {
        "Foo.Bar": { myDec2: () => {} },
        Foo: { myDec: () => {} },
      },
    };

    const sourceFile = bindJs(exports);
    assertBindings("jsFile", sourceFile.symbol.exports!, {
      Foo: {
        flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
        declarations: [SyntaxKind.JsNamespaceDeclaration],
        exports: {
          Bar: {
            flags: SymbolFlags.Namespace | SymbolFlags.Declaration,
            declarations: [SyntaxKind.JsNamespaceDeclaration],
            exports: {
              "@myDec2": {
                flags: SymbolFlags.Decorator | SymbolFlags.Declaration | SymbolFlags.Implementation,
                declarations: [SyntaxKind.JsSourceFile],
              },
            },
          },
          "@myDec": {
            flags: SymbolFlags.Decorator | SymbolFlags.Declaration | SymbolFlags.Implementation,
            declarations: [SyntaxKind.JsSourceFile],
          },
        },
      },
    });
  });

  function bindTypeSpec(code: string) {
    const sourceFile = parse(code);
    expectDiagnosticEmpty(sourceFile.parseDiagnostics);
    binder.bindSourceFile(sourceFile);
    return sourceFile;
  }

  function bindJs(exports: any) {
    const sourceFile = createJsSourceFile(exports);
    binder.bindJsSourceFile(sourceFile);
    return sourceFile;
  }
});

type BindTest = Record<string, BindingDescriptor>;
interface BindingDescriptor {
  flags?: SymbolFlags;
  exports?: BindTest;
  declarations?: SyntaxKind[];
}

function assertBindings(path: string, table: SymbolTable, descriptor: BindTest, parent?: Sym) {
  strictEqual(table.duplicates.size, 0, `no duplicate bindings for ${path}`);
  for (const [key, value] of Object.entries(descriptor)) {
    const subpath = `${path}.${key}`;
    const binding = table.get(key);
    ok(binding, `binding for ${subpath}`);
    if (parent) {
      strictEqual(parent, binding.parent, `parent for ${path}`);
    }

    if (value.flags) {
      strictEqual(binding.flags, value.flags, `flags for ${subpath}`);
    }

    if (value.exports) {
      ok(binding.exports, `exports for ${subpath} should be present`);
      const expectedBindingNames = Object.keys(value.exports);

      for (const exportBindingName of binding.exports.keys()) {
        if (expectedBindingNames.indexOf(exportBindingName) === -1) {
          throw new Error(
            `Unexpected binding '${exportBindingName}' at ${subpath}, expected bindings are ${expectedBindingNames}`,
          );
        }
      }

      assertBindings(subpath, binding.exports, value.exports, binding);
    } else {
      strictEqual(binding.exports, undefined, `exports for ${subpath} should be undefined`);
    }

    if (value.declarations) {
      strictEqual(
        binding.declarations.length,
        value.declarations.length,
        `declaration count for ${subpath}`,
      );
      for (const [i, kind] of value.declarations.entries()) {
        strictEqual(binding.declarations[i].kind, kind, `declaration ${i} of ${subpath}`);
      }
    }
  }
}

function createProgramShim(): Program {
  return {
    tracer: createTracer(createLogger({ sink: { log: () => {} } })),
    reportDuplicateSymbols() {},
    onValidate() {},
  } as any;
}

function createJsSourceFile(exports: any): JsSourceFileNode {
  const file = createSourceFile("", "path");
  return {
    kind: SyntaxKind.JsSourceFile,
    id: {
      kind: SyntaxKind.Identifier,
      sv: "",
      pos: 0,
      end: 0,
      symbol: undefined!,
      flags: NodeFlags.Synthetic,
    },
    esmExports: exports,
    file,
    namespaceSymbols: [],
    symbol: undefined!,
    pos: 0,
    end: 0,
    flags: NodeFlags.None,
  };
}
