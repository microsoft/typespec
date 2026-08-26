import { assert, expect, it } from "vitest";
import { expectDiagnostics, t } from "../../src/testing/index.js";
import { $ } from "../../src/typekit/index.js";
import { Tester } from "../tester.js";

it("can get paging metadata", async () => {
  const { listPets, program } = await Tester.compile(t.code`
    model Pet { name: string }

    @list op ${t.op("listPets")}(@continuationToken token?: string): {
      @pageItems pets: Pet[];
    };
  `);

  assert.ok(listPets.kind === "Operation");

  const pagingMetadata = $(program).operation.getPagingMetadata(listPets);
  expect(pagingMetadata?.input.continuationToken).toBeDefined();
  expect(pagingMetadata?.output.pageItems.property.name).toBe("pets");
});

it("can get diagnostics from getPagingMetadata", async () => {
  const [{ listPets, program }] = await Tester.compileAndDiagnose(t.code`
    model Pet { name: string }

    @list op ${t.op("listPets")}(): {
      pets: Pet[];
    };
  `);

  assert.ok(listPets.kind === "Operation");

  const [, diagnostics] = $(program).operation.getPagingMetadata.withDiagnostics(listPets);
  expectDiagnostics(diagnostics, {
    code: "missing-paging-items",
  });
});
