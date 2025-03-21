import { ModelProperty } from "@typespec/compiler";

export interface PropertyMetadata { name: string | number; property: ModelProperty, parent?: ModelProperty }
export interface PropertyAccessPolicy {
  getTopLevelAccess(name: string | number, optional: boolean): string;
  getNestedAccess(
    root: string | number,
    metadata: PropertyMetadata[],
    rootOptional: boolean
  ): string;
}
