import type { ModelProperty, Type } from "../../core/types.js";
import { EncodeData, getEncode } from "../../lib/decorators.js";
import { defineKit } from "../define-kit.js";

interface ModelPropertyKit {
  modelProperty: {
    is(type: Type): type is ModelProperty;
    getEncoding(property: ModelProperty): EncodeData | undefined;
  };
}

declare module "../define-kit.js" {
  interface TypekitPrototype extends ModelPropertyKit {}
}

defineKit<ModelPropertyKit>({
  modelProperty: {
    is(type) {
      return type.kind === "ModelProperty";
    },

    getEncoding(type) {
      return getEncode(this.program, type);
    },
  },
});
