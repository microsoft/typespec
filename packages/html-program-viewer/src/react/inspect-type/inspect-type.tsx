import type { Entity, Type } from "@typespec/compiler";
import { getTypeName } from "@typespec/compiler";
import { useCallback, type FunctionComponent, type ReactElement, type ReactNode } from "react";
import { isNamedUnion } from "../../utils.js";
import { Literal, Mono, TypeKind } from "../common.js";
import { JsValue } from "../js-inspector/js-value/js-value.js";
import {
  getRenderingConfig,
  type PropertiesRendering,
  type PropertyRendering,
} from "../type-config.js";
import { useTreeNavigatorOptional } from "../use-tree-navigation.js";
import style from "./inspect-type.module.css";

type NamedType = Type & { name: string };

interface InspectTypeProps {
  readonly entity: Entity;
}

export const InspectType: FunctionComponent<InspectTypeProps> = ({ entity }) => {
  return (
    <Mono className={style["inspect-type"]}>
      <EntityProperties entity={entity} />
    </Mono>
  );
};
interface EntityUIProps {
  readonly entity: Entity;
}

const EntityUI: FunctionComponent<EntityUIProps> = ({ entity }) => {
  switch (entity.entityKind) {
    case "Type":
      return <TypeUI type={entity} />;
    default:
      return null;
  }
};

const TypeUI: FunctionComponent<{ type: Type }> = ({ type }) => {
  const nav = useTreeNavigatorOptional();

  const navToType = useCallback(() => nav?.navToType(type), [nav, type]);
  return (
    <div className={style["type-ui"]}>
      <div className={style["type-ui-header"]} onClick={nav && navToType}>
        <TypeKind type={type} />{" "}
        <span className={style["type-name"]}>{"name" in type ? type.name?.toString() : ""}</span>
      </div>
      <EntityProperties entity={type} />
    </div>
  );
};

const NamedTypeRef: FunctionComponent<{ type: NamedType }> = ({ type }) => {
  const nav = useTreeNavigatorOptional();

  const navToType = useCallback(() => {
    nav?.navToType(type);
  }, [nav, type]);
  return (
    <a className={style["named-type-ref"]} onClick={nav && navToType}>
      {getTypeName(type)}
    </a>
  );
};

const EntityReference = ({ entity }: { entity: Entity }) => {
  switch (entity.entityKind) {
    case "Type":
      return <TypeReference type={entity} />;
    default:
      return null;
  }
};

const ParentReference = ({ type }: { type: Type }) => {
  switch (type.kind) {
    case "Namespace":
    case "Operation":
    case "Interface":
    case "Enum":
    case "ModelProperty":
    case "Scalar":
    case "Model":
    case "Union":
      if (type.name !== undefined) {
        return <NamedTypeRef type={type as any} />;
      } else {
        return null;
      }
    default:
      return null;
  }
};

export const TypeReference: FunctionComponent<{ type: Type }> = ({ type }) => {
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
          <ul>
            <EntityUI entity={type} />
          </ul>
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
      return <span>Template Param: {(type as any).node.id.sv}</span>;
    case "String":
      return (
        <SimpleType type={type}>
          <Literal>"{type.value}"</Literal>
        </SimpleType>
      );
    case "Number":
    case "Boolean":
      return <SimpleType type={type}>{type.value.toString()}</SimpleType>;
    default:
      return null;
  }
};

const SimpleType = ({ type, children }: { type: Type; children: ReactNode }) => {
  return (
    <>
      <TypeKind type={type} /> {children}
    </>
  );
};

const EntityProperties = ({ entity }: { entity: Entity }) => {
  return <InspectObject value={entity} config={getRenderingConfig(entity)} />;
};
const InspectObject = ({
  value,
  config,
}: {
  value: object | undefined;
  config: PropertiesRendering<any> | null;
}) => {
  if (value === undefined) {
    return null;
  }
  const props = Object.entries(value)
    .map(([key, value]) => {
      const action = config?.[key];
      if (action === undefined || action === null || action.kind === "skip") {
        return undefined;
      }
      return <EntityProperty key={key} name={key} value={value} action={action} />;
    })
    .filter((x): x is any => Boolean(x));

  return <ul>{props}</ul>;
};

interface EntityPropertyProps {
  name: string;
  value: any;
  action: PropertyRendering<any>;
}
const EntityProperty = (props: EntityPropertyProps) => {
  return (
    <li>
      <span className={style["property"]}>{props.name}</span>:{" "}
      <span>
        <EntityPropertyValue {...props} />
      </span>
    </li>
  );
};

const EntityPropertyValue = ({ value, action }: EntityPropertyProps) => {
  const render = (x: Entity) => {
    if (action.kind === "parent") {
      return x.entityKind === "Type" ? <ParentReference type={x} /> : null;
    }
    const renderRef = action.kind === "ref";
    return renderRef ? <EntityReference entity={x} /> : <EntityUI entity={x} />;
  };

  if (action.kind === "nested") {
    return <InspectObject value={value} config={action.properties} />;
  }

  if (value === undefined) {
    return null;
  } else if (value.entityKind) {
    return render(value);
  } else if (
    typeof value === "object" &&
    "entries" in value &&
    typeof value.entries === "function"
  ) {
    return <ItemList items={value} render={render} />;
  } else {
    return <JsValue value={value} />;
  }
};

interface ItemListProps<T> {
  items: Map<string | symbol, T> | T[];
  render: (t: T) => ReactElement<any, any> | null;
}

const ItemList = <T extends object>(props: ItemListProps<T>) => {
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
      {[...props.items.entries()].map(([k, v], i) => (
        <li key={typeof k === "symbol" ? i : k}>{props.render(v)}</li>
      ))}
    </ul>
  );
};
