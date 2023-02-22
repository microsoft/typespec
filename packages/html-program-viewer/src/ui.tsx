import { css } from "@emotion/react";
import {
  Enum,
  EnumMember,
  getNamespaceFullName,
  getTypeName,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  Scalar,
  Type,
  Union,
  UnionVariant,
} from "@typespec/compiler";
import React, { FunctionComponent, ReactElement, useContext } from "react";
import ReactDOMServer from "react-dom/server";
import { KeyValueSection, Literal } from "./common.js";
import { inspect } from "./inspect.js";
import { TypeUIBase, TypeUIBaseProperty } from "./type-ui-base.js";
import { getIdForType, isNamedUnion } from "./utils.js";

function expandNamespaces(namespace: Namespace): Namespace[] {
  return [namespace, ...[...namespace.namespaces.values()].flatMap(expandNamespaces)];
}

const ProgramContext = React.createContext<Program>({} as any);

export function renderProgram(program: Program) {
  const html = ReactDOMServer.renderToString(<TypeSpecProgramViewer program={program} />);
  return html;
}

export interface TypeSpecProgramViewerProps {
  program: Program;
}

const ProgramViewerStyles = css({
  fontFamily: "monospace",
  backgroundColor: "#f3f3f3",
  li: {
    margin: 0,
    listStyle: "none",
    position: "relative",
  },
});

export const TypeSpecProgramViewer: FunctionComponent<TypeSpecProgramViewerProps> = ({
  program,
}) => {
  const root = program.checker!.getGlobalNamespaceType();
  const namespaces = expandNamespaces(root);
  return (
    <ProgramContext.Provider value={program}>
      <div css={ProgramViewerStyles}>
        <ul css={{ padding: "0 0 0 10px", margin: 0 }}>
          {namespaces.map((namespace) => (
            <li key={getNamespaceFullName(namespace)}>
              <NamespaceUI type={namespace} />
            </li>
          ))}
        </ul>
      </div>
    </ProgramContext.Provider>
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
    <KeyValueSection>
      {[...props.items.entries()].map(([k, v]) => (
        <li key={k}>{props.render(v)}</li>
      ))}
    </KeyValueSection>
  );
};

type NamedType = Type & { name: string };
const omittedProps = [
  "kind",
  "name",
  "node",
  "symbol",
  "namespace",
  "templateNode",
  "templateArguments",
  "templateMapper",
  "instantiationParameters",
  "decorators",
  "projectionBase",
  "projectionsByName",
  "projectionSource",
  "projector",
  "projections",
] as const;
const omittedPropsSet = new Set(omittedProps);
type OmittedProps = (typeof omittedProps)[number];
type NamedTypeUIProps<T extends NamedType> = {
  type: T;
  properties: Record<Exclude<keyof T, OmittedProps>, "skip" | "ref" | "nested" | "value">;
  name?: string;
};

const NamedTypeUI = <T extends NamedType>({ type, name, properties }: NamedTypeUIProps<T>) => {
  name ??= type.name;
  const propsUI: TypeUIBaseProperty[] = Object.entries(type)
    .map(([key, value]) => {
      if (omittedPropsSet.has(key as any)) {
        return undefined;
      }
      const action = (properties as any)[key] as "skip" | "ref" | "nested";
      if (action === "skip") {
        return undefined;
      }

      const render = (x: any) =>
        action === "ref" ? <TypeReference type={value} /> : <TypeUI type={x} />;
      let valueUI;
      if (value === undefined) {
        valueUI = value;
      } else if (value.kind) {
        valueUI = render(value);
      } else if (value[Symbol.iterator]) {
        valueUI = <ItemList items={value} render={render} />;
      } else {
        valueUI = value;
      }
      return {
        name: key,
        value: valueUI,
      } satisfies TypeUIBaseProperty;
    })
    .filter((x): x is TypeUIBaseProperty => Boolean(x));
  return (
    <TypeUIBase type={type} name={name} properties={propsUI.concat([getDataProperty(type)])} />
  );
};

interface TypeUIProps {
  type: Type;
}

const TypeUI: FunctionComponent<TypeUIProps> = ({ type }) => {
  switch (type.kind) {
    case "Namespace":
      return <NamespaceUI type={type} />;
    case "Interface":
      return <InterfaceUI type={type} />;
    case "Operation":
      return <OperationUI type={type} />;
    case "Model":
      return <ModelUI type={type} />;
    case "Scalar":
      return <ScalarUI type={type} />;
    case "ModelProperty":
      return <ModelPropertyUI type={type} />;
    case "Union":
      return <UnionUI type={type} />;
    case "UnionVariant":
      return <UnionVariantUI type={type} />;
    case "Enum":
      return <EnumUI type={type} />;
    case "EnumMember":
      return <EnumMemberUI type={type} />;
    default:
      return null;
  }
};

