import "@typespec/http";
import "@azure-tools/cadl-ranch-expect";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using global.Azure.ClientGenerator.Core;

@doc("Illustrates the model flatten cases.")
@scenarioService("/azure/client-generator-core/flatten-property")
namespace _Specs_.Azure.ClientGenerator.Core.FlattenProperty;

@doc("This is the model with one level of flattening.")
model FlattenModel {
  name: string;

  #suppress "deprecated" "@flattenProperty decorator is not recommended to use."
  @flattenProperty
  properties: ChildModel;
}

@doc("This is the model with two levels of flattening.")
model NestedFlattenModel {
  name: string;

  #suppress "deprecated" "@flattenProperty decorator is not recommended to use."
  @flattenProperty
  properties: ChildFlattenModel;
}

@doc("This is the child model to be flattened.")
model ChildModel {
  description: string;
  age: int32;
}

@doc("This is the child model to be flattened. And it has flattened property as well.")
model ChildFlattenModel {
  summary: string;

  #suppress "deprecated" "@flattenProperty decorator is not recommended to use."
  @flattenProperty
  properties: ChildModel;
}

@scenario
@route("/flattenModel")
@scenarioDoc("""
  Update and receive model with 1 level of flattening.
  Expected input body:
  ```json
  {
    "name": "foo",
    "properties": {
      "description": "bar",
      "age": 10
    }
  }
  ```
  
  Expected response body:
  ```json
  {
    "name": "test",
    "properties": {
      "description": "test",
      "age": 1
    }
  }
  ```
  """)
@put
op putFlattenModel(@body input: FlattenModel): FlattenModel;

@scenario
@route("/nestedFlattenModel")
@scenarioDoc("""
  Update and receive model with 2 levels of flattening.
  Expected input body:
  ```json
  {
    "name": "foo",
    "properties": {
      "summary": "bar",
      "properties": {
        "description": "test",
        "age": 10
      }
    }
  }
  ```
  
  Expected response body:
  ```json
  {
    "name": "test",
    "properties": {
      "summary": "test",
      "properties": {
        "description": "foo",
        "age": 1
      }
    }
  }
  ```
  """)
@put
op putNestedFlattenModel(@body input: NestedFlattenModel): NestedFlattenModel;
