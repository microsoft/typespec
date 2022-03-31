import {
  EnumMemberType,
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
import { Item, Literal, Section } from "./common.js";

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
      <Section title="Interfaces" hide={namespace.interfaces.size === 0}>
        {[...namespace.interfaces.entries()].map(([k, v]) => (
          <Interface type={v} key={k} />
        ))}
      </Section>

      <Section title="Models" hide={namespace.models.size === 0}>
        {[...namespace.models.entries()].map(([k, v]) => (
          <Model model={v} key={k} />
        ))}
      </Section>
      <Section title="Enums" hide={namespace.enums.size === 0}>
        {[...namespace.enums.entries()].map(([k, v]) => (
          <Enum type={v} key={k} />
        ))}
      </Section>
      <Section title="Unions" hide={namespace.unions.size === 0}>
        {[...namespace.unions.entries()].map(([k, v]) => (
          <Union type={v} key={k} />
        ))}
      </Section>
    </Section>
  );
};

const DataSection: FunctionComponent<{ type: Type }> = ({ type }) => {
  return (
    <Section title="Data">
      <TypeData type={type} />
    </Section>
  );
};

const Interface: FunctionComponent<{ type: InterfaceType }> = ({ type }) => {
  return (
    <Item title={type.name}>
      <DataSection type={type} />
      <Section title="Operations" hide={type.operations.size === 0}>
        {[...type.operations.entries()].map(([k, v]) => (
          <Operation operation={v} key={k} />
        ))}
      </Section>
    </Item>
  );
};

const Operation: FunctionComponent<{ operation: OperationType }> = ({ operation }) => {
  return (
    <Item title={operation.name}>
      <DataSection type={operation} />
      <Section title="Params">
        <ModelProperties model={operation.parameters} />
      </Section>
      <Section title="Return Type">
        <TypeReference type={operation.returnType} />
      </Section>
    </Item>
  );
};

const Model: FunctionComponent<{ model: ModelType }> = ({ model }) => {
  const program = useContext(ProgramContext);

  return (
    <Item title={model.name} id={getIdForType(program, model)}>
      <DataSection type={model} />

      <ModelProperties model={model} />
    </Item>
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

const Enum: FunctionComponent<{ type: EnumType }> = ({ type }) => {
  const program = useContext(ProgramContext);

  return (
    <Item title={type.name} id={getIdForType(program, type)}>
      <DataSection type={type} />

      <EnumMembers type={type} />
    </Item>
  );
};

const EnumMembers: FunctionComponent<{ type: EnumType }> = ({ type }) => {
  if (type.members.length === 0) {
    return <div></div>;
  }
  return (
    <table>
      <tr>
        <th>Name</th>
        <th>Value</th>
        <th>Data</th>
      </tr>
      {[...type.members.entries()].map(([k, v]) => (
        <EnumMember member={v} key={k} />
      ))}
    </table>
  );
};
const EnumMember: FunctionComponent<{ member: EnumMemberType }> = ({ member }) => {
  return (
    <tr>
      <td>{member.name}</td>
      <td>{member.value}</td>
      <td>
        <TypeData type={member} />
      </td>
    </tr>
  );
};

const Union: FunctionComponent<{ type: UnionType }> = ({ type }) => {
  const program = useContext(ProgramContext);

  return (
    <Item title={type.name ?? "<unamed union>"} id={getIdForType(program, type)}>
      <DataSection type={type} />

      <UnionOptions type={type} />
    </Item>
  );
};

const UnionOptions: FunctionComponent<{ type: UnionType }> = ({ type }) => {
  if (type.options.length === 0) {
    return <div></div>;
  }
  return (
    <ul>
      {[...type.options.entries()].map(([k, v]) => (
        <li key={k}>
          <TypeReference type={v}  />
        </li>
      ))}
    </ul>
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
