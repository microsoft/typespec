import type { ModelProperty, Type } from "../../core/types.js";
import { EncodeData, getEncode } from "../../lib/decorators.js";
import { defineKit } from "../define-kit.js";

export interface ModelPropertyKit {
  is(type: Type): type is ModelProperty;
  getEncoding(property: ModelProperty): EncodeData | undefined;
}

interface TypeKit {
  modelProperty: ModelPropertyKit;
}

declare module "../define-kit.js" {
  interface TypekitPrototype extends TypeKit {}
}

defineKit<TypeKit>({
  modelProperty: {
    is(type) {
      return type.kind === "ModelProperty";
    },

    getEncoding(type) {
      return getEncode(this.program, type);
    },
  },
});
