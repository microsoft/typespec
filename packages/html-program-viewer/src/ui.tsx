import {
  Enum,
  EnumMember,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  Type,
  Union,
} from "@cadl-lang/compiler";
import React, { FunctionComponent, ReactElement, useContext } from "react";
import ReactDOMServer from "react-dom/server";
import { ServerStyleSheet } from "styled-components";
import { Item, Literal, styled } from "./common.js";
import { inspect } from "./inspect.js";

function expandNamespaces(namespace: Namespace): Namespace[] {
  return [namespace, ...[...namespace.namespaces.values()].flatMap(expandNamespaces)];
}

const ProgramContext = React.createContext<Program>({} as any);

export function renderProgram(program: Program) {
  const sheet = new ServerStyleSheet();
  const html = ReactDOMServer.renderToString(
    sheet.collectStyles(<CadlProgramViewer program={program} />)
  );
  const styleTags = sheet.getStyleTags();
  return styleTags + "\n" + html;
}

export interface CadlProgramViewerProps {
  program: Program;
}

const ProgramViewerStyle = styled.div`
  font-family: monospace;
  background-color: #f3f3f3;

  ul {
    margin: 0;
    padding-left: 20px;
    overflow: auto;
  }

  li {
    margin: 0;
    list-style: none;
    position: relative;
  }
`;

export const CadlProgramViewer: FunctionComponent<CadlProgramViewerProps> = ({ program }) => {
  const root = program.checker!.getGlobalNamespaceType();
  const namespaces = expandNamespaces(root);
  return (
    <ProgramContext.Provider value={program}>
      <ProgramViewerStyle>
        <ul>
          {namespaces.map((namespace) => (
            <li key={program.checker!.getNamespaceString(namespace)}>
              <Namespace type={namespace} />
            </li>
          ))}
        </ul>
      </ProgramViewerStyle>
    </ProgramContext.Provider>
  );
};

export interface TypeUIProperty {
  name: string;
  value: any;
  description?: string;
}
export interface TypeUIProps {
  type: Type;
  name: string;
  /**
   * Alternate id
   * @default getIdForType(type)
   */
  id?: string;
  properties: TypeUIProperty[];
}

const PropName = styled.span`
  color: #9c5d27;
`;
const PropValue = styled.span``;

const TypeType = styled.span`
  display: inline;
  color: #7a3e9d;
  margin-right: 5px;
`;

const TypeName = styled.span`
  display: inline;
  color: #333333;
`;
export const TypeUI: FunctionComponent<TypeUIProps> = (props) => {
  const program = useContext(ProgramContext);
  const id = props.id ?? getIdForType(program, props.type);
  const properties = props.properties.map((prop) => {
    return (
      <li key={prop.name}>
        <PropName title={prop.description}>{prop.name}</PropName>:{" "}
        <PropValue>{prop.value}</PropValue>
      </li>
    );
  });
  return (
    <div>
      <div id={id}>
        <TypeType>{props.type.kind}</TypeType>
        <TypeName>{props.name}</TypeName>
      </div>
      <ul>{properties}</ul>
    </div>
  );
};

export interface ItemListProps<T> {
  items: Map<string, T> | T[];
  render: (t: T) => ReactElement<any, any> | null;
}

export const ItemList = <T extends object>(props: ItemListProps<T>) => {
  if (Array.isArray(props.items)) {
    if (props.items.length === 0) {
      return <>{"[]"}</>;
    }
  } else {
    if (props.items.size === 0) {
      return <>{"{}"}</>;
    }
  }
  return (
    <ul>
      {[...props.items.entries()].map(([k, v]) => (
        <li key={k}>{props.render(v)}</li>
      ))}
    </ul>
  );
};

const Namespace: FunctionComponent<{ type: Namespace }> = ({ type }) => {
  const program = useContext(ProgramContext);
  const name = program.checker!.getNamespaceString(type) || "<root>";

  const properties = [
    {
      name: "enums",
      value: <ItemList items={type.enums} render={(x) => <Enum type={x} />} />,
    },
    {
      name: "models",
      value: <ItemList items={type.models} render={(x) => <Model type={x} />} />,
    },
    {
      name: "interfaces",
      value: <ItemList items={type.interfaces} render={(x) => <Interface type={x} />} />,
    },
    {
      name: "operations",
      value: <ItemList items={type.operations} render={(x) => <Operation type={x} />} />,
    },
    {
      name: "unions",
      value: <ItemList items={type.unions} render={(x) => <Union type={x} />} />,
    },
  ];
  return <TypeUI type={type} name={name} properties={properties} />;
};

