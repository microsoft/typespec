import { createPackage } from "@alloy-js/typescript";

export const typespecCompiler = createPackage({
  name: "@typespec/compiler",
  version: "^1.0.0",
  descriptor: {
    ".": {
      named: [
        "Program",
        "DecoratorContext",
        "Type",
        "Namespace",
        "Model",
        "ModelProperty",
        "Enum",
        "EnumMember",
        "Operation",
        "Interface",
        "Union",
        "UnionVariant",
        "Scalar",
        "EnumValue",
        "Numeric",
      ],
    },
  },
});
