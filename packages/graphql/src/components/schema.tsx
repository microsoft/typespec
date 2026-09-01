import * as gql from "@pinterest/alloy-graphql";
import { type Model } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { isInputType } from "../../generated-defs/TypeSpec.GraphQL.js";
import { useGraphQLSchema } from "../context/index.js";
import { isInterface } from "../lib/interface.js";
import { getOperationFields } from "../lib/operation-fields.js";
import { getOperationKind } from "../lib/operation-kind.js";
import { getSpecifiedBy } from "../lib/specified-by.js";
import { OperationField } from "./fields/index.js";
import { EnumType } from "./types/enum-type.js";
import { InputType } from "./types/input-type.js";
import { InterfaceType } from "./types/interface-type.js";
import { ObjectType } from "./types/object-type.js";
import { ScalarType } from "./types/scalar-type.js";
import { UnionType, type GraphQLUnion } from "./types/union-type.js";

export function Schema() {
  const { typeGraph } = useGraphQLSchema();
  const { program } = useTsp();
  const ns = typeGraph.globalNamespace;

  const operations = [...ns.operations.values()];
  const queries = operations.filter((op) => getOperationKind(program, op) === "Query");
  const mutations = operations.filter((op) => getOperationKind(program, op) === "Mutation");
  const subscriptions = operations.filter((op) => getOperationKind(program, op) === "Subscription");

  const models = [...ns.models.values()];
  const scalars = [...ns.scalars.values()];
  const enums = [...ns.enums.values()];
  const unions = [...ns.unions.values()];

  return (
    <>
      {scalars.map((s) => (
        <ScalarType type={s} specificationUrl={getSpecifiedBy(program, s)} />
      ))}
      {enums.map((e) => (
        <EnumType type={e} />
      ))}
      {unions.map((u) => (
        <UnionType type={u as GraphQLUnion} />
      ))}
      {models.map((m) => renderModel(m))}
      {queries.length > 0 && (
        <gql.Query>
          {queries.map((op) => (
            <OperationField operation={op} />
          ))}
        </gql.Query>
      )}
      {mutations.length > 0 && (
        <gql.Mutation>
          {mutations.map((op) => (
            <OperationField operation={op} />
          ))}
        </gql.Mutation>
      )}
      {subscriptions.length > 0 && (
        <gql.Subscription>
          {subscriptions.map((op) => (
            <OperationField operation={op} />
          ))}
        </gql.Subscription>
      )}
    </>
  );

  function renderModel(model: Model) {
    const hasFields = model.properties.size > 0 || getOperationFields(program, model).size > 0;
    if (!hasFields) return undefined;

    if (isInterface(program, model)) {
      return <InterfaceType type={model} />;
    }
    if (isInputType(program, model)) {
      return <InputType type={model} />;
    }
    return <ObjectType type={model} />;
  }
}
