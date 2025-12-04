import type { Type } from "@typespec/compiler";

/**
 * Connector for {@link TypeSpec} {@link Type}s that captures the type graph edges used for
 * topological ordering. Each returned dependency represents an incoming edge for the source
 * type, e.g. a model depends on its base model, property types, and indexer key/value types.
 */
export function typeDependencyConnector(type: Type): Iterable<Type> {
  return iterateTypeDependencies(type);
}

function* iterateTypeDependencies(type: Type): IterableIterator<Type> {
  switch (type.kind) {
    case "Model":
      if (type.baseModel) {
        yield type.baseModel;
      }

      if (type.indexer) {
        yield type.indexer.key;
        yield type.indexer.value;
      }

      for (const property of type.properties.values()) {
        yield property.type;
      }
      break;
    case "ModelProperty":
      yield type.type;
      break;
    case "Interface":
      for (const operation of type.operations.values()) {
        yield operation;
      }
      break;
    case "Operation":
      yield type.parameters;
      yield type.returnType;
      break;
    case "Union":
      for (const variant of type.variants.values()) {
        yield variant;
      }
      break;
    case "UnionVariant":
      yield type.type;
      break;
    case "Tuple":
      yield* type.values;
      break;
    case "Enum":
      for (const member of type.members.values()) {
        yield member;
      }
      break;
    case "EnumMember":
      if (type.sourceMember) {
        yield type.sourceMember;
      }
      break;
    case "Scalar":
      if (type.baseScalar) {
        yield type.baseScalar;
      }
      break;
  }
}
