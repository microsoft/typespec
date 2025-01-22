import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Client } from "../utils/client-discovery.js";
import { ClientContext } from "./client-context/client-context.jsx";
import { ClientOperations } from "./client-operation.jsx";

export interface OperationsDirectoryProps {
  client: Client;
  children?: ay.Children;
}

export function OperationsDirectory(props: OperationsDirectoryProps) {
  // If it is the root client, we don't need to create a directory
  return <>
       <ClientOperations client={props.client} />
       <ClientContext client={props.client} />
       <SubClients client={props.client} />
    </>;
}

export interface SubClientsProps {
  client: Client;
}

export function SubClients(props: SubClientsProps) {
  const subClients = props.client.subClients;

  return ay.mapJoin(subClients, (subClient) => {
    const namePolicy = ts.useTSNamePolicy();
    const subClientName = namePolicy.getName(subClient.name, "variable");
    return <ay.SourceDirectory path={subClientName}>
        <ClientOperations client={subClient} />
        <ClientContext client={subClient} />
        <SubClients client={subClient} />
    </ay.SourceDirectory>;
  });
}
