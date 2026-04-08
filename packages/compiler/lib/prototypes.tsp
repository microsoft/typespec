namespace TypeSpec.Prototypes;

#suppress "experimental-feature" "Compiler internal decorator."
internal extern dec getter(target: unknown);

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
