import "@azure-tools/cadl-ranch-expect";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";
import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";

using Azure.Core;
using global.Azure.Core.Traits;
using global.Azure.Core.Foundations;
using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;

#suppress "@azure-tools/typespec-azure-core/casing-style" "For spec"
@doc("Illustrates bodies templated with Azure Core")
@scenarioService(
  "/azure/core/basic",
  {
    versioned: Versions,
  }
)
namespace _Specs_.Azure.Core.Basic;

@doc("The version of the API.")
enum Versions {
  @doc("The version 2022-12-01-preview.")
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
  @doc("The user's id.")
  @visibility("read")
  id: int32;

  @doc("The user's name.")
  name: string;

  @doc("The user's order list")
  orders?: UserOrder[];

  ...global.Azure.Core.EtagProperty;
}

@doc("UserOrder for testing list with expand.")
@resource("user")
model UserOrder {
  @key
  @doc("The user's id.")
  @visibility("read")
  id: int32;

  @doc("The user's id.")
  userId: int32;

  @doc("The user's order detail")
  detail: string;
}

@doc("The parameters for exporting a user.")
model UserExportParams {
  @query
  @doc("The format of the data.")
  format: string;
}

@scenario
@doc("Creates or updates a User")
@summary("Adds a user or updates a user's fields.")
@scenarioDoc("""
  Should only generate models named User and UserOrder.
  
  Expected path parameter: id=1
  Expected query parameter: api-version=2022-12-01-preview
  
  Expected input body:
  ```json
  {
    "name": "Madge"
  }
  ```
  
  Expected response body:
  ```json
  {
    "id": 1,
    "name": "Madge"
  }
  ```
  """)
op createOrUpdate is ResourceOperations.ResourceCreateOrUpdate<User>;

@scenario
@doc("Creates or replaces a User")
@summary("Adds a user or replaces a user's fields.")
@scenarioDoc("""
  Should only generate models named User and UserOrder.
  
  Expected path parameter: id=1
  Expected query parameter: api-version=2022-12-01-preview
  
  Expected input body:
  ```json
  {
    "name": "Madge"
  }
  ```
  
  Expected response body:
  ```json
  {
    "id": 1,
    "name": "Madge",
    "etag": "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
  }
  ```
  """)
op createOrReplace is ResourceOperations.ResourceCreateOrReplace<User>;

@scenario
@doc("Gets a User")
@summary("Gets a user.")
@scenarioDoc("""
  Should only generate models named User and UserOrder.
  
  Expected path parameter: id=1
  Expected query parameter: api-version=2022-12-01-preview
  
  Expected response body:
  ```json
  {
    "id": 1,
    "name": "Madge",
    "etag": "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
  }
  ```
  """)
op get is ResourceOperations.ResourceRead<User>;

@scenario
@doc("Lists all Users")
@summary("Lists all users.")
@scenarioDoc("""
  Should only generate models named User and UserOrder.
  
  Should not generate visible model like CustomPage.
  
  Expected query parameter: api-version=2022-12-01-preview&top=5&skip=10&orderby=id&filter=id%20lt%2010&select=id&select=orders&select=etag&expand=orders
  
  Expected response body:
  ```json
  {
    "value":[
       {
          "id":1,
          "name":"Madge",
          "etag": "11bdc430-65e8-45ad-81d9-8ffa60d55b59",
          "orders": [{ "id": 1, "userId": 1, detail: "a recorder" }]
       },
       {
          "id":2,
          "name":"John",
          "etag": "11bdc430-65e8-45ad-81d9-8ffa60d55b5a",
          "orders": [{ "id": 2, "userId": 2, "detail": "a TV" }]
       }
    ]
  }
  ```
  """)
op list is ResourceOperations.ResourceList<
  User,
  ListQueryParametersTrait<global.Azure.Core.StandardListQueryParameters &
    global.Azure.Core.OrderByQueryParameter &
    global.Azure.Core.FilterQueryParameter &
    global.Azure.Core.SelectQueryParameter &
    global.Azure.Core.ExpandQueryParameter>
>;

@scenario
@doc("Deletes a User")
@summary("Deletes a user.")
@scenarioDoc("""
  Expected path parameter: id=1
  
  Expected query parameter: api-version=2022-12-01-preview
  
  Expected response of status code 204 with empty body.
  """)
op delete is ResourceOperations.ResourceDelete<User>;

@scenario
@doc("Exports a User")
@summary("Exports a user.")
@scenarioDoc("""
  Should only generate models named User and UserOrder.
  
  Expected path parameter: id=1
  Expected query parameter: format=json
  Expected query parameter: api-version=2022-12-01-preview
  
  Expected response body:
  ```json
  {
    "id": 1,
    "name": "Madge",
    "etag": "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
  }
  ```
  """)
op export is ResourceOperations.ResourceAction<User, UserExportParams, User>;

model UserList {
  users: User[];
}

@scenario
@doc("Exports all users")
@summary("Exports all users.")
@scenarioDoc("""
  Should generate a model named User.
  
  Expected query parameter: format=json
  Expected query parameter: api-version=2022-12-01-preview
  
  Expected response body:
  ```json
  {
    "users":[
      {
        "id": 1,
        "name": "Madge",
        "etag": "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
      },
      {
        "id": 2,
        "name": "John",
        "etag": "22bdc430-65e8-45ad-81d9-8ffa60d55b59"
      }
    ]
  }
  ```
  """)
@collectionAction(User, "exportallusers")
@post
op exportAllUsers is ResourceOperations.ResourceCollectionAction<
  User,
  UserExportParams,
  UserList,
  {
    apiVersion: "2022-12-01-preview";
  }
>;
