import "@typespec/versioning";
import "@typespec/rest";
import "./library.tsp";

using Versioning;
using Rest;

@service(#{ title: "Pet Store Service" })
@versioned(Versions)
namespace VersionedApi;
using Http;

enum Versions {
  @useDependency(Library.Versions.`1.0`)
  v1,

  @useDependency(Library.Versions.`1.1`)
  v2,
}

model ApiVersionParam {
  @header apiVersion: Versions;
}

@discriminator("type")
model PetBase {
  name: string;
  favoriteToys: Library.PetToy[];
}

model Dog extends PetBase {
  type: "dog";
  nextWalkTime: utcDateTime;

  @madeOptional(Versions.v2)
  walkerName?: string;

  @added(Versions.v2)
  commandList: string[];
}

@added(Versions.v2)
model Cat extends PetBase {
  type: "cat";
  catnipDose: int32;
}

@route("/")
interface MyService {
  getPet(...ApiVersionParam): PetBase;

  @added(Versions.v2)
  @post
  @route("/walkDog")
  walkDog(...ApiVersionParam): OkResponse;

  @removed(Versions.v2)
  @post
  @route("/walkCat")
  walkCat(...ApiVersionParam): OkResponse;
}
