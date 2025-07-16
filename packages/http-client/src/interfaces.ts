import { Interface, Namespace } from "@typespec/compiler";
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
  endpoints: ClientEndpoint[];
  /**
   * The authentication to use for the client.
   * This can be undefined if no authentication is defined for the client or its parents.
   * The options property means that any of the authentication options can be used to authenticate.
   * Within options there is an array of auth schemes, ALL of them must be used to authenticate.
   */
  authentication?: Authentication;
}

export type ClientNamePolicy = (client: Client) => string;
