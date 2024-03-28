import "@typespec/rest";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";
import "./decorators.mjs";
import "./lro.tsp";

using TypeSpec.Http;
using Azure.Core;
using Azure.ClientGenerator.Core;

@service(
    {
        title: "Pet Store Service",
        version: "2021-03-25"
    }
)
@doc("This is a sample server Petstore server.  You can find out more about Swagger at [http://swagger.io](http://swagger.io) or on [irc.freenode.net, #swagger](http://swagger.io/irc/).  For this sample, you can use the api key `special-key` to test the authorization filters.")
@server(
    "{petStoreUrl}",
    "Endpoint Service",
    {
        petStoreUrl: string,
    }
)
namespace PetStore;

// Model types
model Pet {
  name: string;
  tag?: string;

  @minValue(0)
  @maxValue(20)
  age: int32;
}

model Toy {
  id: int64;
  petId: int64;
  name: string;
}

@doc("Error")
@error
model Error {
  code: int32;
  message: string;
}

@doc("Not modified")
model NotModified<T> {
  @statusCode _: 304;
  @body body: T;
}

@friendlyName("{name}ListResults", T)
model ResponsePage<T> {
  items: T[];
  nextLink?: string;
}

model PetId {
  @path
  @doc("The id of pet.")
  petId: int32;
}

@doc("Extensible enum Values for pet kind")
enum PetKind {
    Dog: "dog",
    Cat: "cat"
}

@doc("Fish is the base model")
@discriminator("kind")
model Fish {
    @doc("The size of the fish")
    size: int32;
}

@doc("Shark is a fish")
model Shark extends Fish {
    kind: "shark";

    @doc("The bite of the shark")
    bite: string;
}

@doc("Tuna is a fish")
model Tuna extends Fish {
    kind: "tuna";

    @doc("The amount of fat of the tuna")
    fat: int32;
}

@doc("Manage your pets. You can delete or get the Pet from pet store.")
@summary("Manage your pets.")
@route("/pets")
namespace Pets {
  @doc("Delete a pet.")
  @summary("delete.")
  @delete
  @convenientAPI(true)
  op delete(...PetId): Response<200> | Error;

  // @fancyDoc("List pets.")
  // op list(@query nextLink?: string): OkResponse<ResponsePage<Pet>> | Error;

  @doc("Returns a pet. Supports eTags.")
  @convenientAPI(true)
  op read(...PetId): Pet | (NotModifiedResponse & Pet) | Error;

  @convenientAPI(true)
  @post op create(@body pet: Pet): Pet | Error;

  @convenientAPI(true)
  @get op getPetByKind(@path kind: PetKind): Pet | Error;

  @convenientAPI(true)
  @get op GetFirstPet(@query start?: int32): Pet | Error;

  @convenientAPI(true)
  @route("/getFish")
  @get op getFish(@query kind?: string): Fish | Error;

  @doc("Test that an LRO polling operation defined in a namespace wtihout @service decorator will not be generated. This should be removed after cadl-ranch test case update.")
  @convenientAPI(true)
  @post
  @route("/refresh")
  @pollingOperation(Lro.getStatus)
  op refresh(): Error;
}
