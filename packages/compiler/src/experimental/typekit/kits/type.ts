import type { Type } from "../../../core/types.js";
import { Realm } from "../../realm.js";
import { defineKit } from "../define-kit.js";
import { copyMap } from "../utils.js";

export interface TypeKit {
  clone<T extends Type>(type: T, realm?: Realm): T;
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
    clone<T extends Type>(type: T, realm?: Realm): T {
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
            decorators: [...type.decorators],
            members: copyMap(type.members),
          });
          break;
        default:
          clone = this.program.checker.createType({
            ...type,
            ...("decorators" in type ? { decorators: [...type.decorators] } : {}),
          });
          break;
      }
      realm?.addType(clone);
      return clone;
    },
  },
});
