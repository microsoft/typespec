import { type Children } from "@alloy-js/core";
import * as gql from "@pinterest/alloy-graphql";
import { renderSchema } from "@pinterest/alloy-graphql";
import { printSchema } from "graphql";
import type { Program } from "@typespec/compiler";
import { TspContext } from "@typespec/emitter-framework";
import { GraphQLSchemaContext } from "../../src/context/index.js";
import type { TypeGraph } from "../../src/mutation-engine/type-graph.js";

/**
 * Render GraphQL components in isolation and return SDL string.
 * Wraps children in required context providers and adds a placeholder Query
 * (graphql-js requires at least one query field).
 */
export function renderToSDL(program: Program, children: Children): string {
  const typeGraph: TypeGraph = {
    globalNamespace: program.getGlobalNamespaceType(),
  };

  const schema = renderSchema(
    <TspContext.Provider value={{ program }}>
      <GraphQLSchemaContext.Provider value={{ typeGraph }}>
        {children}
        <gql.Query>
          <gql.Field name="_placeholder" type={gql.Boolean} nonNull={false} />
        </gql.Query>
      </GraphQLSchemaContext.Provider>
    </TspContext.Provider>,
    { namePolicy: null },
  );

  // Cast needed: alloy uses graphql@17-alpha internally, our package uses graphql@16.
  // At runtime both are deduped via vitest config; the type mismatch is superficial.
  return printSchema(schema as any);
}
