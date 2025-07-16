import "@azure-tools/typespec-azure-core";
import "@typespec/spector";
import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-client-generator-core";

using Azure.Core;
using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using Spector;

#suppress "@azure-tools/typespec-azure-core/casing-style" "For spec"
@doc("Illustrates bodies templated with Azure Core with paging support")
@scenarioService(
  "/azure/core/page",
  {
    versioned: Versions,
  }
)
@global.Azure.ClientGenerator.Core.clientNamespace("azure.core.page", "java")
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
  @visibility(Lifecycle.Read)
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
  @visibility(Lifecycle.Read)
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
@post
op listWithParameters is global.Azure.Core.Foundations.Operation<
  ListItemInput,
  global.Azure.Core.Page<User>
>;

@friendlyName("{name}ListResults", T)
@global.Azure.Core.pagedResult
model CustomPageModel<T> {
  @global.Azure.Core.items
  @doc("List of items.")
  items: T[];

  @nextLink
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
  @visibility(Lifecycle.Read)
  id: int32;
}

@doc("Second item.")
model SecondItem {
  @doc("The name of the item.")
  @visibility(Lifecycle.Read)
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

model IncludePendingOptions {
  @query
  includePending?: boolean;
}

@global.Azure.Core.pagedResult
model ParameterizedNextLinkPagingResult {
  @global.Azure.Core.items
  values: User[];

  @nextLink
  nextLink: global.Azure.Core.Legacy.parameterizedNextLink<[IncludePendingOptions.includePending]>;
}

@scenario
@doc("List with parameterized next link that re-injects parameters.")
@route("/with-parameterized-next-link")
@scenarioDoc("""
    This scenario tests the Azure.Core.Legacy.parameterizedNextLink decorator which ensures original request
    parameters are maintained in next link URLs.
    
    Expected query parameters on initial request:
    - includePending=true
    - select=name
  
    Expected query parameters on next link request. Note: the SDK will need to re-inject this parameter:
    - includePending=true (note: the client will need to manually re-inject this parameter into the next link)
    - select=name (note: this is returned in the next link, the client does NOT need to manually re-inject this parameter)
    
    Expected concatenation of the paged items:
    ```json
    {
      "value":[
         {
            "id": 1,
            "name": "User1",
         },
         {
            "id": 2,
            "name": "User2",
         }
      ]
    }
    ```
    
    Note that the nextLink preserves the original filter and select parameters.
  """)
op withParameterizedNextLink(
  ...IncludePendingOptions,
  @query select: string,
): ParameterizedNextLinkPagingResult;
