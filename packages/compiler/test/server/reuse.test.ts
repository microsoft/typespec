import { ok } from "assert";
import { describe, it } from "vitest";
import { Program, SymbolTable, visitChildren } from "../../src/core/index.js";
import {
  createTestServerHost,
  expectDiagnosticEmpty,
  resolveVirtualPath,
} from "../../src/testing/index.js";
import { mutate } from "../../src/utils/misc.js";

describe("compiler: server: reuse", () => {
  it("reuses unchanged programs", async () => {
    const host = await createTestServerHost();
    const document = host.addOrUpdateDocument("main.tsp", "model M  {}");
    const oldResult = await host.server.compile(document);
    ok(oldResult);
    expectDiagnosticEmpty(oldResult.program.diagnostics);
    const newResult = await host.server.compile(document);
    ok(newResult);
    expectSameProgram(oldResult.program, newResult.program);
  });

  it("reuses unchanged files", async () => {
    const source = `import "./other.tsp"; model M extends N {}`;
    const otherSource = `model N {}`;

    const host = await createTestServerHost();
    const document = host.addOrUpdateDocument("main.tsp", source);

    host.addOrUpdateDocument("other.tsp", otherSource);

    const oldResult = await host.server.compile(document);
    ok(oldResult);
    expectDiagnosticEmpty(oldResult.program.diagnostics);

    host.addOrUpdateDocument("other.tsp", otherSource + "// force change");
    const newResult = await host.server.compile(document);
    ok(newResult);
    expectDiagnosticEmpty(newResult.program.diagnostics);

    expectNotSameProgram(oldResult.program, newResult.program);
    expectNotSameSourceFile(oldResult.program, newResult.program, "other.tsp");
    expectSameSourceFile(oldResult.program, newResult.program, "main.tsp");
  });

  it("does not mutate symbols when reusing unchanged files", async () => {
    // trigger features that add symbols during checking: using statements, member references, namespace merging
    const source = `
      import "./other.tsp";

      using OtherNamespace;
    
      namespace N {
        model M extends OtherModel {
          a: string;
          b: string;
        }
      
        union U {
          a: string,
          b: int32,
        }
      
        enum E {
          A,
          B,
        }
      
        interface I {
          a(): void;
          b(): void;
        }

        model LateBoundReferences {
          a: N.M.a;
          b: N.U.a;
          c: N.E.A;
          d: N.I.b;
        }
      }`;

    const otherSource = `
      namespace OtherNamespace {
        model OtherModel {}
      }
      namespace N {
        model MergedIntoNamespace {}
      }`;

    const host = await createTestServerHost();
    host.addOrUpdateDocument("other.tsp", otherSource);
    const document = host.addOrUpdateDocument("main.tsp", source);
    const oldResult = await host.server.compile(document);
    ok(oldResult);
    expectDiagnosticEmpty(oldResult.program.diagnostics);

    freezeSymbolTables(oldResult.program);

    host.addOrUpdateDocument("other.tsp", otherSource + "// force change");
    const newResult = await host.server.compile(document);
    ok(newResult);
    expectDiagnosticEmpty(newResult.program.diagnostics);

    expectNotSameProgram(oldResult.program, newResult.program);
    expectNotSameSourceFile(oldResult.program, newResult.program, "other.tsp");
    expectSameSourceFile(oldResult.program, newResult.program, "main.tsp");
  });
});

function expectSameProgram(oldProgram: Program, newProgram: Program) {
  ok(newProgram === oldProgram, "Programs are not identical but should be.");
}

function expectNotSameProgram(oldProgram: Program, newProgram: Program) {
  ok(newProgram !== oldProgram, "Programs are identical but should not be.");
}

function expectSameSourceFile(oldProgram: Program, newProgram: Program, path: string) {
  path = resolveVirtualPath(path);
  const oldFile = oldProgram.sourceFiles.get(path);
  const newFile = newProgram.sourceFiles.get(path);
  ok(oldFile === newFile, `Source files for ${path} are not identical but should be.`);
}

function expectNotSameSourceFile(oldProgram: Program, newProgram: Program, path: string) {
  path = resolveVirtualPath(path);
  const oldFile = oldProgram.sourceFiles.get(path);
  const newFile = newProgram.sourceFiles.get(path);
  ok(oldFile !== newFile, `Source files for ${path} are identical but should not be.`);
}

function freezeSymbolTables(program: Program) {
  for (const file of program.sourceFiles.values()) {
    freezeSymbolTable(file.locals);
    visitChildren(file, function visit(child) {
      if ("locals" in child) {
        freezeSymbolTable(child.locals);
      }
      if (child.symbol) {
        freezeSymbolTable(child.symbol.exports);
        freezeSymbolTable(child.symbol.members);
      }
      visitChildren(child, visit);
    });
  }
}

function freezeSymbolTable(table: SymbolTable | undefined) {
  if (table) {
    mutate(table).set = () => {
      throw new Error("SymbolTable is frozen");
    };
  }
}
