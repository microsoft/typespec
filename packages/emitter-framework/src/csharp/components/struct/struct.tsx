import { For, type Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { isVoidType, type Model } from "@typespec/compiler";
import { useTsp } from "../../../core/index.js";
import { Property } from "../property/property.jsx";
import { getDocComments } from "../utils/doc-comments.jsx";
import { declarationRefkeys } from "../utils/refkey.js";

export interface StructDeclarationProps extends Omit<cs.StructDeclarationProps, "name"> {
  /** Set an alternative name for the Struct. Otherwise default to the type name. */
  name?: string;
  /** Type to use to create this Struct. */
  type: Model;
  /** If set the property will add the json serialization attributes(using System.Text.Json). */
  jsonAttributes?: boolean;
}

interface StructPropertiesProps {
  type: Model;
  /** If set the property will add the json serialization attributes(using System.Text.Json). */
  jsonAttributes?: boolean;
}

export function StructDeclaration(props: StructDeclarationProps): Children {
  const { $ } = useTsp();

  if (props.type.baseModel) {
    // TODO: support flatten inheritance for structs automatically?
    throw new Error(
      `Inherit relationship found for type '${props.type.name}' which is not supported in struct.`,
    );
  }

  const namePolicy = cs.useCSharpNamePolicy();
  const structName = props.name ?? namePolicy.getName(props.type.name, "struct");

  const refkeys = declarationRefkeys(props.refkey, props.type)[0]; // TODO: support multiple refkeys for declarations in alloy

  return (
    <>
      <cs.StructDeclaration
        {...props}
        name={structName}
        refkey={refkeys}
        doc={getDocComments($, props.type)}
      >
        <StructProperties type={props.type} jsonAttributes={props.jsonAttributes} />
      </cs.StructDeclaration>
    </>
  );
}

function StructProperties(props: StructPropertiesProps): Children {
  // Ignore 'void' type properties which is not valid in csharp
  const properties = Array.from(props.type.properties.entries()).filter(
    ([_, p]) => !isVoidType(p.type),
  );
  return (
    <For each={properties} doubleHardline>
      {([name, property]) => <Property type={property} jsonAttributes={props.jsonAttributes} />}
    </For>
  );
}
