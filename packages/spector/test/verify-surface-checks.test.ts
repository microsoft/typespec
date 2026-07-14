import { mkdir, mkdtemp, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  parseChecksDoc,
  verifySurfaceChecks,
  type VerifySurfaceChecksOutput,
} from "../src/actions/verify-surface-checks.js";

// A tiny generated "Python SDK" fixture under <root>/azure/surfacedemo/, plus a
// declarative verifiers.json, exercising every routine kind of the shared engine.
let root: string;
let verifiersPath: string;

const verifiers = {
  access: {
    files: ["**/models/__init__.py"],
    find: "\\b{target}\\b",
    expect: { absentWhen: "internal" },
  },
  naming: {
    files: ["**/*.py"],
    find: "\\b{name:byKind}\\b",
    casing: { enum: "pascal", property: "snake" },
  },
  hierarchy: {
    files: ["**/models/_models.py"],
    find: "class\\s+{target}\\s*\\([^)]*\\b{base}\\b[^)]*\\)",
  },
  "client-location": {
    files: ["**/operations/_operations.py"],
    scope: "class\\s+\\w*{client}\\w*[\\s\\S]*?(?=\\nclass |$)",
    find: "def\\s+{target:snake}\\b",
    also: {
      files: ["**/operations/_operations.py"],
      scope: "class\\s+\\w*{absentFrom}\\w*[\\s\\S]*?(?=\\nclass |$)",
      find: "def\\s+{target:snake}\\b",
      expect: "absent",
    },
  },
};

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "surface-verify-"));
  const pkg = join(root, "azure", "surfacedemo");
  await mkdir(join(pkg, "models"), { recursive: true });
  await mkdir(join(pkg, "operations"), { recursive: true });

  await writeFile(
    join(pkg, "models", "__init__.py"),
    `from ._enums import ClientExtensibleEnum\n__all__ = ["ClientExtensibleEnum"]\n`,
  );
  await writeFile(
    join(pkg, "models", "_enums.py"),
    `class ClientExtensibleEnum(str, Enum):\n    ONE = "one"\n`,
  );
  await writeFile(
    join(pkg, "models", "_models.py"),
    `class Animal:\n    pass\n\nclass Pet(Animal):\n    pass\n\nclass Dog(Pet, discriminator="dog"):\n    pass\n`,
  );
  await writeFile(
    join(pkg, "operations", "_operations.py"),
    `class WidgetsOperations:\n    def get_widget(self):\n        pass\n\nclass GadgetsOperations:\n    def list_gadgets(self):\n        pass\n`,
  );
  await writeFile(join(pkg, "models", "_scoped.py"), `class IOThing:\n    pass\n`);

  verifiersPath = join(root, "verifiers.json");
  await writeFile(verifiersPath, JSON.stringify(verifiers));
});

async function run(items: object[], scenario?: string): Promise<VerifySurfaceChecksOutput> {
  const checksPath = join(root, "checks.json");
  await writeFile(checksPath, JSON.stringify({ items }));
  return verifySurfaceChecks({
    checksPath,
    verifiersPath,
    generatedRoot: root,
    flavor: "azure",
    language: "python",
    scenario,
  });
}

