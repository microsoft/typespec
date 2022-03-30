import {
  ModelType,
  ModelTypeProperty,
  NamespaceType,
  OperationType,
  Program,
  Type,
} from "@cadl-lang/compiler";
import React, { FunctionComponent, useContext } from "react";
import ReactDOMServer from "react-dom/server";
import { inspect } from "util";
import { Group, Section } from "./common.js";

function expandNamespaces(namespace: NamespaceType): NamespaceType[] {
  return [namespace, ...[...namespace.namespaces.values()].flatMap(expandNamespaces)];
}

const ProgramContext = React.createContext<Program>({} as any);

export function renderProgram(program: Program) {
  const root = program.checker!.getGlobalNamespaceType();
  const namespaces = expandNamespaces(root);
  return ReactDOMServer.renderToString(
    <ProgramContext.Provider value={program}>
      {namespaces.map((namespace) => (
        <Namespace namespace={namespace} key={program.checker!.getNamespaceString(namespace)} />
      ))}
    </ProgramContext.Provider>
  );
}

const Namespace: FunctionComponent<{ namespace: NamespaceType }> = ({ namespace }) => {
  const program = useContext(ProgramContext);
  const name = program.checker!.getNamespaceString(namespace) || "<root>";
  return (
    <Section title={`namespace: ${name}`}>
      <Section title="Operations" hide={namespace.operations.size === 0}>
        {[...namespace.operations.entries()].map(([k, v]) => (
          <Operation operation={v} key={k} />
        ))}
      </Section>

      <Section title="Models" hide={namespace.models.size === 0}>
        {[...namespace.models.entries()].map(([k, v]) => (
          <Model model={v} key={k} />
        ))}
      </Section>
    </Section>
  );
};

const Operation: FunctionComponent<{ operation: OperationType }> = ({ operation }) => {
  return <Group>{operation.name}</Group>;
};

const Model: FunctionComponent<{ model: ModelType }> = ({ model }) => {
  return (
    <Section title={model.name}>
      <ModelProperties model={model} />
    </Section>
  );
};
const ModelProperties: FunctionComponent<{ model: ModelType }> = ({ model }) => {
  if (model.properties.size === 0) {
    return <div></div>;
  }
  return (
    <table>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Data</th>
      </tr>
      {[...model.properties.entries()].map(([k, v]) => (
        <ModelProperty property={v} key={k} />
      ))}
    </table>
  );
};

const ModelProperty: FunctionComponent<{ property: ModelTypeProperty }> = ({ property }) => {
  return (
    <tr>
      <td> {property.name}</td>
      <td>{(property.type as any).name}</td>
      <td>
        <TypeData type={property} />
      </td>
    </tr>
  );
};

const TypeData: FunctionComponent<{ type: Type }> = ({ type }) => {
  const program = useContext(ProgramContext);
  const entries = [...program.stateMaps.entries()]
    .map(([k, v]) => [k, v.get(type)])
    .filter(([k, v]) => !!v);
  if (entries.length === 0) {
    return null;
  }
  return (
    <table>
      <tr>
        <th>Key</th>
        <th>Value</th>
      </tr>
      {entries.map(([k, v], i) => (
        <tr key={i}>
          <td>{k.toString()}</td>
          <td>{inspect(v, { showHidden: false })}</td>
        </tr>
      ))}
    </table>
  );
};
