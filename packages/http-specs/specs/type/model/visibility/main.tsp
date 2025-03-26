import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Illustrates models with visibility properties.")
@scenarioService("/type/model/visibility")
namespace Type.Model.Visibility;

@doc("Output model with visibility properties.")
model VisibilityModel {
  @doc("Required string, illustrating a readonly property.")
  @visibility(Lifecycle.Read)
  readProp: string;

  #suppress "@typespec/http/metadata-ignored" "For test"
  @doc("Required int32, illustrating a query property.")
  @visibility(Lifecycle.Query)
  @query
  queryProp: int32;

  @doc("Required string[], illustrating a create property.")
  @visibility(Lifecycle.Create)
  createProp: string[];

  @doc("Required int32[], illustrating a update property.")
  @visibility(Lifecycle.Update)
  updateProp: int32[];

  @doc("Required bool, illustrating a delete property.")
  @visibility(Lifecycle.Delete)
  deleteProp: boolean;

  @doc("Property that does not exist in any payload.")
  @invisible(Lifecycle)
  noneProp: "none";
}

/** RoundTrip model with readonly optional properties. */
model ReadOnlyModel {
  /** Optional readonly nullable int list. */
  @visibility(Lifecycle.Read)
  optionalNullableIntList?: int32[] | null;

  /** Optional readonly string dictionary. */
  @visibility(Lifecycle.Read)
  optionalStringRecord?: Record<string>;
}

@scenario
@scenarioDoc("""
  Generate and receive output model with readonly properties.
  Expected no body with `?queryProp=123`.
  
  Expected response body:
  ```json
  {
    readProp: "abc",
  }
  ```
  """)
@get
op getModel(@bodyRoot input: VisibilityModel): {
  @body
  output: VisibilityModel;
};

@scenario
@scenarioDoc("""
  Generate abd send put model with write/create properties.
  Expected no body with `?queryProp=123`.
  """)
@head
op headModel(@bodyRoot input: VisibilityModel): OkResponse;

@scenario
@scenarioDoc("""
  Generate abd send put model with write/create/update properties.
  Expected input body:
  ```json
  {
    createProp: ["foo", "bar"],
    updateProp: [1, 2],
  }
  ```
  """)
@put
op putModel(@body input: VisibilityModel): void;

@scenario
@scenarioDoc("""
  Generate abd send put model with write/update properties.
  Expected input body:
  ```json
  {
    updateProp: [1, 2],
  }
  ```
  """)
@patch
op patchModel(@body input: VisibilityModel): void;

@scenario
@scenarioDoc("""
  Generate abd send put model with write/create properties.
  Expected input body:
  ```json
  {
    createProp: ["foo", "bar"],
  }
  ```
  """)
@post
op postModel(@body input: VisibilityModel): void;

@scenario
@scenarioDoc("""
  Generate abd send put model with write/create properties.
  Expected input body:
  ```json
  {
    deleteProp: true,
  }
  ```
  """)
@delete
op deleteModel(@body input: VisibilityModel): void;

@route("/readonlyroundtrip")
@scenario
@scenarioDoc("""
  Generate and receive output model with readonly properties.
  
  Expected input body:
  ```json
  {}
  ```
  
  Expected response body:
  ```json
  {
    optionalNullableIntList: [1, 2, 3],
    optionalStringRecord: { k1: "value1", k2: "value2" },
  }
  ```
  """)
@put
op putReadOnlyModel(@body input: ReadOnlyModel): ReadOnlyModel;