describe("verify-surface-checks (shared engine)", () => {
  it("naming: idiomatic casing via {name:byKind} passes on the recast identifier", async () => {
    const out = await run([
      {
        id: "n1",
        scenario: "surfacedemo",
        category: "naming",
        target: "ServerExtensibleEnum",
        details: { name: "ClientExtensibleEnum", kind: "enum" },
        doc: "",
      },
    ]);
    expect(out.results[0]).toMatchObject({ status: "pass", how: "deterministic" });
  });

  it("naming: wrong expected name fails", async () => {
    const out = await run([
      {
        id: "n2",
        scenario: "surfacedemo",
        category: "naming",
        target: "X",
        details: { name: "TotallyMadeUp", kind: "enum" },
        doc: "",
      },
    ]);
    expect(out.results[0].status).toBe("fail");
  });

  it("access: public export present passes; internal expectation flips it", async () => {
    const pass = await run([
      {
        id: "a1",
        scenario: "surfacedemo",
        category: "access",
        target: "ClientExtensibleEnum",
        details: {},
        doc: "",
      },
    ]);
    expect(pass.results[0].status).toBe("pass");
    const fail = await run([
      {
        id: "a2",
        scenario: "surfacedemo",
        category: "access",
        target: "ClientExtensibleEnum",
        details: { internal: true },
        doc: "",
      },
    ]);
    expect(fail.results[0].status).toBe("fail"); // present but wanted internal (absent)
  });

  it("hierarchy: subtype base pattern passes for Dog(Pet), fails for Dog(Animal)", async () => {
    const good = await run([
      {
        id: "h1",
        scenario: "surfacedemo",
        category: "hierarchy",
        target: "Dog",
        details: { base: "Pet" },
        doc: "",
      },
    ]);
    expect(good.results[0].status).toBe("pass");
    const bad = await run([
      {
        id: "h2",
        scenario: "surfacedemo",
        category: "hierarchy",
        target: "Dog",
        details: { base: "Animal" },
        doc: "",
      },
    ]);
    expect(bad.results[0].status).toBe("fail");
  });

  it("client-location: present on expected client AND absent from the other", async () => {
    const good = await run([
      {
        id: "c1",
        scenario: "surfacedemo",
        category: "client-location",
        target: "getWidget",
        details: { client: "Widgets", absentFrom: "Gadgets" },
        doc: "",
      },
    ]);
    expect(good.results[0].status).toBe("pass");
    const bad = await run([
      {
        id: "c2",
        scenario: "surfacedemo",
        category: "client-location",
        target: "getWidget",
        details: { client: "Gadgets", absentFrom: "Widgets" },
        doc: "",
      },
    ]);
    expect(bad.results[0].status).toBe("fail"); // getWidget is on Widgets, not Gadgets
  });

  it("scope: a check scoped to another language is skipped entirely", async () => {
    const out = await run([
      {
        id: "s1",
        scenario: "surfacedemo",
        category: "naming",
        target: "IOThing",
        scope: "csharp",
        details: { name: "IOThing", kind: "enum" },
        doc: "",
      },
    ]);
    expect(out.results).toHaveLength(0);
    expect(out.needs_ai).toHaveLength(0);
  });

  it("scope: a scoped value is matched verbatim, bypassing idiomatic casing", async () => {
    const out = await run([
      {
        id: "s2",
        scenario: "surfacedemo",
        category: "naming",
        target: "IOThing",
        scope: "python",
        details: { name: "IOThing", kind: "enum" },
        doc: "",
      },
    ]);
    expect(out.results[0]).toMatchObject({ status: "pass", how: "deterministic" });
  });

  it("scope: an unscoped value is still recast (pascal mangles IOThing → no match)", async () => {
    const out = await run([
      {
        id: "s3",
        scenario: "surfacedemo",
        category: "naming",
        target: "IOThing",
        details: { name: "IOThing", kind: "enum" },
        doc: "",
      },
    ]);
    expect(out.results[0].status).toBe("fail");
  });

  it("no verifier for a category → needs_ai", async () => {
    const out = await run([
      {
        id: "u1",
        scenario: "surfacedemo",
        category: "flatten",
        target: "Foo",
        details: {},
        doc: "prose",
      },
    ]);
    expect(out.results).toHaveLength(0);
    expect(out.needs_ai[0]).toMatchObject({ id: "u1", category: "flatten", doc: "prose" });
  });

  it("test-deferral verifier → deferred/test without touching the package", async () => {
    const p = join(root, "verifiers.test.json");
    await writeFile(
      p,
      JSON.stringify({
        hierarchy: { test: "path/To/Test.java#L1-L2", note: "reflection asserts base" },
      }),
    );
    const checksPath = join(root, "checks.json");
    await writeFile(
      checksPath,
      JSON.stringify({
        items: [
          {
            id: "t1",
            scenario: "surfacedemo",
            category: "hierarchy",
            target: "Dog",
            details: { base: "Pet" },
            doc: "",
          },
        ],
      }),
    );
    const out = await verifySurfaceChecks({
      checksPath,
      verifiersPath: p,
      generatedRoot: root,
      flavor: "azure",
      language: "python",
    });
    expect(out.results[0]).toMatchObject({ status: "deferred", how: "test" });
    expect(out.results[0].evidence).toContain("path/To/Test.java#L1-L2");
  });

  it("na verifier → not-applicable without touching the package", async () => {
    const p = join(root, "verifiers.na.json");
    await writeFile(
      p,
      JSON.stringify({
        hierarchy: { na: true, note: "no class inheritance in this language" },
      }),
    );
    const checksPath = join(root, "checks.json");
    await writeFile(
      checksPath,
      JSON.stringify({
        items: [
          {
            id: "na1",
            scenario: "surfacedemo",
            category: "hierarchy",
            target: "Dog",
            details: { base: "Pet" },
            doc: "",
          },
        ],
      }),
    );
    const out = await verifySurfaceChecks({
      checksPath,
      verifiersPath: p,
      generatedRoot: root,
      flavor: "azure",
      language: "python",
    });
    expect(out.results[0]).toMatchObject({ status: "not-applicable", how: "not-applicable" });
    expect(out.results[0].evidence).toContain("no class inheritance in this language");
    expect(out.needs_ai).toHaveLength(0);
  });

  it("parseChecksDoc reads a Markdown table with details + escaped pipes", () => {
    const md = [
      "| id | scenario | category | target | scope | details | doc |",
      "| --- | --- | --- | --- | --- | --- | --- |",
      "| x1 | S | access | Widget | | internal=true | Hidden \\| renamed. |",
    ].join("\n");
    const items = parseChecksDoc(md);
    expect(items[0]).toMatchObject({
      id: "x1",
      scenario: "S",
      category: "access",
      target: "Widget",
      details: { internal: true },
      doc: "Hidden | renamed.",
    });
  });
});
