import { type Type } from "../../../core/types.js";
import { defineKit } from "../define-kit.js";
import { copyMap } from "../utils.js";

/**  @experimental */
export interface TypeTypekit {
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

interface TypekitExtension {
  /**
   * Utilities for working with general types.
   * @experimental
   */
  type: TypeTypekit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
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
            models: copyMap(type.models as any),
            decoratorDeclarations: copyMap(type.decoratorDeclarations as any),
            enums: copyMap(type.enums as any),
            unions: copyMap(type.unions as any),
            operations: copyMap(type.operations as any),
            interfaces: copyMap(type.interfaces as any),
            functionDeclarations: copyMap(type.functionDeclarations as any),
            namespaces: copyMap(type.namespaces as any),
            scalars: copyMap(type.scalars as any),
          });
          break;
        default:
          clone = this.program.checker.createType({
            ...type,
            ...("decorators" in type ? { decorators: [...type.decorators] } : {}),
          });
          break;
      }
      this.realm.addType(clone);
      return clone;
    },
  },
});
