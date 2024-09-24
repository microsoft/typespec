export interface OkResponse {
  statusCode: 200;
}

export interface Error {
  code: number;
  message: string;
}

export interface PetResponsePage {
  items: Pet[];
  nextLink?: string;
}

export interface Pet {
  name: string;
  tag?: string;
  age: number;
}

export interface ToyResponsePage {
  items: Toy[];
  nextLink?: string;
}

export interface Toy {
  id: bigint;
  petId: bigint;
  name: string;
}
