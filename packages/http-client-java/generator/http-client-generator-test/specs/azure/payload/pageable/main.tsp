import "@typespec/spector";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using Spector;
using Versioning;
using global.Azure.Core;
using global.Azure.ClientGenerator.Core;

@doc("Test describing pageable.")
@scenarioService("/azure/payload/pageable")
@useDependency(global.Azure.Core.Versions.v1_0_Preview_2)
namespace _Specs_.Azure.Payload.Pageable;

@@clientNamespace(_Specs_.Azure.Payload.Pageable, "azure.payload.pageable", "java");

@doc("User model")
model User {
  @doc("User name")
  name: string;
}

#suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing pageable"
@scenario
@scenarioDoc("""
  List users.
  
  SDK may hide the "maxpagesize" from API signature. The functionality of "maxpagesize" could be in related language Page model.
  
  Expected query parameter:
  maxpagesize=3
  
  Expected response body:
  ```json
  {
    "value":[
      {
        "name":"user5"
      },
      {
        "name":"user6"
      },
      {
        "name":"user7"
      }
    ],
    "nextLink": "{endpoint}/azure/payload/pageable?skipToken=name-user7&maxpagesize=3"
  }
  ```
  
  Expected query parameter:
  skipToken=name-user7
  maxpagesize=3
  
  ```json
  {
    "value":[
      {
        "name":"user8"
      }
    ]
  }
  ```
  """)
@doc("List users")
op list(...MaxPageSizeQueryParameter): Page<User>;
