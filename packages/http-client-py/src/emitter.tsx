import { EmitContext } from "@typespec/compiler";
import { writeOutput } from "@typespec/emitter-framework";
import { Client } from "./components/client.jsx";
import { Models } from "./components/models.jsx";
import { Output } from "./components/output.jsx";
import { PythonPackageDirectory } from "./components/package-directory.jsx";
import { PyClientEmitterOptions } from "./lib.js";

/**
 * Entry point for `@typespec/http-client-py`. Wires together the Output
 * provider, a Python `PythonPackageDirectory` for the package layout, and the
 * Models + Client components for content.
 */
export async function $onEmit(context: EmitContext<PyClientEmitterOptions>) {
  const packageName = context.options["package-name"] ?? "test-package";
  const packageVersion = context.options["package-version"] ?? "1.0.0";

  const output = (
    <Output program={context.program}>
      <PythonPackageDirectory name={packageName} version={packageVersion} path=".">
        <Models />
        <Client />
      </PythonPackageDirectory>
    </Output>
  );

  await writeOutput(context.program, output, context.emitterOutputDir);
}
