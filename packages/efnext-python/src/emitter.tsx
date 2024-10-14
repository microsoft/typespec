import { Output } from "@alloy-js/core";
import { EmitContext } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { ClassDeclaration, PythonModule, PythonPackage, PythonProject } from "@typespec/emitter-framework/python";

export async function $onEmit(context: EmitContext) {
  if (context.program.compilerOptions.noEmit) return;
  
  const globalNamespace = context.program.getGlobalNamespaceType();
  const models = [...globalNamespace.models.values()].filter((model) => !$.type.isTemplateDeclaration(model));
  const modelComponents = models.map((model) => <ClassDeclaration type={model} />);
  return (
    <Output basePath={context.emitterOutputDir}>
      <PythonProject name="pet_store" version="0.1.0">
        <PythonPackage name="models">
          <PythonModule name="models.py">
            {modelComponents}
          </PythonModule>
        </PythonPackage>
      </PythonProject>    
    </Output>
  );
}
