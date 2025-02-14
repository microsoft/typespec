import { Enum, Model, navigateType, Scalar, Type, Union } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";

export function collectDataTypes(type: Type, dataTypes: Set<Model | Union | Enum | Scalar>) {
  navigateType(
    type,
    {
      model(model) {
        if ($.httpPart.is(model)) {
          const partType = $.httpPart.unpack(model);
          // Need recursive call to collect data types from the part type as the semantic walker
          // doesn't do it automatically.
          collectDataTypes(partType, dataTypes);
          return;
        }

        if (!model.name) {
          return;
        }

        dataTypes.add(model);
      },
      union(union) {
        if (!union.name) {
          return;
        }

        dataTypes.add(union);
      },
      enum(enum_) {
        if (!enum_.name) {
          return;
        }

        dataTypes.add(enum_);
      },
      scalar(scalar) {
        if (!scalar.name) {
          return;
        }

        dataTypes.add(scalar);
      },
    },
    { includeTemplateDeclaration: false, visitDerivedTypes: true },
  );
}
