import { code, For, List, namekey, refkey, type Children } from "@alloy-js/core";
import {
  Constructor,
  Field,
  Method,
  Property,
  StructDeclaration,
  useCSharpNamePolicy,
  type StructDeclarationProps,
} from "@alloy-js/csharp";
import type { Union } from "@typespec/compiler";
import { declarationRefkeys } from "../utils/refkey.js";

export interface EnumDeclarationProps extends Omit<StructDeclarationProps, "name"> {
  /** Union that should be rendered as an extensible enum struct */
  type: Union;
  /** Name override */
  name?: string;
}

/**
 * Render a struct designed to represent an extensible enum based on a TypeSpec union.
 */
export function ExtensibleEnumDeclaration(props: EnumDeclarationProps): Children {
  const { variants, kind } = getExtensibleEnumVariantsFromUnion(props.type);
  const refkeys = declarationRefkeys(props.refkey, props.type)[0];
  return (
    <ExtensibleEnumFromVariants
      {...props}
      refkey={refkeys}
      name={props.name ?? props.type.name ?? "Unnamed"}
      kind={kind}
      variants={variants}
    />
  );
}

function getExtensibleEnumVariantsFromUnion(union: Union): {
  kind: "string" | "int32";
  variants: ExtensibleEnumVariant[];
} {
  const variants: ExtensibleEnumVariant[] = [];
  const kinds = new Set<"string" | "int32">();
  for (const member of union.variants.values()) {
    switch (member.type.kind) {
      case "String":
        const name = typeof member.name === "string" ? member.name : member.type.value;
        variants.push({ name, value: member.type.value });
        kinds.add("string");
        break;
      case "Number":
        const numName =
          typeof member.name === "string" ? member.name : `NumberValue_${member.type.value}`;
        variants.push({ name: numName, value: member.type.value.toString() });
        kinds.add("int32");
        break;
      default:
        break; // Ignore other types
    }
  }
  if (kinds.size > 1) {
    throw new Error("ExtensibleEnumUnion cannot have mixed kinds of variants.");
  }
  return { kind: [...kinds][0], variants };
}

interface ExtensibleEnumVariant {
  name: string;
  value: string | number;
}

interface ExtensibleEnumFromVariantsProps extends Omit<StructDeclarationProps, "name"> {
  name: string;
  kind: "string" | "int32";
  variants: ExtensibleEnumVariant[];
}

function ExtensibleEnumFromVariants(props: ExtensibleEnumFromVariantsProps): Children {
  const valueRk = refkey();
  const constructorRk = refkey();
  const namepolicy = useCSharpNamePolicy();
  const name = namepolicy.getName(props.name, "struct");
  const type = props.kind === "string" ? "string" : "int";
  return (
    <StructDeclaration
      readonly // We want this readonly by default
      {...props}
      name={props.name}
      interfaceTypes={[`IEquatable<${name}>`]}
    >
      <List doubleHardline>
        <Field private readonly name="value" refkey={valueRk} type={type} />
        <Constructor refkey={constructorRk} parameters={[{ name: "value", type }]}>
          {valueRk} = value;
        </Constructor>
        <For each={props.variants}>
          {(x) => (
            <Property
              public
              static
              name={namepolicy.getName(x.name, "enum-member")}
              type={name}
              get
              initializer={code`new ${constructorRk}(${props.kind === "string" ? `@"${x.value}"` : x.value})`}
            />
          )}
        </For>
        <Method
          public
          name={namekey("Equals", { ignoreNameConflict: true })}
          parameters={[{ name: "other", type: name }]}
          returns="bool"
          expression
        >
          {props.kind === "string"
            ? code`string.Equals(${valueRk}, other.${valueRk}, StringComparison.InvariantCultureIgnoreCase)`
            : code`${valueRk} == other.${valueRk}`}
        </Method>
        <Method
          public
          override
          returns="bool"
          name="Equals"
          parameters={[{ name: "obj", type: "object?" }]}
          expression
        >
          {code`obj is ${name} other && Equals(other)`}
        </Method>
        <Method public override returns="int" name="GetHashCode" expression>
          {code`${valueRk} != null ? StringComparer.InvariantCultureIgnoreCase.GetHashCode(${valueRk}) : 0`}
        </Method>
        <Method public override name="ToString" returns="string" expression>
          {valueRk}
        </Method>
        <Method
          public
          static
          returns="bool"
          name={namekey("operator ==", { ignoreNamePolicy: true })}
          parameters={[
            { name: "left", type: name },
            { name: "right", type: name },
          ]}
          expression
        >
          {code`left.Equals(right)`}
        </Method>
        <Method
          public
          static
          returns="bool"
          name={namekey("operator !=", { ignoreNamePolicy: true })}
          parameters={[
            { name: "left", type: name },
            { name: "right", type: name },
          ]}
          expression
        >
          {code`!left.Equals(right)`}
        </Method>
      </List>
    </StructDeclaration>
  );
}
