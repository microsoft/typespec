import { type Namespace, type Type } from "../../../core/types.js";
import { $, defineKit } from "../define-kit.js";
import { copyMap } from "../utils.js";

/**  @experimental */
export interface TypeKit {
  /**
   * Clones a type and adds it to the typekit's realm.
   * @param type Type to clone
   */
  clone<T extends Type>(type: T): T;
  /**
   * Finishes a type, applying all the decorators.
   */
  finishType(type: Type): void;
}

interface BaseTypeKit {
  /**
   * Utilities for working with general types.
   */
  type: TypeKit;
}

declare module "../define-kit.js" {
  interface TypekitPrototype extends BaseTypeKit {}
}

defineKit<BaseTypeKit>({
  type: {
    finishType(type: Type) {
      this.program.checker.finishType(type);
    },
    clone<T extends Type>(type: T): T {
      let clone: T;
      switch (type.kind) {
        case "Model":
          clone = this.program.checker.createType({
            ...type,
            decorators: [...type.decorators],
            properties: copyMap(type.properties),
            indexer: type.indexer ? { ...type.indexer } : undefined,
          });
          break;
        case "Union":
          clone = this.program.checker.createType({
            ...type,
            decorators: [...type.decorators],
            variants: copyMap(type.variants),
            get options() {
              return Array.from(this.variants.values()).map((v: any) => v.type);
            },
          });
          break;
        case "Interface":
          clone = this.program.checker.createType({
            ...type,
            decorators: [...type.decorators],
            operations: copyMap(type.operations),
          });
          break;

        case "Enum":
          clone = this.program.checker.createType({
            ...type,
            members: copyMap(type.members),
          });
          break;
        case "Namespace":
          clone = this.program.checker.createType({
            ...type,
            decorators: [...type.decorators],
            instantiationParameters: type.instantiationParameters
              ? [...type.instantiationParameters]
              : undefined,
            projections: [...type.projections],
          });
          const clonedNamespace = clone as Namespace;
          clonedNamespace.decoratorDeclarations = cloneTypeCollection(type.decoratorDeclarations, {namespace: clonedNamespace});
          clonedNamespace.models = cloneTypeCollection(type.models, {namespace: clonedNamespace});
          clonedNamespace.enums = cloneTypeCollection(type.enums, {namespace: clonedNamespace});
          clonedNamespace.functionDeclarations = cloneTypeCollection(type.functionDeclarations, {namespace: clonedNamespace});
          clonedNamespace.interfaces = cloneTypeCollection(type.interfaces, {namespace: clonedNamespace});
          clonedNamespace.namespaces = cloneTypeCollection(type.namespaces, {namespace: clonedNamespace});
          clonedNamespace.operations = cloneTypeCollection(type.operations, {namespace: clonedNamespace});
          clonedNamespace.scalars = cloneTypeCollection(type.scalars, {namespace: clonedNamespace});
          clonedNamespace.unions = cloneTypeCollection(type.unions, {namespace: clonedNamespace});
          break;
        default:
          clone = this.program.checker.createType({
            ...type,
            ...("decorators" in type ? { decorators: [...type.decorators] } : {}),
          });
          break;
      }
      this.realm.get().addType(clone);
      return clone;
    },
  },
});


function cloneTypeCollection<T extends Type>(collection: Map<string, T>, options: {namespace?: Namespace} = {}): Map<string, T> {
  const cloneCollection = new Map<string, T>();
  for (const [key, type] of collection) {
    const clone = $.type.clone(type);
    if("namespace" in clone && options.namespace) {
      clone.namespace = options.namespace;
    }
    cloneCollection.set(key, clone);
  }
  return cloneCollection;
}
