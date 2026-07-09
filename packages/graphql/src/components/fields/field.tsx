import * as gql from "@pinterest/alloy-graphql";
import { type ModelProperty, getDeprecationDetails, isArrayModelType } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { resolveGraphQLTypeName } from "../../lib/graphql-type-name.js";
import { hasNullableElements, isNullable } from "../../lib/nullable.js";

export interface FieldProps {
  property: ModelProperty;
  isInput: boolean;
}

export function Field(props: FieldProps) {
  const { $, program } = useTsp();

  const doc = $.type.getDoc(props.property);
  const deprecation = getDeprecationDetails(program, props.property);
  const nullable = isNullable(props.property) || props.property.optional;
  const type = props.property.type;

  if (type.kind === "Model" && isArrayModelType(type)) {
    const elemNullable = hasNullableElements(props.property);
    const typeName = resolveGraphQLTypeName(type.indexer.value);

    if (props.isInput) {
      return (
        <gql.InputField
          name={props.property.name}
          type={typeName}
          nonNull={!elemNullable}
          description={doc}
          deprecated={deprecation?.message}
        >
          <gql.InputField.List nonNull={!nullable} />
        </gql.InputField>
      );
    }

    return (
      <gql.Field
        name={props.property.name}
        type={typeName}
        nonNull={!elemNullable}
        description={doc}
        deprecated={deprecation?.message}
      >
        <gql.Field.List nonNull={!nullable} />
      </gql.Field>
    );
  }

  if (props.isInput) {
    return (
      <gql.InputField
        name={props.property.name}
        type={resolveGraphQLTypeName(type)}
        nonNull={!nullable}
        description={doc}
        deprecated={deprecation?.message}
      />
    );
  }

  return (
    <gql.Field
      name={props.property.name}
      type={resolveGraphQLTypeName(type)}
      nonNull={!nullable}
      description={doc}
      deprecated={deprecation?.message}
    />
  );
}
