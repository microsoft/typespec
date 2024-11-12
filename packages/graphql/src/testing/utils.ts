import { GraphQLSchema } from "graphql";

export const EMPTY_SCHEMA = new GraphQLSchema({});

export const EMPTY_SCHEMA_OUTPUT = `#graphql
type Query {
  """
  A placeholder field. If you are seeing this, it means no operations were defined that could be emitted.
  """
  _: Boolean
}
`;
