import { listServices } from "@typespec/compiler";
import { expectDiagnostics, t } from "@typespec/compiler/testing";
import { it } from "vitest";
import { reportDiagnostic } from "../src/lib.js";
import { Tester } from "./test-host.js";

it("targets the service namespace when no SDK clients are found", async () => {
  const { program } = await Tester.compile(t.code`
    #suppress "@typespec/http-client-python/no-sdk-clients" "This service intentionally has no client."
    @service namespace ${t.namespace("Service")} {}
  `);

  reportDiagnostic(program, {
    code: "no-sdk-clients",
    target: listServices(program)[0]?.type ?? program.getGlobalNamespaceType(),
  });
  expectDiagnostics(program.diagnostics, []);
});

it("allows suppressing the warning when no service exists", async () => {
  const { program } = await Tester.compile(`
    #suppress "@typespec/http-client-python/no-sdk-clients" "This model-only package intentionally has no client."
    model Widget {}
  `);

  reportDiagnostic(program, {
    code: "no-sdk-clients",
    target: listServices(program)[0]?.type ?? program.getGlobalNamespaceType(),
  });
  expectDiagnostics(program.diagnostics, []);
});
