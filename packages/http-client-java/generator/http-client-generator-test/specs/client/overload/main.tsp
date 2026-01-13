import "@typespec/http";
import "@typespec/spector";
import "@azure-tools/typespec-client-generator-core";

using Http;
using Spector;

/**
 * Test for overload operation in .NET.
 */
@scenarioService("/client/overload")
namespace Client.Overload;

model Resource {
  id: string;
  name: string;
  scope: string;
}

#suppress "@azure-tools/typespec-client-generator-core/duplicate-client-name-warning" "Intentional overload for testing method overloading in C#"
@scenario
@scenarioDoc("""
  List all resources operation.
  
  Expected request: GET /client/overload/resources
  Expected response body:
  ```json
  [
    {"id": "1", "name": "foo", "scope": "car"},
    {"id": "2", "name": "bar", "scope": "bike"}
  ]
  ```
  """)
@route("/resources")
op list(): Resource[];

@scenario
@scenarioDoc("""
  List resources by scope operation. This operation uses `@clientName("list", "csharp")` to generate it as an overload method named "list" in C# client code, demonstrating method overloading capabilities.
  
  Expected request: GET /client/overload/resources/car
  Expected response body:
  ```json
  [
    {"id": "1", "name": "foo", "scope": "car"}
  ]
  ```
  """)
@route("/resources/{scope}")
op listByScope(@path scope: string): Resource[];
