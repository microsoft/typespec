import { beforeEach, expect, it } from "vitest";
import { ApiTester, compileAndDiagnose, getStandardService } from "./test-host.js";

let tester: Awaited<ReturnType<typeof ApiTester.createInstance>>;

beforeEach(async () => {
  tester = await ApiTester.createInstance();
});

async function emit(code: string) {
  const [result] = await compileAndDiagnose(tester, getStandardService(code), {
    "skip-format": true,
  });
  return result;
}

function getFile(result: Awaited<ReturnType<typeof emit>>, suffix: string) {
  return [...result.fs.fs.entries()].find(([path]) => path.endsWith(suffix))?.[1];
}

it("escapes a string enum value used as the serialized value of a member", async () => {
  const result = await emit(`
    enum Status {
      quoted: "a\\"b",
      backslashed: "c\\\\d",
      lineSeparators: "e${"\u2028"}f${"\u2029"}g${"\u0085"}h",
    }

    model Item {
      status: Status;
    }

    op read(): Item;
  `);
  const status = getFile(result, "/generated/models/Status.cs");

  expect(status).toContain(`[JsonStringEnumMemberName("a\\"b")]`);
  expect(status).toContain(`[JsonStringEnumMemberName("c\\\\d")]`);
  expect(status).toContain(`[JsonStringEnumMemberName("e\\u2028f\\u2029g\\u0085h")]`);
});

it("escapes an encoded property name", async () => {
  const result = await emit(`
    model Item {
      @encodedName("application/json", "a\\"b\\\\c${"\u2028"}d")
      name: string;
    }

    op read(): Item;
  `);
  const item = getFile(result, "/generated/models/Item.cs");

  expect(item).toContain(`[JsonPropertyName("a\\"b\\\\c\\u2028d")]`);
});

it("escapes a pattern", async () => {
  const result = await emit(`
    model Item {
    @pattern("^\\\\d+$")
    code: string;
    }

    op read(): Item;
  `);

  expect(getFile(result, "/generated/models/Item.cs")).toContain(`Pattern = "^\\\\d+$"`);
});

it("escapes a string default value", async () => {
  const result = await emit(`
    model Item {
    path?: string = "C:\\\\temp";
    }

    op read(): Item;
  `);

  expect(getFile(result, "/generated/models/Item.cs")).toContain(`= "C:\\\\temp";`);
});

it("escapes a parameter name", async () => {
  const result = await emit(`
    op list(@query("filter\\"by") filter: string): void;
  `);

  expect(getFile(result, "/generated/controllers/ContosoOperationsController.cs")).toContain(
    `Name="filter\\"by"`,
  );
});

it("escapes a literal parameter default, including one built from a template", async () => {
  const result = await emit(`
    model Defaults {
      prefix: "a\\\\b";
    }

    op list(@query kind: "\${Defaults.prefix}-x", @query plain: "c\\\\d"): void;
  `);
  const controller = getFile(result, "/generated/controllers/ContosoOperationsController.cs");

  expect(controller).toContain(`string kind = "a\\\\b-x"`);
  expect(controller).toContain(`string plain = "c\\\\d"`);
});
