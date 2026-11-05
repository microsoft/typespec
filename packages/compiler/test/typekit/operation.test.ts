import { assert, expect, it } from "vitest";
import { expectDiagnosticEmpty, expectDiagnostics, t } from "../../src/testing/index.js";
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

it("can get paging metadata for a request token and a next-link-only response", async () => {
  const { listPets, program } = await Tester.compile(t.code`
    op ${t.op("listPets")}(@continuationToken token?: string): {
      @pageItems pets: string[];
      @nextLink next?: string;
    };
  `);

  const [pagingMetadata, diagnostics] =
    $(program).operation.getPagingMetadata.withDiagnostics(listPets);
  expectDiagnosticEmpty(diagnostics);
  expect(pagingMetadata?.input.continuationToken).toBeDefined();
  expect(pagingMetadata?.output.nextLink).toBeDefined();
  expect(pagingMetadata?.output.continuationToken).toBeUndefined();
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
