import { isTemplateDeclaration, type Model } from "@typespec/compiler";

export function includeDerivedModel(model: Model): boolean {
  return (
    !isTemplateDeclaration(model) &&
    (model.templateMapper?.args === undefined ||
      model.templateMapper.args?.length === 0 ||
      model.derivedModels.length > 0)
  );
}
