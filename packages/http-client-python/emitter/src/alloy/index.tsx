import type { EmitContext } from "@typespec/compiler";
import { writeOutput } from "@typespec/emitter-framework";
import type { PythonEmitterOptions } from "../lib.js";
import { Enums } from "./components/enums.js";
import { Output } from "./components/output.js";
import { PythonPackageDirectory } from "./components/package-directory.js";

/**
 * Render only enum files via Alloy. Called from the hybrid path in
 * `onEmitMain` when `use-alloy-enums` is enabled.
 */
export async function $onEmitEnums(context: EmitContext<PythonEmitterOptions>) {
  if (context.program.compilerOptions.noEmit) {
    return;
  }
  const packageName = context.options["package-name"] ?? "test-package";
  const packageVersion = context.options["package-version"] ?? "1.0.0";
  const flavor = (context.options as any).flavor ?? "unbranded";

  const output = (
    <Output program={context.program}>
      <PythonPackageDirectory name={packageName} version={packageVersion} path=".">
        <Enums flavor={flavor} />
      </PythonPackageDirectory>
    </Output>
  );

  await writeOutput(context.program, output, context.emitterOutputDir);
}
