import { deepStrictEqual, strictEqual } from "assert";
import { describe, it } from "vitest";
import { Range } from "vscode-languageserver/node.js";
import {
  createTestServerHost,
  extractCursor,
  getTestIdentifiers,
} from "../../src/testing/test-server-host.js";

describe("compiler: server: rename and find references", () => {
  // `┆` marks where the cursor is positioned
  // trailing /**/ marks identifiers that should be found/renamed

  test(
    "models",
    `
      model MyModel/**/ {
        prop: MyMo┆del/**/; 
      }

      model A extends MyModel/**/ {}

      model D extends C<MyModel/**/>

      namespace M {
        model MyModel {} // different model
      }

      model B {
        MyModel: string; // property name
      }

      model C<MyModel> {} // template parameter name
      `,
  );

  test(
    "template parameters",
    `
    model Template<T┆/**/> {
      prop: T/**/;
    }

    // different T
    model AnotherTemplate<T> { 
      prop: T;
    }
    `,
  );

  test(
    "namespaces",
    `
    namespace A.B/**/.C {

    }

    namespace A {
      namespace B┆/**/ {
      }
    }

    // different namespace
    namespace B {
    }
    `,
  );

  test(
    "aliases",
    `alias Alias┆/**/ = string;
    op foo(): Alias/**/;`,
  );

  test("enum members", `enum A { B┆/**/, C, D }; model M { prop: A.B/**/;}`);

  test("model properties", `model A { prop┆/**/: string; } model M { prop: A.prop/**/; }`);

  test("anonymous model properties", `model A { b: { prop┆/**/: string; } }`);

  test("parameters", "op test(param┆/**/:string): void;");

  test("interface operations", `interface A { test┆/**/(): void }; model M { prop: A.test/**/;}`);

  test(
    "namespace operations",
    `namespace A { op test┆/**/(): void }; model M { prop: A.test/**/;}`,
  );

  test("union variants", `union A { b┆/**/: B, c: C, d: D }; model M { prop: A.b/**/;}`);
});

function test(things: string, sourceWithCursor: string) {
  it(`renames ${things}`, () => testRename(sourceWithCursor));
  it(`finds ${things}`, () => testFindReferences(sourceWithCursor));
}

async function testFindReferences(sourceWithCursor: string) {
  const { source, pos } = extractCursor(sourceWithCursor);
  const testHost = await createTestServerHost();
  const doc = await testHost.addOrUpdateDocument("test.tsp", source);

  const references = await testHost.server.findReferences({
    textDocument: doc,
    position: doc.positionAt(pos),
    context: { includeDeclaration: true },
  });

  deepStrictEqual(
    references.sort((x, y) => doc.offsetAt(x.range.start) - doc.offsetAt(y.range.start)),
    getTestIdentifiers(source).map((id) => ({
      uri: doc.uri,
      range: Range.create(doc.positionAt(id.pos), doc.positionAt(id.end)),
    })),
  );
}

async function testRename(sourceWithCursor: string) {
  const { source, pos } = extractCursor(sourceWithCursor);
  const testHost = await createTestServerHost();
  const doc = await testHost.addOrUpdateDocument("test.tsp", source);

  const edit = await testHost.server.rename({
    textDocument: doc,
    position: doc.positionAt(pos),
    newName: "NewName",
  });

  const entries = Object.entries(edit.changes ?? {});
  strictEqual(entries.length, 1, "Expecting single document to be changed.");

  const [uri, changes] = entries[0];
  strictEqual(uri, doc.uri, "URI should match the single document.");

  deepStrictEqual(
    changes.sort((x, y) => doc.offsetAt(x.range.start) - doc.offsetAt(y.range.start)),
    getTestIdentifiers(source).map((id) => ({
      newText: "NewName",
      range: Range.create(doc.positionAt(id.pos), doc.positionAt(id.end)),
    })),
  );
}
