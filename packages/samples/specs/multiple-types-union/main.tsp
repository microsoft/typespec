import "@typespec/rest";
import "@typespec/openapi";

@service(#{ title: "Pet Store Service" })
namespace PetStore;
using Http;

model ApiVersionParam {
  @header apiVersion: string;
}

model PetBase {
  name: string;
}

model Dog extends PetBase {
  type: "dog";
  nextWalkTime: utcDateTime;
}

model Cat extends PetBase {
  type: "cat";
  catnipDose: int32;
}

union Pet {
  cat: Cat,
  dog: Dog,
}

@route("/")
interface MyService {
  getPet(...ApiVersionParam): Body<Pet>;
}
