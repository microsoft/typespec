import {
  getLifecycleVisibilityEnum,
  isVisible,
  type Model,
  type ModelProperty,
  type Program,
  type VisibilityFilter,
} from "@typespec/compiler";

export interface GraphQLVisibilityFilters {
  query: VisibilityFilter;
  mutation: VisibilityFilter;
  output: VisibilityFilter;
}

export function createVisibilityFilters(program: Program): GraphQLVisibilityFilters {
  const lifecycleEnum = getLifecycleVisibilityEnum(program);
  const createMember = lifecycleEnum.members.get("Create")!;
  const readMember = lifecycleEnum.members.get("Read")!;
  const updateMember = lifecycleEnum.members.get("Update")!;
  const queryMember = lifecycleEnum.members.get("Query")!;

  return {
    query: { any: new Set([readMember, queryMember]) },
    mutation: { any: new Set([createMember, updateMember]) },
    output: { any: new Set([readMember]) },
  };
}

export function isPropertyVisible(
  program: Program,
  property: ModelProperty,
  filter: VisibilityFilter,
): boolean {
  return isVisible(program, property, filter);
}

export function hasNoVisibleProperties(
  program: Program,
  model: Model,
  filter: VisibilityFilter,
): boolean {
  for (const prop of model.properties.values()) {
    if (isVisible(program, prop, filter)) return false;
  }
  return true;
}

export type { VisibilityFilter };
