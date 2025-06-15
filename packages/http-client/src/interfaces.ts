import { Interface, Namespace, Operation } from "@typespec/compiler";
import { Authentication, HttpServer } from "@typespec/http";

export interface Client {
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
  parent?: Client;
  /**
   * Sub-clients that are part of this client.
   */
  subClients: Client[];
}

export type ClientEndpoint = HttpServer;

export interface ClientInitialization {
  kind: "ClientInitialization";
  endpoints?: ClientEndpoint[];
  authentication?: Authentication;
}

export type ClientNamePolicy = (client: Client) => string;
