import type { Interface, Namespace } from "@typespec/compiler";
import type { HttpOperation } from "@typespec/http";

/**
 * A namespace or interface viewed as a client, before its operations and child clients are collected.
 * The client typekit uses this lightweight descriptor; {@link Client} adds the traversable library graph.
 */
export interface InternalClient {
  /** Discriminant for client descriptors, distinct from the underlying TypeSpec type's kind. */
  kind: "Client";
  /** Client name, with a `Client` suffix added when the source name does not already have one. */
  name: string;
  /** Source namespace or interface whose operations belong directly to this client. */
  type: Namespace | Interface;
  /** Namespace used to resolve HTTP service metadata, including authentication and servers. */
  service: Namespace;
}

/** A collected client with its own operations and links to the rest of the client-library graph. */
export interface Client extends InternalClient {
  /** Operations declared directly on this client, excluding operations on its children. */
  operations: ClientOperation[];
  /** Immediate child clients; traverse these recursively to visit the full hierarchy. */
  subClients: Client[];
  /** Containing client in the collected hierarchy, or undefined for a top-level client. */
  parent?: Client;
}

/** Associates a resolved HTTP operation with the collected client that owns it. */
export interface ClientOperation {
  /** Discriminant for an operation in the client-library graph. */
  kind: "ClientOperation";
  /** Original TypeSpec operation name, before any language-specific naming policy is applied. */
  name: string;
  /** HTTP metadata for the source operation, including its request and response shapes. */
  httpOperation: HttpOperation;
  /** Owning client, whose `operations` array contains this entry. */
  client: Client;
}

/** Identifies a type by name and library without embedding its TypeSpec declaration. */
export interface ReferencedType {
  /** Discriminant for a library-qualified reference rather than a collected declaration. */
  kind: "ReferencedType";
  /** Type name to resolve within the referenced library. */
  name: string;
  /** Library identifier that qualifies the type name. */
  library: string;
}
