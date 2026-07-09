import * as gql from "@pinterest/alloy-graphql";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { UnionType, type GraphQLUnion } from "../../src/components/types/index.js";
import {
  createGraphQLMutationEngine,
  GraphQLTypeContext,
} from "../../src/mutation-engine/index.js";
import { Tester } from "../test-host.js";
import { renderToSDL } from "./test-utils.js";

describe("UnionType component", () => {
  let tester: TesterInstance;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("renders a union of model types", async () => {
    const { Pet } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        model ${t.model("Dog")} { breed: string; }
        union ${t.union("Pet")} { cat: Cat; dog: Dog; }
      `,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutation = engine.mutateUnion(Pet, GraphQLTypeContext.Output);
    const mutatedUnion = mutation.mutatedType as GraphQLUnion;

    // Union members must be registered for graphql-js to validate the schema
    const sdl = renderToSDL(
      tester.program,
      <>
        <gql.ObjectType name="Cat">
          <gql.Field name="name" type={gql.String} nonNull />
        </gql.ObjectType>
        <gql.ObjectType name="Dog">
          <gql.Field name="breed" type={gql.String} nonNull />
        </gql.ObjectType>
        <UnionType type={mutatedUnion} />
      </>,
    );

    expect(sdl).toContain("union Pet = Cat | Dog");
  });

  it("renders a union with doc comment description", async () => {
    const { Result } = await tester.compile(
      t.code`
        model ${t.model("Success")} { value: string; }
        model ${t.model("Failure")} { message: string; }
        /** The result of an operation */
        union ${t.union("Result")} { success: Success; failure: Failure; }
      `,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutation = engine.mutateUnion(Result, GraphQLTypeContext.Output);
    const mutatedUnion = mutation.mutatedType as GraphQLUnion;

    const sdl = renderToSDL(
      tester.program,
      <>
        <gql.ObjectType name="Success">
          <gql.Field name="value" type={gql.String} nonNull />
        </gql.ObjectType>
        <gql.ObjectType name="Failure">
          <gql.Field name="message" type={gql.String} nonNull />
        </gql.ObjectType>
        <UnionType type={mutatedUnion} />
      </>,
    );

    expect(sdl).toContain('"The result of an operation"');
    expect(sdl).toContain("union Result = Success | Failure");
  });

  it("references wrapper model names for scalar variants", async () => {
    const { Mixed } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        union ${t.union("Mixed")} { cat: Cat; text: string; }
      `,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutation = engine.mutateUnion(Mixed, GraphQLTypeContext.Output);
    const mutatedUnion = mutation.mutatedType as GraphQLUnion;

    // Register the wrapper model and Cat so graphql-js can validate
    const sdl = renderToSDL(
      tester.program,
      <>
        <gql.ObjectType name="Cat">
          <gql.Field name="name" type={gql.String} nonNull />
        </gql.ObjectType>
        <gql.ObjectType name="MixedTextUnionVariant">
          <gql.Field name="value" type={gql.String} nonNull />
        </gql.ObjectType>
        <UnionType type={mutatedUnion} />
      </>,
    );

    expect(sdl).toContain("union Mixed = Cat | MixedTextUnionVariant");
  });

  it("renders a union with three model members", async () => {
    const { Shape } = await tester.compile(
      t.code`
        model ${t.model("Circle")} { radius: float32; }
        model ${t.model("Square")} { side: float32; }
        model ${t.model("Triangle")} { base: float32; }
        union ${t.union("Shape")} { circle: Circle; square: Square; triangle: Triangle; }
      `,
    );

    const engine = createGraphQLMutationEngine(tester.program);
    const mutation = engine.mutateUnion(Shape, GraphQLTypeContext.Output);
    const mutatedUnion = mutation.mutatedType as GraphQLUnion;

    const sdl = renderToSDL(
      tester.program,
      <>
        <gql.ObjectType name="Circle">
          <gql.Field name="radius" type={gql.Float} nonNull />
        </gql.ObjectType>
        <gql.ObjectType name="Square">
          <gql.Field name="side" type={gql.Float} nonNull />
        </gql.ObjectType>
        <gql.ObjectType name="Triangle">
          <gql.Field name="base" type={gql.Float} nonNull />
        </gql.ObjectType>
        <UnionType type={mutatedUnion} />
      </>,
    );

    expect(sdl).toContain("union Shape = Circle | Square | Triangle");
  });
});
