import {
  EnumType,
  InterfaceType,
  ModelType,
  ModelTypeProperty,
  NamespaceType,
  OperationType,
  Program,
  Type,
  UnionType,
} from "@cadl-lang/compiler";
import React, { FunctionComponent, useContext } from "react";
import ReactDOMServer from "react-dom/server";
import { inspect } from "util";
import { Group, Literal, Section } from "./common.js";

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
  const program = useContext(ProgramContext);

  return (
    <Section title={model.name} id={getIdForType(program, model)}>
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
      <td>
        <TypeReference type={property.type} />
      </td>
      <td>
        <TypeData type={property} />
      </td>
    </tr>
  );
};

function getIdForType(
  program: Program,
  type: NamespaceType | OperationType | ModelType | InterfaceType | EnumType | UnionType
) {
  return `${program.checker!.getNamespaceString(type.namespace)}.${type.name}`;
}

const TypeReference: FunctionComponent<{ type: Type }> = ({ type }) => {
  const program = useContext(ProgramContext);
  switch (type.kind) {
    case "Namespace":
    case "Operation":
    case "Interface":
    case "Enum":
    case "Model":
      const id = getIdForType(program, type);
      const href = `#${id}`;
      return (
        <a href={href} title={type.kind + ": " + id}>
          {type.name}
        </a>
      );
    case "Array":
      return (
        <>
          <TypeReference type={type.elementType} />
          {"[]"}
        </>
      );
    case "Union":
      return (
        <>
          {type.options.map((x, i) => {
            return (
              <span key={i}>
                <TypeReference type={x} />
                {i < type.options.length - 1 ? " | " : ""}
              </span>
            );
          })}
        </>
      );
    case "TemplateParameter":
      return <span>Template Param: {type.node.id.sv}</span>;
    case "String":
      return <Literal>"{type.value}"</Literal>;
    case "Number":
    case "Boolean":
      return <>{type.value}</>;
    default:
      return null;
  }
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
