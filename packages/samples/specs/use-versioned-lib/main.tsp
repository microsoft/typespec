import "@typespec/versioning";
import "@typespec/rest";
import "./library.tsp";

using TypeSpec.Versioning;

// Use version 1.0 of the Library
@service({
  title: "Pet Store Service",
})
@useDependency(Library.Versions.`1.0`)
namespace VersionedApi;
using TypeSpec.Http;

op read(): Library.PetToy;
