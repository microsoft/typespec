import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

/**
 * Describe scenarios for various combinations of unions.
 */
@scenarioService("/type/union")
namespace Type.Union;

model Cat {
  name: string;
}

model Dog {
  bark: string;
}

enum LR {
  left,
  right,
}
enum UD {
  up,
  down,
}

/**
 * Describe union of string "a" | "b" | "c"
 */
@route("/strings-only")
interface StringsOnly extends GetAndSend<"a" | "b" | "c", "\"b\""> {}

/**
 * Describe union of string string | "b" | "c"
 */
@route("/string-extensible")
interface StringExtensible extends GetAndSend<string | "b" | "c", "\"custom\""> {}

union StringExtensibleNamedUnion {
  string,
  OptionB: "b",
  "c",
}
/**
 * Describe union of string string | "b" | "c" but where the union is named and some of the variants are named
 */
@route("/string-extensible-named")
interface StringExtensibleNamed extends GetAndSend<StringExtensibleNamedUnion, "\"custom\""> {}

/**
 * Describe union of integer 1 | 2 | 3
 */
@route("/ints-only")
interface IntsOnly extends GetAndSend<1 | 2 | 3, "2"> {}

/**
 * Describe union of floats 1.1 | 2.2 | 3.3
 */
@route("/floats-only")
interface FloatsOnly extends GetAndSend<1.1 | 2.2 | 3.3, "2.2"> {}

/**
 * Describe union of models
 */
@route("/models-only")
interface ModelsOnly
  extends GetAndSend<
      Cat | Dog,
      """
        {
          "name": "test"
        }
        """
    > {}

model EnumsOnlyCases {
  /** This should be receive/send the left variant */
  lr: LR | UD;

  /** This should be receive/send the up variant */
  ud: UD | UD;
}

/**
 * Describe union of 2 different enums
 */
@route("/enums-only")
interface EnumsOnly
  extends GetAndSend<
      LR | UD,
      """
        {
          "lr": "right",
          "ud": "up"
        }
        """,
      EnumsOnlyCases
    > {}

model StringAndArrayCases {
  /** This should be receive/send the string variant */
  string: string | string[];

  /** This should be receive/send the array variant */
  array: string | string[];
}

/**
 * Describe union of a string and an array of strings
 */
@route("/string-and-array")
interface StringAndArray
  extends GetAndSend<
      string | string[],
      """
        {
          "string": "test",
          "array": ["test1", "test2"]
        }
        """,
      StringAndArrayCases
    > {}

alias MixedLiteralsUnion = "a" | 2 | 3.3 | true;
model MixedLiteralsCases {
  /** This should be receive/send the "a" variant */
  stringLiteral: MixedLiteralsUnion;

  /** This should be receive/send the 2 variant */
  intLiteral: MixedLiteralsUnion;

  /** This should be receive/send the 3.3 variant */
  floatLiteral: MixedLiteralsUnion;

  /** This should be receive/send the true variant */
  booleanLiteral: MixedLiteralsUnion;
}

/**
 * Describe union of floats "a" | 2 | 3.3
 */
@route("/mixed-literals")
interface MixedLiterals
  extends GetAndSend<
      MixedLiteralsUnion,
      """
        {
          "stringLiteral": "a",
          "intLiteral": 2,
          "floatLiteral": 3.3,
          "booleanLiteral": true
        }
        """,
      MixedLiteralsCases
    > {}

alias MixedTypesUnion = Cat | "a" | int32 | boolean;
model MixedTypesCases {
  /** This should be receive/send the Cat variant */
  `model`: MixedTypesUnion;

  /** This should be receive/send the "a" variant */
  literal: MixedTypesUnion;

  /** This should be receive/send the int variant */
  int: MixedTypesUnion;

  /** This should be receive/send the boolean variant */
  boolean: MixedTypesUnion;

  /** This should be receive/send 4 element with Cat, "a", int, and boolean */
  array: MixedTypesUnion[];
}

/**
 * Describe union of floats "a" | 2 | 3.3
 */
@route("/mixed-types")
interface MixedTypes
  extends GetAndSend<
      MixedTypesUnion,
      """
        {
          "model": {
            "name": "test"
          },
          "literal": "a",
          "int": 2,
          "boolean": true,
          "array": [
            {
              "name": "test"
            },
            "a",
            2,
            true
          ]
        }
        """,
      MixedTypesCases
    > {}

/**
 * Helper interface to describe a test involving getting and sending a specific data
 */
interface GetAndSend<Union, Payload extends valueof string, Cases = Union> {
  @scenario
  @scenarioDoc(
    """
      Verify a union can be processed in a response: 
      ```tsp
      {type}
      ```
      
      Expected response body:
      ```json
      { "prop": ${Payload}}
      ```
      """,
    {
      type: Union,
    }
  )
  get(): {
    prop: Cases;
  };

  @scenario
  @scenarioDoc(
    """
      Verify a union can be processed in a response: 
      ```tsp
      {type}
      ```
      
      Expected request to send body:
      ```json
      { "prop": ${Payload}}
      ```
      """,
    {
      type: Union,
    }
  )
  send(prop: Cases): void;
}
