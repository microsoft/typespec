/**
 * This example showcase providing a different name over the wire.
 * In this example the `WithEncodedNames` model has a `notBefore` property that should get serialized as `nbf` when serialized as json.
 */
@service({
  title: "Sample showcasing encoded names",
})
namespace EncodedNames;

model WithEncodedNames {
  @encodedName("application/json", "nbf")
  notBefore: int32;

  @encodedName("application/json", "exp")
  expires: int32;

  created: int32;
  updated: int32;
}

op test(): WithEncodedNames;