const NamespaceUI: FunctionComponent<{ type: Namespace }> = ({ type }) => {
  const name = getNamespaceFullName(type) || "(global)";

  return (
    <NamedTypeUI
      name={name}
      type={type}
      properties={{
        namespaces: "skip",
        models: "nested",
        scalars: "nested",
        interfaces: "nested",
        operations: "nested",
        unions: "nested",
        enums: "nested",
        decoratorDeclarations: "nested",
        functionDeclarations: "nested",
      }}
    />
  );
};

const InterfaceUI: FunctionComponent<{ type: Interface }> = ({ type }) => {
  return (
    <NamedTypeUI
      type={type}
      properties={{
        operations: "nested",
        sourceInterfaces: "ref",
      }}
    />
  );
};

const OperationUI: FunctionComponent<{ type: Operation }> = ({ type }) => {
  return (
    <NamedTypeUI
      type={type}
      properties={{
        interface: "skip",
        parameters: "nested",
        returnType: "ref",
      }}
    />
  );
};

function getDataProperty(type: Type): TypeUIBaseProperty {
  return {
    name: "data",
    description: "in program.stateMap()",
    value: <TypeData type={type} />,
  };
}

const ModelUI: FunctionComponent<{ type: Model }> = ({ type }) => {
  return (
    <NamedTypeUI
      type={type}
      properties={{
        indexer: "skip",
        baseModel: "ref",
        derivedModels: "ref",
        properties: "nested",
      }}
    />
  );
};

const ScalarUI: FunctionComponent<{ type: Scalar }> = ({ type }) => {
  return (
    <NamedTypeUI
      type={type}
      properties={{
        baseScalar: "ref",
        derivedScalars: "ref",
      }}
    />
  );
};

const ModelPropertyUI: FunctionComponent<{ type: ModelProperty }> = ({ type }) => {
  return (
    <NamedTypeUI
      type={type}
      properties={{
        model: "skip",
        type: "ref",
        optional: "value",
        sourceProperty: "ref",
        default: "value",
      }}
    />
  );
};

const EnumUI: FunctionComponent<{ type: Enum }> = ({ type }) => {
  return (
    <NamedTypeUI
      type={type}
      properties={{
        members: "nested",
      }}
    />
  );
};

const EnumMemberUI: FunctionComponent<{ type: EnumMember }> = ({ type }) => {
  return (
    <NamedTypeUI
      type={type}
      properties={{
        enum: "skip",
        sourceMember: "ref",
        value: "value",
      }}
    />
  );
};

const UnionUI: FunctionComponent<{ type: Union }> = ({ type }) => {
  if (!isNamedUnion(type)) {
    return <></>;
  }
  return (
    <NamedTypeUI
      type={type}
      properties={{
        expression: "skip",
        options: "skip",
        variants: "nested",
      }}
    />
  );
};

const UnionVariantUI: FunctionComponent<{ type: UnionVariant }> = ({ type }) => {
  if (typeof type.name === "symbol") {
    return <></>;
  }
  return (
    <NamedTypeUI
      type={type as UnionVariant & { name: string }}
      properties={{
        union: "skip",
        type: "ref",
      }}
    />
  );
};

const NamedTypeRef: FunctionComponent<{ type: NamedType }> = ({ type }) => {
  const id = getIdForType(type);
  const href = `#${id}`;
  return (
    <a
      css={{
        color: "#268bd2",
        textDecoration: "none",

        "&:hover": {
          textDecoration: "underline",
        },
      }}
      href={href}
      title={type.kind + ": " + id}
    >
      {getTypeName(type)}
    </a>
  );
};
const TypeReference: FunctionComponent<{ type: Type }> = ({ type }) => {
  switch (type.kind) {
    case "Namespace":
    case "Operation":
    case "Interface":
    case "Enum":
    case "ModelProperty":
    case "Scalar":
      return <NamedTypeRef type={type} />;
    case "Model":
      if (type.name === "") {
        return (
          <KeyValueSection>
            <TypeUI type={type} />
          </KeyValueSection>
        );
      } else {
        return <NamedTypeRef type={type} />;
      }
    case "Union":
      if (isNamedUnion(type)) {
        return <NamedTypeRef type={type} />;
      } else {
        return (
          <>
            {[...type.variants.values()].map((variant, i) => {
              return (
                <span key={i}>
                  <TypeReference type={variant.type} />
                  {i < type.variants.size - 1 ? " | " : ""}
                </span>
              );
            })}
          </>
        );
      }

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
    .map(([k, v]) => [k, v.get(undefined)?.get(type) as any])
    .filter(([k, v]) => !!v);
  if (entries.length === 0) {
    return null;
  }
  return (
    <KeyValueSection>
      {entries.map(([k, v], i) => (
        <div css={{ display: "flex" }} key={i}>
          <div css={{ color: "#333", marginRight: "5px" }}>{k.toString()}:</div>{" "}
          <div>{inspect(v)}</div>
        </div>
      ))}
    </KeyValueSection>
  );
};
