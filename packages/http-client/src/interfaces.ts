import { Interface, ModelProperty, Namespace, Operation } from "@typespec/compiler";
import { HttpOperation } from "@typespec/http";

export interface InternalClient {
  kind: "Client";
  name: string;
  type: Namespace | Interface;
  service: Namespace;
}

export interface Client extends InternalClient {
  operations: ClientOperation[];
  subClients: Client[];
  parent?: Client;
}

export interface ClientOperation {
  kind: "ClientOperation";
  name: string;
  httpOperation: HttpOperation;
  client: Client;
}

export interface ReferencedType {
  kind: "ReferencedType";
  name: string;
  library: string;
}

export interface ClientV2 {
  kind: "client";
  /**
   * The name of the client.
   */
  name: string;
  /**
   * The type that the client is based on, which can be a Namespace or Interface.
   */
  type: Namespace | Interface;
  /**
   * Operations that belong to this client
   */
  operations: Operation[];
  /**
   * If this client is a sub-client, the parent client.
   */
  parent?: ClientV2;
  /**
   * Sub-clients that are part of this client.
   */
  subClients: ClientV2[];
}

export interface ClientInitialization {
  kind: "ClientInitialization";
  parameters: ModelProperty[];
}

export type ClientNamePolicy = (client: ClientV2) => string;
