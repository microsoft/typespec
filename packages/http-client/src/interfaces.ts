import { Interface, Namespace, Operation } from "@typespec/compiler";
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
  operation: Operation;
  httpOperation: HttpOperation;
  client: Client;
}

export interface ReferencedType {
  kind: "ReferencedType";
  name: string;
  library: string;
}
