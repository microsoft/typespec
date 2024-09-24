import { PetStoreContext, PetStoreOptions, createPetStoreContext } from "./api/clientContext.js";
import { list as list_2 } from "./api/listPetToysResponse/operations.js";
import { create, delete_, list, read } from "./api/pets/operations.js";
import { Pet } from "./models/models.js";

export class PetStoreClient {
  listPetToysResponse: ListPetToysResponseClient;
  pets: PetsClient;
  #context: PetStoreContext;
  constructor(endpoint: string, options?: PetStoreOptions) {
    this.#context = createPetStoreContext(endpoint, options);
    this.listPetToysResponse = new ListPetToysResponseClient(this.#context);
    this.pets = new PetsClient(this.#context);
  }
}
export class ListPetToysResponseClient {
  #context: PetStoreContext;
  constructor(context: PetStoreContext) {
    this.#context = context;
  }
  list(nameFilter: string, petId: string) {
    return list_2(this.#context, nameFilter, petId);
  }
}

export class PetsClient {
  #context: PetStoreContext;
  constructor(context: PetStoreContext) {
    this.#context = context;
  }
  delete(petId: number) {
    return delete_(this.#context, petId);
  }

  list(options?: { nextLink?: string }) {
    return list(this.#context, options);
  }

  read(petId: number) {
    return read(this.#context, petId);
  }

  create(pet: Pet) {
    return create(this.#context, pet);
  }
}
