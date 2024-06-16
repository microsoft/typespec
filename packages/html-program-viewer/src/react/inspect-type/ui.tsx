import type { Entity, Type } from "@typespec/compiler";
import { getTypeName } from "@typespec/compiler";
import { useCallback, type FunctionComponent, type ReactElement, type ReactNode } from "react";
import { isNamedUnion } from "../../utils.js";
import { KeyValueSection, Literal, Mono, TypeKind } from "../common.js";
import { useProgram } from "../program-context.js";
import { getPropertyRendering, type EntityPropertyConfig } from "../type-config.js";
import { useTreeNavigator } from "../use-tree-navigation.js";
import { inspect } from "./inspect-js.js";
import style from "./ui.module.css";

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
  readonly nameAsKey?: boolean;
}

const EntityUI: FunctionComponent<EntityUIProps> = ({ entity, nameAsKey }) => {
  switch (entity.entityKind) {
    case "Type":
      return <TypeUI type={entity} nameAsKey={nameAsKey} />;
    default:
      return null;
  }
};

const TypeUI: FunctionComponent<{ type: Type; nameAsKey?: boolean }> = ({ type, nameAsKey }) => {
  const nav = useTreeNavigator();

  const navToType = useCallback(() => nav.navToType(type), [nav.navToType, type]);
  const name = (
    <span className={style["type-name"]}>{"name" in type ? type.name?.toString() : ""}</span>
  );
  const typeKind = <TypeKind type={type} />;
  return (
    <div>
      <div className={style["type-ui-header"]} onClick={navToType}>
        {nameAsKey ? (
          <>
            {name}: {typeKind}
          </>
        ) : (
          <>
            {typeKind} {name}
          </>
        )}
      </div>
      <EntityProperties entity={type} />
    </div>
  );
};

const NamedTypeRef: FunctionComponent<{ type: NamedType }> = ({ type }) => {
  const nav = useTreeNavigator();

  const navToType = useCallback(() => {
    nav.navToType(type);
  }, [nav.navToType, type]);
  return (
    <a className={style["named-type-ref"]} onClick={navToType}>
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

const JsValue = ({ value }: { value: any }) => {
  return <Mono className={style["js-value"]}>{value.toString()}</Mono>;
};

export const TypeData: FunctionComponent<{ type: Type }> = ({ type }) => {
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
  const props = Object.entries(type)
    .map(([key, value]) => {
      const action = getPropertyRendering(type as any, key);
      if (action === undefined || action === "skip") {
        return undefined;
      }
      return <EntityProperty key={key} name={key} value={value} action={action} />;
    })
    .filter((x): x is any => Boolean(x));

  return <KeyValueSection>{props}</KeyValueSection>;
};

interface EntityPropertyProps {
  name: string;
  value: any;
  action: EntityPropertyConfig;
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
    const renderRef = action === "ref" || action === "parent";
    return renderRef ? <EntityReference entity={x} /> : <EntityUI entity={x} />;
  };
  const renderInList = (x: Entity) => {
    const renderRef = action === "ref" || action === "parent";
    return renderRef ? <EntityReference entity={x} /> : <EntityUI entity={x} nameAsKey />;
  };

  if (value === undefined) {
    return null;
  } else if (value.entityKind) {
    return render(value);
  } else if (
    typeof value === "object" &&
    "entries" in value &&
    typeof value.entries === "function"
  ) {
    return <ItemList items={value} render={renderInList} />;
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
    <KeyValueSection>
      {[...props.items.entries()].map(([k, v], i) => (
        <li key={typeof k === "symbol" ? i : k}>{props.render(v)}</li>
      ))}
    </KeyValueSection>
  );
};
