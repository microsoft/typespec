import "@typespec/rest";

using Http;
using Rest;

@service(#{ title: "Polymorphism sample" })
namespace PolymorphismSample;

@discriminator("kind")
model Pet {
  name: string;
  weight?: float32;
}
model Cat extends Pet {
  kind: "cat";
  meow: int32;
}
model Dog extends Pet {
  kind: "dog";
  bark: string;
}

@route("/Pets")
namespace root {
  op read(): {
    @body body: Pet;
  };
}
