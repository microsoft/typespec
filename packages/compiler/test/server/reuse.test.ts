import { ok } from "assert";
import { Program, SymbolTable, visitChildren } from "../../core/index.js";
import { mutate } from "../../core/util.js";
import {
  createTestServerHost,
  expectDiagnosticEmpty,
  resolveVirtualPath,
} from "../../testing/index.js";

describe("server: reuse", () => {
  it("reuses uchanged programs", async () => {
    const host = await createTestServerHost();
    const document = host.addOrUpdateDocument("main.cadl", "model M  {}");
    const oldProgram = await host.server.compile(document);
    ok(oldProgram);
    expectDiagnosticEmpty(oldProgram.diagnostics);
    const newProgram = await host.server.compile(document);
    ok(newProgram);
    expectSameProgram(oldProgram, newProgram);
  });

  it("reuses unchanged files", async () => {
    const source = `import "./other.cadl"; model M extends N {}`;
    const otherSource = `model N {}`;

    const host = await createTestServerHost();
    const document = host.addOrUpdateDocument("main.cadl", source);

    host.addOrUpdateDocument("other.cadl", otherSource);

    const oldProgram = await host.server.compile(document);
    ok(oldProgram);
    expectDiagnosticEmpty(oldProgram.diagnostics);

    host.addOrUpdateDocument("other.cadl", otherSource + "// force change");
    const newProgram = await host.server.compile(document);
    ok(newProgram);
    expectDiagnosticEmpty(newProgram.diagnostics);

    expectNotSameProgram(oldProgram, newProgram);
    expectNotSameSourceFile(oldProgram, newProgram, "other.cadl");
    expectSameSourceFile(oldProgram, newProgram, "main.cadl");
  });

  it("does not mutate symbols when reusing unchanged files", async () => {
    // trigger features that add symbols during checking: using statements, member references.
    const source = `
      import "./other.cadl";

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
      }`;

    const host = await createTestServerHost();
    host.addOrUpdateDocument("other.cadl", otherSource);
    const document = host.addOrUpdateDocument("main.cadl", source);
    const oldProgram = await host.server.compile(document);
    ok(oldProgram);
    expectDiagnosticEmpty(oldProgram.diagnostics);

    freezeSymbolTables(oldProgram);

    host.addOrUpdateDocument("other.cadl", otherSource + "// force change");
    const newProgram = await host.server.compile(document);
    ok(newProgram);
    expectDiagnosticEmpty(newProgram.diagnostics);

    expectNotSameProgram(oldProgram, newProgram);
    expectNotSameSourceFile(oldProgram, newProgram, "other.cadl");
    expectSameSourceFile(oldProgram, newProgram, "main.cadl");
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