const Interface: FunctionComponent<{ type: Interface }> = ({ type }) => {
  const properties = [
    {
      name: "operations",
      value: <ItemList items={type.operations} render={(x) => <Operation type={x} />} />,
    },
    getDataProperty(type),
  ];
  return <TypeUI type={type} name={type.name} properties={properties} />;
};

const Operation: FunctionComponent<{ type: Operation }> = ({ type }) => {
  const properties = [
    {
      name: "parameters",
      value: <Model type={type.parameters} />,
    },
    {
      name: "returnType",
      value: <TypeReference type={type.returnType} />,
    },
    getDataProperty(type),
  ];
  return <TypeUI type={type} name={type.name} properties={properties} />;
};

function getDataProperty(type: Type): TypeUIProperty {
  return {
    name: "data",
    description: "in program.stateMap()",
    value: <TypeData type={type} />,
  };
}
const Model: FunctionComponent<{ type: Model }> = ({ type }) => {
  const program = useContext(ProgramContext);
  const id = getIdForType(program, type);
  const properties = [
    {
      name: "properties",
      value: <ItemList items={type.properties} render={(x) => <ModelProperty type={x} />} />,
    },
    getDataProperty(type),
  ];
  return <TypeUI type={type} name={type.name} id={id} properties={properties} />;
};

const ModelProperty: FunctionComponent<{ type: ModelProperty }> = ({ type }) => {
  const program = useContext(ProgramContext);
  const id = getIdForType(program, type);
  const properties = [
    {
      name: "type",
      value: <TypeReference type={type.type} />,
    },
    {
      name: "optional",
      value: type.optional,
    },
    getDataProperty(type),
  ];
  return <TypeUI type={type} name={type.name} id={id} properties={properties} />;
};

const Enum: FunctionComponent<{ type: Enum }> = ({ type }) => {
  const program = useContext(ProgramContext);
  const id = getIdForType(program, type);
  const properties = [
    {
      name: "members",
      value: <ItemList items={type.members} render={(x) => <EnumMember type={x} />} />,
    },
    getDataProperty(type),
  ];
  return <TypeUI type={type} name={type.name} id={id} properties={properties} />;
};

const EnumMember: FunctionComponent<{ type: EnumMember }> = ({ type }) => {
  const program = useContext(ProgramContext);
  const id = getIdForType(program, type);
  const properties = [
    {
      name: "value",
      value: type.value,
    },
    getDataProperty(type),
  ];
  return <TypeUI type={type} name={type.name} id={id} properties={properties} />;
};

const Union: FunctionComponent<{ type: Union }> = ({ type }) => {
  const program = useContext(ProgramContext);

  return (
    <Item title={type.name ?? "<unamed union>"} id={getIdForType(program, type)}>
      <TypeData type={type} />

      <UnionOptions type={type} />
    </Item>
  );
};

const UnionOptions: FunctionComponent<{ type: Union }> = ({ type }) => {
  if (type.options.length === 0) {
    return <div></div>;
  }
  return (
    <ul>
      {[...type.options.entries()].map(([k, v]) => (
        <li key={k}>
          <TypeReference type={v} />
        </li>
      ))}
    </ul>
  );
};

function getIdForType(program: Program, type: Type) {
  switch (type.kind) {
    case "Namespace":
      return program.checker!.getNamespaceString(type);
    case "Model":
    case "Enum":
    case "Union":
    case "Operation":
    case "Interface":
      return `${program.checker!.getNamespaceString(type.namespace)}.${type.name}`;
    default:
      return undefined;
  }
}

const TypeRef = styled.a`
  color: #268bd2;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

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
        <TypeRef href={href} title={type.kind + ": " + id}>
          {type.name}
        </TypeRef>
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

const TypeDataEntry = styled.div`
  display: flex;
`;
const TypeDataKey = styled.div`
  color: #333;
  margin-right: 5px;
`;
const TypeDataValue = styled.div``;
const TypeData: FunctionComponent<{ type: Type }> = ({ type }) => {
  const program = useContext(ProgramContext);
  const entries = [...program.stateMaps.entries()]
    .map(([k, v]) => [k, v.get(type)])
    .filter(([k, v]) => !!v);
  if (entries.length === 0) {
    return null;
  }
  return (
    <ul>
      {entries.map(([k, v], i) => (
        <TypeDataEntry key={i}>
          <TypeDataKey>{k.toString()}:</TypeDataKey> <TypeDataValue>{inspect(v)}</TypeDataValue>
        </TypeDataEntry>
      ))}
    </ul>
  );
};
