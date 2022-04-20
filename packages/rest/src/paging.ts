import { DecoratorContext, Program, Type, validateDecoratorParamType, validateDecoratorTarget } from "@cadl-lang/compiler";

const pagedByPropertyKey = Symbol("pageable");

export function $pagedByProperty(
  { program }: DecoratorContext,
  entity: Type,
  propertyName: string = "nextLink"
): void {
  if (
    !validateDecoratorTarget(program, entity, "@pagedByProperty", "Model") ||
    !validateDecoratorParamType(program, entity, propertyName, "String")
  ) {
    return;
  }

  program.stateMap(pagedByPropertyKey).set(entity, propertyName);
}

export function getPagedByProperty(program: Program, entity: Type): string | undefined {
  // This decorator only works on model types
  if (entity.kind !== "Model") return undefined;

  // First look at the type itself and any types in its 'extends' chain
  let pagePropertyName = program.stateMap(pagedByPropertyKey).get(entity);
  let parentType = entity.baseModel;
  while (!pagePropertyName && parentType) {
    pagePropertyName = program.stateMap(pagedByPropertyKey).get(parentType);
    parentType = parentType.baseModel;
  }

  // If we didn't find it in the inheritance chain, check the first template argument
  if (pagePropertyName === undefined && entity.templateArguments && entity.templateArguments.length > 0) {
    pagePropertyName = getPagedByProperty(program, entity.templateArguments[0]);
  }

  return pagePropertyName;
}
