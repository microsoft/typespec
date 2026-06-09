import { type Operation, getDeprecationDetails, isArrayModelType } from "@typespec/compiler";
import * as gql from "@alloy-js/graphql";
import { useTsp } from "@typespec/emitter-framework";
import { resolveGraphQLTypeName } from "../../lib/graphql-type-name.js";
import { hasNullableElements, isNullable } from "../../lib/nullable.js";

export interface OperationFieldProps {
  operation: Operation;
}

export function OperationField(props: OperationFieldProps) {
  const { $, program } = useTsp();

  const doc = $.type.getDoc(props.operation);
  const deprecation = getDeprecationDetails(program, props.operation);
  const returnType = props.operation.returnType;
  const nullable = isNullable(props.operation);
  const params = Array.from(props.operation.parameters.properties.values());

  const isList = returnType.kind === "Model" && isArrayModelType(returnType);
  const typeName = isList
    ? resolveGraphQLTypeName(returnType.indexer.value)
    : resolveGraphQLTypeName(returnType);
  const elemNullable = isList && hasNullableElements(props.operation);

  return (
    <gql.Field
      name={props.operation.name}
      type={typeName}
      nonNull={isList ? !elemNullable : !nullable}
      description={doc}
      deprecated={deprecation?.message}
    >
      {isList ? <gql.Field.List nonNull={!nullable} /> : undefined}
      {params.map((param) => {
        const paramNullable = isNullable(param) || param.optional;
        const paramType = param.type;
        const paramIsList = paramType.kind === "Model" && isArrayModelType(paramType);
        const paramElemNullable = paramIsList && hasNullableElements(param);
        const paramTypeName = paramIsList
          ? resolveGraphQLTypeName(paramType.indexer.value)
          : resolveGraphQLTypeName(paramType);

        return (
          <gql.InputValue
            name={param.name}
            type={paramTypeName}
            nonNull={paramIsList ? !paramElemNullable : !paramNullable}
            description={$.type.getDoc(param)}
            deprecated={getDeprecationDetails(program, param)?.message}
          >
            {paramIsList ? <gql.InputValue.List nonNull={!paramNullable} /> : undefined}
          </gql.InputValue>
        );
      })}
    </gql.Field>
  );
}
