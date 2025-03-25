import { Children } from "@alloy-js/core";
import { unsafe_Mutator } from "@typespec/compiler/experimental";
import { createClientLibrary } from "../client-library.js";
import { ClientLibraryContext } from "../context/client-library-context.js";
import { PropertyAccessPolicyContext } from "../context/property-access-policy-context.js";
import { PropertyAccessPolicy } from "../property-access-policy.js";

/**
 * Props for the ClientLibrary component
 */
export interface ClientLibraryProps {
  /**
   * Optional operation mutators to be applied
   */
  operationMutators?: unsafe_Mutator[];

  /**
   * Policy controlling how property access is formatted
   * If not provided, uses the default dot notation policy
   */
  propertyAccessPolicy?: PropertyAccessPolicy;

  children?: Children;
}

/**
 * Client library component that provides context for code generation
 */
export function ClientLibrary(props: ClientLibraryProps) {
  const clientLibrary = createClientLibrary({ operationMutators: props.operationMutators });
  const policy = props.propertyAccessPolicy;

  return (
    <ClientLibraryContext.Provider value={clientLibrary}>
      <PropertyAccessPolicyContext.Provider value={policy}>
        {props.children}
      </PropertyAccessPolicyContext.Provider>
    </ClientLibraryContext.Provider>
  );
}
