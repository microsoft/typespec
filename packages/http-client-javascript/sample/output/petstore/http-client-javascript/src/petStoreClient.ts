import { PetStoreClientContext, createPetStoreClientContext } from "./api/clientContext.js";
import {
  ListPetToysResponseClientContext,
  createListPetToysResponseClientContext,
} from "./api/listPetToysResponseClient/clientContext.js";
import { list } from "./api/listPetToysResponseClient/operations.js";
import { PetsClientContext, createPetsClientContext } from "./api/petsClient/clientContext.js";
import { create, delete_, list as list_2, read } from "./api/petsClient/operations.js";
import { Pet } from "./models/models.js";

export class PetStoreClient {
  #context: PetStoreClientContext;
  petsClient: PetsClient;
  listPetToysResponseClient: ListPetToysResponseClient;
  constructor(endpoint: string) {
    this.#context = createPetStoreClientContext(endpoint);
    this.petsClient = new PetsClient(endpoint);
    this.listPetToysResponseClient = new ListPetToysResponseClient(endpoint);
  }
}

export class ListPetToysResponseClient {
  #context: ListPetToysResponseClientContext;

  constructor(endpoint: string) {
    this.#context = createListPetToysResponseClientContext(endpoint);
  }
  async list(nameFilter: string, petId: string) {
    return list(this.#context, nameFilter, petId);
  }
}

export class PetsClient {
  #context: PetsClientContext;

  constructor(endpoint: string) {
    this.#context = createPetsClientContext(endpoint);
  }
  async delete(petId: number) {
    return delete_(this.#context, petId);
  }
  async list(options?: { nextLink?: string }) {
    return list_2(this.#context, options);
  }
  async read(petId: number) {
    return read(this.#context, petId);
  }
  async create(pet: Pet) {
    return create(this.#context, pet);
  }
}
