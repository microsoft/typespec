import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

/**
 * Those tests are meant to test different behavior of records if they are used as input, output or both.
 * This is something that might not matter in your emitter.
 *
 * This is valuable if you for example only decide to create a public constructor if a model is used as input.
 */
@doc("Illustrates usage of Record in different places(Operation parameters, return type or both).")
@scenarioService("/type/model/usage")
namespace Type.Model.Usage;

alias RecordBase = {
  requiredProp: string;
};

@doc("Record used in operation parameters")
model InputRecord {
  ...RecordBase;
}

@doc("Record used in operation return type")
model OutputRecord {
  ...RecordBase;
}

@doc("Record used both as operation parameter and return type")
model InputOutputRecord {
  ...RecordBase;
}

@scenario
@scenarioDoc("Send a POST request with the following body {requiredProp: \"example-value\"}")
@route("/input")
op input(@body input: InputRecord): void;

@scenario
@scenarioDoc("Send a GET request which return the following body {requiredProp: \"example-value\"}")
@route("/output")
op output(): OutputRecord;

@scenario
@scenarioDoc("Send a POST request which return the following body {requiredProp: \"example-value\"} and return the same.")
@route("/input-output")
op inputAndOutput(@body body: InputOutputRecord): InputOutputRecord;
