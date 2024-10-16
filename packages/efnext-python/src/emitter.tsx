import { Output, SourceFile } from "@alloy-js/core";
import { EmitContext } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { ClassDeclaration, PythonModule, PythonPackage, PythonProject } from "@typespec/emitter-framework/python";

export async function $onEmit(context: EmitContext) {
  if (context.program.compilerOptions.noEmit) return;
  
  const globalNamespace = context.program.getGlobalNamespaceType();
  const petStoreNamespace = globalNamespace.namespaces.get("PetStore")!;
  const allModels = [...petStoreNamespace.models.values()];
  const models = allModels.filter((model) => !$.type.isTemplateDeclaration(model));
  const modelComponents = models.map((model) => <ClassDeclaration type={model} />);
  return (
    <Output basePath={context.emitterOutputDir}>
      <PythonProject name="pet_store" version="0.1.0">
        <SourceFile path="hello-world.txt" filetype="plain-text">
          Hello, world!
        </SourceFile>
      </PythonProject>
    </Output>
  );
}
