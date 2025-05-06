import { assert, expect, it } from "vitest";
import { expectDiagnostics } from "../../src/testing/expect.js";
import { createTestHost } from "../../src/testing/test-host.js";
import { createTestWrapper } from "../../src/testing/test-utils.js";
import { $ } from "../../src/typekit/index.js";
import { getTypes } from "./utils.js";

it("can get paging metadata", async () => {
  const {
    listPets,
    context: { program },
  } = await getTypes(
    `
    model Pet { name: string }

    @list op listPets(@continuationToken token?: string): {
      @pageItems pets: Pet[];
    };
  `,
    ["listPets"],
  );

  assert.ok(listPets.kind === "Operation");

  const pagingMetadata = $(program).operation.getPagingMetadata(listPets);
  expect(pagingMetadata?.input.continuationToken).toBeDefined();
  expect(pagingMetadata?.output.pageItems.property.name).toBe("pets");
});

it("can get diagnostics from getPagingMetadata", async () => {
  const runner = createTestWrapper(await createTestHost());
  const [{ listPets }] = await runner.compileAndDiagnose(`
      model Pet { name: string }

      @test @list op listPets(): {
        pets: Pet[];
      };
    `);

  assert.ok(listPets.kind === "Operation");

  const [, diagnostics] = $(runner.program).operation.getPagingMetadata.withDiagnostics(listPets);
  expectDiagnostics(diagnostics, {
    code: "missing-paging-items",
  });
});
