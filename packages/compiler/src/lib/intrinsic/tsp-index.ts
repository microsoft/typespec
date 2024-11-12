import type { TypeSpecPrototypesDecorators } from "../../../generated-defs/TypeSpec.Prototypes.js";
import { docFromCommentDecorator, getterDecorator, indexerDecorator } from "./decorators.js";

export const $decorators = {
  TypeSpec: {
    indexer: indexerDecorator,
    docFromComment: docFromCommentDecorator,
  },
  "TypeSpec.Prototypes": {
    getter: getterDecorator,
  } as TypeSpecPrototypesDecorators,
};
