import { useTsp } from "#core/context/tsp-context.js";
import { code, For, List, refkey, type Children } from "@alloy-js/core";
import { Constructor, Field, Method, Property, StructDeclaration } from "@alloy-js/csharp";
import type { Union } from "@typespec/compiler";

export interface EnumDeclarationProps {
  type: Union;
  /** Name override */
  name?: string;
}

export function ExtensibleEnumDeclaration(props: EnumDeclarationProps): Children {
  const { $ } = useTsp();
  const variants: ExtensibleEnumVariant[] = getExtensibleEnumVariantsFromUnion(props.type);
  return (
    <ExtensibleEnumFromVariants
      name={props.name ?? props.type.name ?? "Unnamed"}
      variants={variants}
    />
  );
}

function getExtensibleEnumVariantsFromUnion(union: Union): ExtensibleEnumVariant[] {
  const variants: ExtensibleEnumVariant[] = [];
  for (const member of union.variants.values()) {
    switch (member.type.kind) {
      case "String":
        const name = typeof member.name === "string" ? member.name : member.type.value;
        variants.push({ name, value: member.type.value });
        break;
      // case "Number":
      //   variants.push({ name, value: member.type.value.toString() });
      //   break;
      default:
        break; // Ignore other types
    }
  }
  return variants;
}

interface ExtensibleEnumVariant {
  name: string;
  value: string | number;
}

interface ExtensibleEnumFromVariantsProps {
  name: string;
  variants: ExtensibleEnumVariant[];
}

function ExtensibleEnumFromVariants(props: ExtensibleEnumFromVariantsProps): Children {
  const valueRk = refkey();
  const constructorRk = refkey();
  return (
    <StructDeclaration
      public
      readonly
      partial
      name={props.name}
      interfaceTypes={[`IEquatable<${props.name}>`]}
    >
      <List doubleHardline>
        <Field private readonly name="_value" refkey={valueRk} type={"string"} />
        <Constructor refkey={constructorRk} parameters={[{ name: "value", type: "string" }]}>
          {valueRk} = value;
        </Constructor>
        <For each={props.variants}>
          {(x) => (
            <Property
              public
              static
              name={x.name}
              type={props.name}
              get
              initializer={code`new ${constructorRk}("${x.value}")`}
            />
          )}
        </For>

        <Method
          public
          name="Equals"
          parameters={[{ name: "other", type: props.name }]}
          returns="bool"
          expression
        >
          {code`string.Equals(${valueRk}, other.${valueRk}, StringComparison.InvariantCultureIgnoreCase)`}
        </Method>
        <Method public override name="ToString" returns="string" expression>
          {valueRk}
        </Method>
      </List>
    </StructDeclaration>
  );
}
