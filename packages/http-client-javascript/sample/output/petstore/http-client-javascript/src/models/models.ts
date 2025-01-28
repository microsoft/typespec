export type Int32 = number;

export type Int64 = bigint;

export type Integer = number;

export type Numeric = number;

export type String = string;

export interface ResponsePage {
  items: Array<Pet>;
  nextLink?: string;
}

export interface Pet {
  name: string;
  tag?: string;
  age: number;
}

export interface ResponsePage_2 {
  items: Array<Toy>;
  nextLink?: string;
}

export interface Toy {
  id: bigint;
  petId: bigint;
  name: string;
}
