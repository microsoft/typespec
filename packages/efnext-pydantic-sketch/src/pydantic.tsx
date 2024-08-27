import { Output } from "@alloy-js/core";
import { EmitContext } from "@typespec/compiler";
import { PythonProject } from "@typespec/emitter-framework/python";

export async function $onEmit(context: EmitContext) {
  if (context.program.compilerOptions.noEmit) return;

  return (
    <Output basePath={context.emitterOutputDir}>
      <PythonProject name="testProject" path="testProject" version="0.1.0" />
    </Output>
  );
}
