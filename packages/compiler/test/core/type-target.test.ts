import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { getRelatedLocations } from "../../src/core/diagnostics.js";
import { typeTarget } from "../../src/core/type-target.js";
import {
  getSourceLocation,
  type Diagnostic,
  type Model,
  type ModelProperty,
  type Operation,
  type Program,
  type TypeTarget,
} from "../../src/index.js";
import { expectDiagnosticEmpty } from "../../src/testing/index.js";
import { extractSquiggles } from "../../src/testing/source-utils.js";
import { Tester } from "../tester.js";

const LibTester = Tester.files({
  "node_modules/my-lib/package.json": JSON.stringify({ name: "my-lib", tspMain: "main.tsp" }),
  "node_modules/my-lib/main.tsp": `
    scalar uuid extends string;
    model SharedQuery { top?: int32; }
    model Intl { name: string; }
    model Wrapper<T> { value: T; }
    model Outer<T> { inner: Wrapper<T>; }
    model Items<T> { value: Record<T>; }
    model LibUser { w: Wrapper<uuid>; }
    model LibBase { top?: int32; }
    op ListOp<P extends {}>(...P): void;
    op ReadOp<P extends {}> is ListOp<Intl & P>;
  `,
});

interface Types {
  op: Operation;
  model: Model;
  prop: ModelProperty;
}

const prefix = `import "my-lib";\n`;

/** Compile `code` and check the target points at the `~~~` delimited range of main.tsp. */
async function expectTargetAt(
  code: string,
  resolve: (program: Program, types: Types) => TypeTarget | undefined,
) {
  const { pos, end, source } = extractSquiggles(code);
  const { program, ...types } = await LibTester.compile(prefix + source);
  const target = resolve(program, types as unknown as Types);
  ok(target, "Expected target to resolve");
  const location = getSourceLocation(target);
  strictEqual(location.file.path.endsWith("/main.tsp"), true, `Located in ${location.file.path}`);
  strictEqual(
    location.file.text.slice(location.pos, location.end),
    source.slice(pos, end),
    "Located text",
  );
  strictEqual(location.pos, prefix.length + pos);
}

describe("compiler: typeTarget", () => {
  it("targets the return type written in the operation signature", () =>
    expectTargetAt(`op /*op*/getUser(): ~~~never~~~;`, (program, { op }) =>
      typeTarget(program, op, "returnType"),
    ));

  it("targets the base model in the extends clause", () =>
    expectTargetAt(`model Base {} model /*model*/Foo extends ~~~Base~~~ {}`, (program, { model }) =>
      typeTarget(program, model, "baseModel"),
    ));

  it("targets a project declaration reached through a spread", () =>
    expectTargetAt(
      `model Shared { ~~~top?: int32~~~; } op /*op*/list(...Shared): void;`,
      (program, { op }) => typeTarget(program, op, "parameters").property("top"),
    ));

  describe("library declarations used by the project", () => {
    it.each([
      ["spread", `op /*op*/list(...~~~SharedQuery~~~): void;`],
      [
        "intersection operand passed to `op is`",
        `op /*op*/list is ListOp<Intl & ~~~SharedQuery~~~>;`,
      ],
      [
        "argument passed through several `op is` templates",
        `op /*op*/list is ReadOp<~~~SharedQuery~~~>;`,
      ],
    ])("targets the %s that brought in the property", (_, code) =>
      expectTargetAt(code, (program, { op }) =>
        typeTarget(program, op, "parameters").property("top"),
      ),
    );

    it.each([
      ["", `model Foo { /*prop*/w: Wrapper<~~~uuid~~~>; }`],
      [
        " even when the library instantiated the template first",
        `model Foo { a: LibUser; /*prop*/w: Wrapper<~~~uuid~~~>; }`,
      ],
    ])("targets the template argument%s", (_, code) =>
      expectTargetAt(code, (program, { prop }) =>
        typeTarget(program, prop, "type").property("value")?.pipe("type"),
      ),
    );

    it("follows an argument passed through another library template", () =>
      expectTargetAt(`model Foo { /*prop*/o: Outer<~~~uuid~~~>; }`, (program, { prop }) =>
        typeTarget(program, prop, "type")
          .property("inner")
          ?.pipe("type")
          .property("value")
          ?.pipe("type"),
      ));

    it("follows the element of a Record<T> to the argument", () =>
      expectTargetAt(`model Foo { /*prop*/w: Items<~~~uuid~~~>; }`, (program, { prop }) =>
        typeTarget(program, prop, "type").property("value")?.pipe("type").pipe("indexerValue"),
      ));

    it("targets the extends clause that brought in an inherited property", () =>
      expectTargetAt(
        `model Foo extends ~~~LibBase~~~ {} op /*op*/list(): Foo;`,
        (program, { op }) =>
          typeTarget(program, op, "returnType").pipe("baseModel")?.property("top"),
      ));

    it("reports the library declaration as related information", async () => {
      const { program, op } = await LibTester.compile(
        `${prefix}op /*op*/list(...SharedQuery): void;`,
      );
      const target = typeTarget(program, op as Operation, "parameters").property("top");
      ok(target);
      const related = getRelatedLocations(diagnosticOn(target));
      strictEqual(related.length, 1);
      const { file, pos, end } = related[0].location;
      strictEqual(file.path.includes("/my-lib/"), true);
      strictEqual(file.text.slice(pos, end), "top?: int32");
    });

    it("can be suppressed where the project uses it", async () => {
      const { program, op } = await LibTester.compile(`${prefix}op /*op*/list(
        #suppress "test-code" "Intended"
        ...SharedQuery
      ): void;`);
      const target = typeTarget(program, op as Operation, "parameters").property("top");
      ok(target);
      program.reportDiagnostic(diagnosticOn(target));
      expectDiagnosticEmpty(program.diagnostics);
    });
  });
});

function diagnosticOn(target: TypeTarget): Diagnostic {
  return { code: "test-code", message: "Test", severity: "warning", target };
}
