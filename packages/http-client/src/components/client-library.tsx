import { Children } from "@alloy-js/core";
import { unsafe_Mutator } from "@typespec/compiler/experimental";
import { createClientLibrary } from "../client-library.js";
import { ClientLibraryContext } from "../context/client-library-context.js";
import { PropertyAccessPolicy } from "../property-access-policy.js";
import { PropertyAccessPolicyContext } from "../context/property-access-policy-context.js";

export interface ClientLibraryProps {
  operationMutators?: unsafe_Mutator[];
  propertyAccessPolicy?: PropertyAccessPolicy;
  children?: Children;
}

export function ClientLibrary(props: ClientLibraryProps) {
  const clientLibrary = createClientLibrary({ operationMutators: props.operationMutators });
  return (
    <ClientLibraryContext.Provider value={clientLibrary}>
      <PropertyAccessPolicyContext.Provider value={props.propertyAccessPolicy}>
        {props.children}
      </PropertyAccessPolicyContext.Provider>
    </ClientLibraryContext.Provider>
  );
}
