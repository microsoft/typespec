import { EmitContext } from "@typespec/compiler";
import { writeOutput } from "@typespec/emitter-framework";
import { PythonEmitterOptions, PythonSdkContext } from "../lib.js";
import { getRootNamespace } from "../utils.js";
import { Output } from "./components/output.js";
import { PythonPackageDirectory } from "./components/package-directory.js";
import { postProcessPython } from "./post-process.js";

/**
 * Renders the Python client package using alloy + emitter-framework.
 *
 * This is an opt-in code path triggered by `use-alloy-renderer: true`. It
 * replaces (it does **not** chain onto) the existing pygen + Pyodide / native
 * Python flow. The renderer is incomplete by design: today it only writes the
 * package skeleton (`pyproject.toml`, `README.md`, `<module>/__init__.py`,
 * `<module>/_version.py`, `<module>/py.typed`).
 *
 * Models, clients, operations, paging, LROs, async variants, and serialization
 * helpers land in follow-up slices.
 */
export async function renderWithAlloy(
  context: EmitContext<PythonEmitterOptions>,
  sdkContext: PythonSdkContext,
): Promise<void> {
  const program = context.program;
  if (program.compilerOptions.noEmit) {
    return;
  }
  const options = sdkContext.emitContext.options;

  const namespace = getRootNamespace(sdkContext);
  const packageName = options["package-name"] ?? (namespace.replace(/\./g, "-") || "test-package");
  const packageVersion = options["package-version"] ?? "1.0.0b1";
  // `package-pprint-name` may have been shell-quoted upstream; strip the
  // surrounding quotes before threading it through alloy.
  const prettyName = (options["package-pprint-name"] ?? packageName).replace(/^"|"$/g, "");

  const tree = (
    <Output program={program}>
      <PythonPackageDirectory
        name={packageName}
        version={packageVersion}
        prettyName={prettyName}
        path="."
      />
    </Output>
  );

  await writeOutput(program, tree, context.emitterOutputDir);

  // Post-processing depends on `pyodide` and the local filesystem; skip when
  // running in-memory (the test compiler points `emitterOutputDir` at a
  // virtual path that doesn't exist on disk).
  const fs = await import("fs");
  if (!fs.existsSync(context.emitterOutputDir)) {
    return;
  }
  await postProcessPython(context.emitterOutputDir);
}
