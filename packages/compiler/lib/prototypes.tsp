namespace TypeSpec.Prototypes;

extern dec getter(target: Reflection.Operation);

namespace Types {
  interface ModelProperty {
    @getter type(): unknown;
  }

  interface Operation {
    @getter returnType(): unknown;
    @getter parameters(): unknown;
  }

  interface Array<TElementType> {
    @getter elementType(): TElementType;
  }
}
