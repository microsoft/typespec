export interface PetStoreContext {
  endpoint: string;
}
export interface PetStoreOptions {
  endpoint?: string;
}
export function createPetStoreContext(
  endpoint: string,
  options?: PetStoreOptions,
): PetStoreContext {
  return {
    endpoint,
  };
}
