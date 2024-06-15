import type { Entity, Type } from "@typespec/compiler";
import { getTypeName } from "@typespec/compiler";
import { type FunctionComponent, type ReactElement } from "react";
import { inspect } from "../../inspect.js";
import { getIdForType, isNamedUnion } from "../../utils.js";
import { KeyValueSection, Literal, Mono, TypeKind } from "../common.js";
import { useProgram } from "../program-context.js";
import { HiddenPropsSet, TypeConfig } from "../type-config.js";
import style from "./ui.module.css";

export interface ItemListProps<T> {
  items: Map<string | symbol, T> | T[];
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
      {[...props.items.entries()].map(([k, v], i) => (
        <li key={typeof k === "symbol" ? i : k}>{props.render(v)}</li>
      ))}
    </KeyValueSection>
  );
};

type NamedType = Type & { name: string };

interface TypeUIProps {
  readonly entity: Entity;
}

export const InspectType: FunctionComponent<TypeUIProps> = ({ entity }) => {
  return (
    <Mono className={style["inspect-type"]}>
      <EntityProperties entity={entity} />
    </Mono>
  );
};

const EntityUI: FunctionComponent<TypeUIProps> = ({ entity }) => {
  switch (entity.entityKind) {
    case "Type":
      return <TypeUI type={entity} />;
    default:
      return null;
  }
};

const TypeUI: FunctionComponent<{ type: Type }> = ({ type }) => {
  return (
    <div>
      <div>
        <TypeKind type={type} />
        <span className={style["type-name"]}>{"name" in type ? type.name?.toString() : ""}</span>
      </div>
      <EntityProperties entity={type} />
    </div>
  );
};

// function getDataProperty(type: Type): TypeUIBaseProperty {
//   return {
//     name: "data",
//     description: "in program.stateMap()",
//     value: <TypeData type={type} />,
//   };
// }

const NamedTypeRef: FunctionComponent<{ type: NamedType }> = ({ type }) => {
  const id = getIdForType(type);
  const href = `#${id}`;
  return (
    <a className={style["named-type-ref"]} href={href} title={type.kind + ": " + id}>
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
            <EntityUI entity={type} />
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
  const program = useProgram();
  const entries = [...program.stateMaps.entries()]
    .map(([k, v]) => [k, v.get(undefined)?.get(type) as any])
    .filter(([k, v]) => !!v);
  if (entries.length === 0) {
    return null;
  }
  return (
    <KeyValueSection>
      {entries.map(([k, v], i) => (
        <div key={i}>
          <div>{k.toString()}:</div> <div>{inspect(v)}</div>
        </div>
      ))}
    </KeyValueSection>
  );
};

const EntityProperties = ({ entity: type }: { entity: Entity }) => {
  console.log("Type", type);
  const properties = (TypeConfig as any)[(type as any).kind as any];
  const props = Object.entries(type)
    .map(([key, value]) => {
      if (HiddenPropsSet.has(key as any)) {
        return undefined;
      }
      const action = properties?.[key] as "skip" | "ref" | "nested";
      if (action === "skip" || action === undefined) {
        return undefined;
      }

      const render = (x: Entity) =>
        action === "ref" ? <TypeReference type={value} /> : <EntityUI entity={x} />;
      let valueUI;
      if (value === undefined) {
        valueUI = value;
      } else if (value.entityKind) {
        valueUI = render(value);
      } else if (
        typeof value === "object" &&
        "entries" in value &&
        typeof value.entries === "function"
      ) {
        valueUI = <ItemList items={value} render={render} />;
      } else {
        valueUI = value;
      }
      return {
        name: key,
        value: valueUI,
      };
    })
    .filter((x): x is any => Boolean(x));

  return (
    <KeyValueSection>
      {props.map((prop) => {
        return (
          <li key={prop.name}>
            <span title={prop.description} className={style["property"]}>
              {prop.name}
            </span>
            : <span>{prop.value}</span>
          </li>
        );
      })}
    </KeyValueSection>
  );
};
