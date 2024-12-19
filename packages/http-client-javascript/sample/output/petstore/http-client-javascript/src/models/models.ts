export interface ConstructorParameters {
  endpoint: string;
}

export interface ConstructorParameters_2 {
  endpoint: string;
}

export interface ConstructorParameters_3 {
  endpoint: string;
}

export interface ToyResponsePage {
  items: Array<Toy>;
  nextLink?: string;
}

export interface Toy {
  id: bigint;
  petId: bigint;
  name: string;
}

export interface PetResponsePage {
  items: Array<Pet>;
  nextLink?: string;
}

export interface Pet {
  name: string;
  tag?: string;
  age: number;
}
