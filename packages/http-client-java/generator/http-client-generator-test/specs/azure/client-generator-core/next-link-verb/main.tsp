import "@typespec/http";
import "@typespec/spector";
import "@azure-tools/typespec-client-generator-core";

using Http;
using Spector;
using Azure.ClientGenerator.Core;

@doc("Test for @nextLinkVerb decorator.")
@scenarioService("/azure/client-generator-core/next-link-verb")
@global.Azure.ClientGenerator.Core.clientNamespace(
  "azure.clientgenerator.core.nextlinkverb",
  "java"
)
@global.Azure.ClientGenerator.Core.clientNamespace(
  "specs.azure.clientgenerator.core.nextlinkverb",
  "python"
)
namespace _Specs_.Azure.ClientGenerator.Core.NextLinkVerb;

@doc("Test model.")
model Test {
  @doc("The id of the test.")
  id: string;
}

@doc("Paged response model.")
model ListTestResult {
  @pageItems
  @doc("List of items.")
  items: Test[];

  @nextLink
  @doc("Link to fetch more items.")
  nextLink?: string;
}

@scenario
@scenarioDoc("""
  Test for @nextLinkVerb decorator with POST verb.
  This operation should use POST for both the initial request and the next link request.
  
  Expected initial request: POST /azure/client-generator-core/next-link-verb/items
  Expected response body:
  ```json
  {
    "items": [
      {
        "id": "test1"
      }
    ],
    "nextLink": "http://localhost:3000/azure/client-generator-core/next-link-verb/items/page/2"
  }
  ```
  
  Expected next link request: POST /azure/client-generator-core/next-link-verb/items/page/2
  Expected response body:
  ```json
  {
    "items": [
      {
        "id": "test2"
      }
    ]
  }
  ```
  """)
@global.Azure.ClientGenerator.Core.Legacy.nextLinkVerb("POST")
@list
@route("/items")
@post
op listItems(): ListTestResult;
