import "@typespec/graphql";

using GraphQL;

@schema
namespace PetStore;

/** A pet in the store */
model Pet {
  id: string;
  name: string;
  tag?: string;
  status: PetStatus;
}

/** Pet status in the store */
enum PetStatus {
  Available,
  Pending,
  Sold,
}

/** A toy that belongs to a pet */
model Toy {
  id: string;
  name: string;
  pet: Pet;
}

@query op getPet(id: string): Pet | null;
@query op listPets(status?: PetStatus, limit?: int32): Pet[];
@query op getPetToys(petId: string): Toy[];

@mutation op createPet(name: string, tag: string, status: PetStatus): Pet;
@mutation op updatePet(id: string, name?: string, status?: PetStatus): Pet | null;
@mutation op deletePet(id: string): boolean;
