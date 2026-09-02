import { resolvePath } from "@typespec/compiler";
import { createTester, t } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { it } from "vitest";
import { getNoSdkClientsDiagnosticTarget } from "../src/emitter.js";
import { reportDiagnostic } from "../src/lib.js";

const Tester = createTester(resolvePath(import.meta.dirname, "../.."), { libraries: [] });

it("targets the service namespace when no SDK clients are found", async () => {
  const { Service, program } = await Tester.compile(t.code`
    #suppress "@typespec/http-client-python/no-sdk-clients" "This service intentionally has no client."
    @service namespace ${t.namespace("Service")} {}
  `);

  const target = getNoSdkClientsDiagnosticTarget(program);
  strictEqual(target, Service);

  reportDiagnostic(program, { code: "no-sdk-clients", target });
  strictEqual(
    program.diagnostics.some((x) => x.code.endsWith("/no-sdk-clients")),
    false,
  );
});
