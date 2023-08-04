import "@typespec/rest";

using TypeSpec.Http;

@service({
  title: "Sample showcasing projected names",
})
namespace ProjectedNames;

model WithProjectedNames {
  @projectedName("json", "nbf")
  @projectedName("csharp", "ValidAfter")
  notBefore: int32;

  @projectedName("json", "exp")
  expires: int32;

  created: int32;
  updated: int32;
}

op test(@query("$select") select: string): WithProjectedNames;
