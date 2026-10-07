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

it("writes one JsonPropertyName for a property, carrying its encoded name", async () => {
  const result = await emit(`
    model Item {
      @encodedName("application/json", "full_name")
      fullName: string;
      nickName: string;
    }

    op read(): Item;
  `);
  const item = getFile(result, "/generated/models/Item.cs");

  expect(item?.match(/JsonPropertyName/g)).toHaveLength(2);
  expect(item).toContain(`[JsonPropertyName("full_name")]`);
  expect(item).toContain(`[JsonPropertyName("nickName")]`);
});

it("writes JsonPropertyName for a json name that matches the C# property name", async () => {
  const result = await emit(`
    model Item {
      @encodedName("application/json", "FullName")
      fullName: string;
      Title: string;
    }

    op read(): Item;
  `);
  const item = getFile(result, "/generated/models/Item.cs");

  expect(item).toContain(`[JsonPropertyName("FullName")]`);
  expect(item).toContain(`[JsonPropertyName("Title")]`);
  expect(item).not.toContain(`[JsonPropertyName("fullName")]`);
});

it("uses the encoded name for a property of an anonymous request body", async () => {
  const result = await emit(`
    @post op create(
      @encodedName("application/json", "full_name") fullName: string,
      nickName: string,
    ): void;
  `);
  const request = getFile(result, "/generated/models/ContosoOperationsCreateRequest.cs");

  expect(request?.match(/JsonPropertyName/g)).toHaveLength(2);
  expect(request).toContain(`[JsonPropertyName("full_name")]`);
  expect(request).toContain(`[JsonPropertyName("nickName")]`);
});
