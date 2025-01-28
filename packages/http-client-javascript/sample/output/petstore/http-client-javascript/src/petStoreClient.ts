import {
  ListPetToysResponseClientContext,
  ListPetToysResponseClientOptions,
  createListPetToysResponseClientContext,
} from "./api/listPetToysResponseClient/listPetToysResponseClientContext.js";
import { list as list_2 } from "./api/listPetToysResponseClient/listPetToysResponseClientOperations.js";
import {
  PetStoreClientContext,
  PetStoreClientOptions,
  createPetStoreClientContext,
} from "./api/petStoreClientContext.js";
import {
  PetsClientContext,
  PetsClientOptions,
  createPetsClientContext,
} from "./api/petsClient/petsClientContext.js";
import { create, delete_, list, read } from "./api/petsClient/petsClientOperations.js";
import { Pet } from "./models/models.js";

export class PetStoreClient {
  #context: PetStoreClientContext;
  petsClient: PetsClient;
  listPetToysResponseClient: ListPetToysResponseClient;
  constructor(endpoint: string, options?: PetStoreClientOptions) {
    this.#context = createPetStoreClientContext(endpoint, options);
    this.petsClient = new PetsClient(endpoint, options);
    this.listPetToysResponseClient = new ListPetToysResponseClient(endpoint, options);
  }
}

export class ListPetToysResponseClient {
  #context: ListPetToysResponseClientContext;

  constructor(endpoint: string, options?: ListPetToysResponseClientOptions) {
    this.#context = createListPetToysResponseClientContext(endpoint, options);
  }
  async list(nameFilter: string, petId: string) {
    return list_2(this.#context, nameFilter, petId);
  }
}

export class PetsClient {
  #context: PetsClientContext;

  constructor(endpoint: string, options?: PetsClientOptions) {
    this.#context = createPetsClientContext(endpoint, options);
  }
  async delete_(petId: number) {
    return delete_(this.#context, petId);
  }
  async list(options?: { nextLink?: string }) {
    return list(this.#context, options);
  }
  async read(petId: number) {
    return read(this.#context, petId);
  }
  async create(pet: Pet) {
    return create(this.#context, pet);
  }
}
