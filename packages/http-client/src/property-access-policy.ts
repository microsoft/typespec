import { ModelProperty } from "@typespec/compiler";
import { HttpProperty } from "@typespec/http";

export interface PropertyMetadata {
  name: string | number;
  property: ModelProperty;
  parent?: ModelProperty;
}
export interface PropertyAccessPolicy {
  getTopLevelAccess(property: HttpProperty): string;
  getNestedAccess(root: PropertyMetadata, metadata: PropertyMetadata[]): string;
}
