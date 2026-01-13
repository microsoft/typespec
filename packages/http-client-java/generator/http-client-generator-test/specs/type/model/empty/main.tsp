import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Illustrates usage of empty model used in operation's parameters and responses.")
@scenarioService("/type/model/empty")
namespace Type.Model.Empty;

@doc("Empty model used in operation parameters")
model EmptyInput {}

@doc("Empty model used in operation return type")
model EmptyOutput {}

@doc("Empty model used in both parameter and return type")
model EmptyInputOutput {}

@scenario
@scenarioDoc("Send a PUT request with the following body {}")
@route("/alone")
@put
op putEmpty(@body input: EmptyInput): void;

@scenario
@scenarioDoc("Send a GET request which returns the following body {}")
@route("/alone")
@get
op getEmpty(): {
  @body body: EmptyOutput;
};

@scenario
@scenarioDoc("Send a POST request with the following body {} which returns the same.")
@route("/round-trip")
@post
op postRoundTripEmpty(@body body: EmptyInputOutput): {
  @body body: EmptyInputOutput;
};
