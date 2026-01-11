import "@typespec/rest";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;

@service(#{ title: "Subclass" })
namespace TspTest.Subclass;

model DuplicateRequiredPropertyParent {
  duplicateRequiredProperty: string;
}
model DuplicateRequiredProperty extends DuplicateRequiredPropertyParent {
  duplicateRequiredProperty: string;
}

model PropertyChangedToRequiredParent {
  propertyChangedToRequired?: string;
}
model PropertyChangedToRequired extends PropertyChangedToRequiredParent {
  propertyChangedToRequired: string;
}

model PropertyChangedToConstantParent {
  propertyChangedToConstant: string;
}
model PropertyChangedToConstant extends PropertyChangedToConstantParent {
  propertyChangedToConstant: "constantValue";
}

// Incompatible return type in Java method override
// model PropertyChangedToEnumParent {
//   propertyChangedToEnum: string;
// }
// model PropertyChangedToEnum extends PropertyChangedToEnumParent {
//   propertyChangedToEnum: EnumModel;
// }
// union EnumModel {
//   string,
//   "value1",
// }

model Body {
  duplicateRequiredProperty?: DuplicateRequiredProperty;
  propertyChangedToRequired?: PropertyChangedToRequired;
  propertyChangedToConstant?: PropertyChangedToConstant;
}

@route("/subclass")
interface Subclass {
  @post
  @route("/property-in-subclass")
  propertyInSubclass(@body body: Body): Body;
}
