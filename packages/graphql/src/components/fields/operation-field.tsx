import * as gql from "@pinterest/alloy-graphql";
import { type Operation, getDeprecationDetails, isArrayModelType } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { isNullable, isNullableElements } from "../../../generated-defs/TypeSpec.GraphQL.js";
import { resolveGraphQLTypeName } from "../../lib/graphql-type-name.js";

export interface OperationFieldProps {
  operation: Operation;
}

export function OperationField(props: OperationFieldProps) {
  const { $, program } = useTsp();

  const doc = $.type.getDoc(props.operation);
  const deprecation = getDeprecationDetails(program, props.operation);
  const returnType = props.operation.returnType;
  const nullable = isNullable(program, props.operation);
  const params = Array.from(props.operation.parameters.properties.values());

  const isList = returnType.kind === "Model" && isArrayModelType(returnType);
  const typeName = isList
    ? resolveGraphQLTypeName(returnType.indexer.value, program)
    : resolveGraphQLTypeName(returnType, program);
  const elemNullable = isList && isNullableElements(program, props.operation);

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
        const paramNullable = isNullable(program, param) || param.optional;
        const paramType = param.type;
        const paramIsList = paramType.kind === "Model" && isArrayModelType(paramType);
        const paramElemNullable = paramIsList && isNullableElements(program, param);
        const paramTypeName = paramIsList
          ? resolveGraphQLTypeName(paramType.indexer.value, program)
          : resolveGraphQLTypeName(paramType, program);

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
