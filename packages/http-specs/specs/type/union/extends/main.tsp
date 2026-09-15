import "@typespec/http";
import "@typespec/spector";
import "./models.tsp";
import "./composition.tsp";
import "./constraints.tsp";
import "./controls.tsp";
import "./usage.tsp";

using Http;
using Spector;

/**
 * Union extends constrains variant assignability, not inheritance or serialization.
 * UE case IDs map to the coverage table in README.md.
 */
@scenarioService("/type/union/extends")
namespace Type.Union.Extends;

model JsonResponse<T> {
  @statusCode statusCode: 200;
  @header contentType: "application/json";
  @body body: T;
}

interface GetAndPut<T, Choice extends string, Fixtures extends valueof string> {
  @scenario
  @scenarioDoc("""
    Call once for EVERY choice below. Each choice returns the corresponding JSON
    body with status 200 and Content-Type application/json. Access the
    variant-specific data; ambiguous untagged shapes do not require a unique class.
    ${Fixtures}
    """)
  @get
  @route("/{choice}")
  get(@path choice: Choice): JsonResponse<T>;

  @scenario
  @scenarioDoc("""
    Call once for EVERY choice below. Send the corresponding exact JSON body
    with Content-Type application/json. Expect the same JSON body with status 200
    and Content-Type application/json. Retain all inherited and specific fields.
    ${Fixtures}
    """)
  @put
  @route("/{choice}")
  put(
    @path choice: Choice,
    @body body: T,
    @header contentType: "application/json",
  ): JsonResponse<T>;
}

model Named {
  name: string;
}

model Cat extends Named {
  meow: boolean;
}

model Dog extends Named {
  bark: boolean;
}

model Bird extends Named {
  wings: int32;
}

model Fish extends Named {
  fins: int32;
}

// Deliberately not a variant of any of the unions constrained by Named.
model Lizard extends Named {
  scales: boolean;
}
