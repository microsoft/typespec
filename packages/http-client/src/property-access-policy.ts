import { ModelProperty } from "@typespec/compiler";

/**
 * Metadata for a property in an access path
 */
export interface AccessPathSegment {
  segmentName: string | number;
  property: ModelProperty;
  parent?: ModelProperty;
}

/**
 * Policy that determines how property access strings are formatted
 * for code generation
 */
export interface PropertyAccessPolicy {
  /**
   * Builds an access path expression for a property
   * @param property - The HTTP property to build access for
   * @param metadata - Path segment metadata in order from root to leaf
   */
  fromatPropertyAccessExpression(metadata: AccessPathSegment[]): string;
}
