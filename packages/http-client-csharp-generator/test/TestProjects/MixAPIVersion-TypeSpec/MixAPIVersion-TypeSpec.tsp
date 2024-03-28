import "@typespec/rest";
import "@typespec/http";
import "@typespec/versioning";
import "@azure-tools/typespec-client-generator-core";
import "@azure-tools/typespec-azure-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using Azure.Core;

@versioned(Versions)
@service({title:"PetStore"})
@doc("This is a sample server Petstore server.  You can find out more about Swagger at [http://swagger.io](http://swagger.io) or on [irc.freenode.net, #swagger](http://swagger.io/irc/).  For this sample, you can use the api key `special-key` to test the authorization filters.")
@server(
    "{petStoreUrl}",
    "Endpoint Service",
    {
        petStoreUrl: string,
    }
)
namespace MixApiVersion;

enum Versions {
  @useDependency(Azure.Core.Versions.v1_0_Preview_1)
  "2022-11-30-preview"
}

// Model types
@doc("Pet")
@resource("Pet")
model Pet {
  @key
  @visibility("read")
  @doc("pet name")
  name: string;
  tag?: string;

  @minValue(0)
  @maxValue(20)
  age: int32;
}

@resource("Toy")
model Toy {
  @key
  @visibility("read")
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

@doc("Manage your pets. You can delete or get the Pet from pet store.")
@summary("Manage your pets.")
@route("/pets")
namespace Pets {
  @doc("Delete a pet.")
  @summary("delete.")
  op delete is ResourceDelete<Pet>;

  @doc("Returns a pet. Supports eTags.")
  op read(...PetId): Pet | NotModified<Pet> | Error;

  @post op create(@body pet: Pet, @query apiVersion: "2022-07-09"): Pet | Error;
}

@route("/pets/toys")

namespace ListPetToysResponse {

  @summary("Gets ledger entries from a collection corresponding to a range.")
  @doc("A collection id may optionally be specified. Only entries in the specified (or default) collection will be returned.")
  op listPet is Azure.Core.ResourceList<Toy>;
  
}
