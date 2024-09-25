import "@azure-tools/typespec-azure-core";
import "@azure-tools/cadl-ranch-expect";
import "@typespec/rest";
import "@typespec/versioning";

using Azure.Core;
using global.Azure.Core.Traits;
using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;

#suppress "@azure-tools/typespec-azure-core/casing-style" "For spec"
@doc("Illustrates bodies templated with Azure Core with long-running operation")
@scenarioService(
  "/azure/core/lro/standard",
  {
    versioned: Versions,
  }
)
namespace _Specs_.Azure.Core.Lro.Standard;

@doc("The API version.")
enum Versions {
  @doc("The 2022-12-01-preview version.")
  @useDependency(global.Azure.Core.Versions.v1_0_Preview_2)
  v2022_12_01_preview: "2022-12-01-preview",
}

alias ResourceOperations = global.Azure.Core.ResourceOperations<NoConditionalRequests &
  NoRepeatableRequests &
  NoClientRequestId>;

@resource("users")
@doc("Details about a user.")
model User {
  @key
  @visibility("read")
  @doc("The name of user.")
  name: string;

  @doc("The role of user")
  role: string;
}

@doc("The parameters for exporting a user.")
model UserExportParams {
  @query
  @doc("The format of the data.")
  format: string;
}

@doc("The exported user data.")
model ExportedUser {
  @doc("The name of user.")
  name: string;

  @doc("The exported URI.")
  resourceUri: string;
}

@scenario
@doc("Creates or replaces a User")
@summary("Adds a user or replaces a user's fields.")
@scenarioDoc("""
  Should only generate one model named User.
  
  Expected verb: PUT
  Expected path parameter: name=madge
  
  Expected request body:
  ```json
  {
    "role": "contributor"
  }
  ```
  
  Expected status code: 201
  Expected response header: operation-location={endpoint}/users/madge/operations/operation1
  Expected response body:
  ```json
  {
    "name": "madge",
    "role": "contributor"
  }
  ```
  
  Expected verb: GET
  Expected URL: {endpoint}/users/madge/operations/operation1
  
  Expected status code: 200
  Expected response body:
  ```json
  {
    "id": "operation1",
    "status": "InProgress"
  }
  ```
  
  Expected verb: GET
  Expected URL: {endpoint}/users/madge/operations/operation1
  
  Expected status code: 200
  Expected response body:
  ```json
  {
    "id": "operation1",
    "status": "Succeeded"
  }
  ```
  
  (The last GET call on resource URL is optional)
  Expected verb: GET
  Expected URL: {endpoint}/users/madge
  
  Expected status code: 200
  Expected response body:
  ```json
  {
    "name": "madge",
    "role": "contributor"
  }
  ```
  """)
op createOrReplace is ResourceOperations.LongRunningResourceCreateOrReplace<User>;

@scenario
@doc("Deletes a User")
@summary("Deletes a user.")
@scenarioDoc("""
  Expected verb: DELETE
  Expected path parameter: name=madge
  
  Expected status code: 202
  Expected response header: operation-location={endpoint}/users/madge/operations/operation2
  Expected response body:
  ```json
  {
    "id": "operation2",
    "status": "InProgress"
  }
  ```
  
  Expected verb: GET
  Expected URL: {endpoint}/users/madge/operations/operation2
  
  Expected status code: 200
  Expected response body:
  ```json
  {
    "id": "operation2",
    "status": "InProgress"
  }
  ```
  
  Expected verb: GET
  Expected URL: {endpoint}/users/madge/operations/operation2
  
  Expected status code: 200
  Expected response body:
  ```json
  {
    "id": "operation2",
    "status": "Succeeded"
  }
  ```
  """)
op delete is ResourceOperations.LongRunningResourceDelete<User>;

@scenario
@doc("Exports a User")
@summary("Exports a user.")
@scenarioDoc("""
  Should only generate one model named ExportedUser.
  
  Expected verb: POST
  Expected path parameter: name=madge
  Expected query parameter: format=json
  
  Expected status code: 202
  Expected response header: operation-location={endpoint}/users/madge/operations/operation3
  Expected response body:
  ```json
  {
    "id": "operation3",
    "status": "InProgress"
  }
  ```
  
  Expected verb: GET
  Expected URL: {endpoint}/users/madge/operations/operation3
  
  Expected status code: 200
  Expected response body:
  ```json
  {
    "id": "operation3",
    "status": "InProgress"
  }
  ```
  
  Expected verb: GET
  Expected URL: {endpoint}/users/madge/operations/operation3
  
  Expected status code: 200
  Expected response body:
  ```json
  {
    "id": "operation3",
    "status": "Succeeded",
    "result": {
      "name": "madge",
      "resourceUri": "/users/madge"
    }
  }
  ```
  """)
op export is ResourceOperations.LongRunningResourceAction<User, UserExportParams, ExportedUser>;
