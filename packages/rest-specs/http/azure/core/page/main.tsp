import "@azure-tools/typespec-azure-core";
import "@azure-tools/cadl-ranch-expect";
import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";

using Azure.Core;
using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;

#suppress "@azure-tools/typespec-azure-core/casing-style" "For spec"
@doc("Illustrates bodies templated with Azure Core with paging support")
@scenarioService(
  "/azure/core/page",
  {
    versioned: Versions,
  }
)
namespace _Specs_.Azure.Core.Page;

@doc("The version of the API.")
enum Versions {
  @doc("The version 2022-12-01-preview.")
  @useDependency(global.Azure.Core.Versions.v1_0_Preview_2)
  v2022_12_01_preview: "2022-12-01-preview",
}

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

#suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing global.Azure.Core.Page"
@scenario
@doc("List with Azure.Core.Page<>.")
@route("/page")
@scenarioDoc("""
  Should only generate models named User and UserOrder.
  
  Should not generate visible model like Page.
  
  Expected query parameter: api-version=2022-12-01-preview
  
  Expected response body:
  ```json
  {
    "value":[
       {
          "id":1,
          "name":"Madge",
          "etag": "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
       }
    ]
  }
  ```
  """)
op listWithPage is global.Azure.Core.Foundations.Operation<{}, global.Azure.Core.Page<User>>;

@doc("The parameters for listing users.")
model ListItemInput {
  @doc("The body of the input.")
  @body
  bodyInput: ListItemInputBody;

  @doc("Another query parameter.")
  @query
  another?: ListItemInputExtensibleEnum;
}

@doc("An extensible enum input parameter.")
enum ListItemInputExtensibleEnum {
  @doc("The first enum value.")
  First,

  @doc("The second enum value.")
  Second,
}

@doc("The body of the input.")
model ListItemInputBody {
  @doc("The name of the input.")
  inputName: string;
}

#suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing global.Azure.Core.Page"
@scenario
@doc("List with extensible enum parameter Azure.Core.Page<>.")
@route("/parameters")
@scenarioDoc("""
  Expected query parameter: api-version=2022-12-01-preview&another=Second
  
  Expected body parameter: {"inputName": "Madge"}
  
  Expected response body:
  ```json
  {
    "value":[
       {
          "id": 1,
          "name": "Madge",
          "etag": "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
       }
    ]
  }
  ```
  """)
@get
op listWithParameters is global.Azure.Core.Foundations.Operation<ListItemInput, global.Azure.Core.Page<User>>;

@friendlyName("{name}ListResults", T)
@global.Azure.Core.pagedResult
model CustomPageModel<T> {
  @global.Azure.Core.items
  @doc("List of items.")
  items: T[];

  @global.Azure.Core.nextLink
  @doc("Link to fetch more items.")
  nextLink?: string;
}

#suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing global.Azure.Core.Page"
@scenario
@doc("List with custom page model.")
@route("/custom-page")
@scenarioDoc("""
  Should ideally only generate models named User and UserOrder. If your language has to, you can also generate CustomPageModel
  
  Expected query parameter: api-version=2022-12-01-preview
  
  Expected response body:
  ```json
  {
    "items":[
       {
          "id":1,
          "name":"Madge",
          "etag": "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
       }
    ]
  }
  ```
  """)
op listWithCustomPageModel is global.Azure.Core.Foundations.Operation<{}, CustomPageModel<User>>;

@doc("First item.")
model FirstItem {
  @doc("The id of the item.")
  @visibility("read")
  id: int32;
}

@doc("Second item.")
model SecondItem {
  @doc("The name of the item.")
  @visibility("read")
  name: string;
}

@scenario
@scenarioDoc("""
  This scenario is to test two operations with two different page item types.
  """)
interface TwoModelsAsPageItem {
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing global.Azure.Core.Page"
  @doc("Two operations with two different page item types should be successfully generated. Should generate model for FirstItem.")
  @route("/first-item")
  listFirstItem is global.Azure.Core.Foundations.Operation<{}, global.Azure.Core.Page<FirstItem>>;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing global.Azure.Core.Page"
  @doc("Two operations with two different page item types should be successfully generated. Should generate model for SecondItem.")
  @route("/second-item")
  listSecondItem is global.Azure.Core.Foundations.Operation<{}, global.Azure.Core.Page<SecondItem>>;
}
