import "@typespec/rest";
import "@typespec/openapi";

@service({
  title: "Pet Store Service",
})
namespace PetStore;

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Rest.Resource;

@error
model PetStoreError {
  code: int32;
  message: string;
}

@resource("pets")
model Pet {
  @key("petId")
  id: int32;

  name: string;
  tag?: string;

  @minValue(0)
  @maxValue(20)
  age: int32;

  ownerId: int64;
}

@resource("toys")
@parentResource(Pet)
model Toy {
  @key("toyId")
  id: int64;

  petId: int64;
  name: string;
}

@resource("owners")
model Owner {
  @key("ownerId")
  id: int64;

  name: string;
  age: int32;
}

@resource("checkups")
model Checkup {
  @key("checkupId")
  id: int32;

  vetName: string;
  notes: string;
}

@segment("insurance")
model Insurance {
  provider: string;
  premium: int32;
  deductible: int32;
}

interface Pets extends ResourceOperations<Pet, PetStoreError> {}

interface PetCheckups
  extends ExtensionResourceCreateOrUpdate<Checkup, Pet, PetStoreError>,
    ExtensionResourceList<Checkup, Pet, PetStoreError> {}

interface PetInsurance extends SingletonResourceOperations<Insurance, Pet, PetStoreError> {}

interface Toys extends ResourceRead<Toy, PetStoreError> {
  @autoRoute
  @listsResource(Toy)
  list(
    ...ParentKeysOf<Toy>,
    @query nameFilter: string,
  ): CollectionWithNextLink<Toy> | PetStoreError;
}

interface ToyInsurance extends SingletonResourceOperations<Insurance, Toy, PetStoreError> {}

interface Checkups
  extends ResourceCreateOrUpdate<Checkup, PetStoreError>,
    ResourceList<Checkup, PetStoreError> {}

interface Owners extends ResourceOperations<Owner, PetStoreError> {}

interface OwnerCheckups
  extends ExtensionResourceCreateOrUpdate<Checkup, Owner, PetStoreError>,
    ExtensionResourceList<Checkup, Owner, PetStoreError> {}

interface OwnerInsurance extends SingletonResourceOperations<Insurance, Owner, PetStoreError> {}
