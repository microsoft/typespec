import { Enum, Model, navigateType, Scalar, Type, Union } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";

export function collectDataTypes(type: Type, dataTypes: Set<Model | Union | Enum | Scalar>) {
  navigateType(
    type,
    {
      modelProperty(modelProperty) {
        collectDataTypes(modelProperty.type, dataTypes);
      },
      model(model) {
        if ($.array.is(model) || $.record.is(model)) {
          return;
        }

        if ($.httpPart.is(model)) {
          const partType = $.httpPart.unpack(model);
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
      unionVariant(unionVariant) {
        collectDataTypes(unionVariant.type, dataTypes);
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
    { includeTemplateDeclaration: false },
  );
}
