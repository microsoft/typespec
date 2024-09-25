import "@azure-tools/cadl-ranch-expect";
import "@azure-tools/typespec-azure-core";
import "@typespec/versioning";

using TypeSpec.Versioning;
using Azure.Core;

@doc("Test describing pageable.")
@supportedBy("dpg")
@scenarioService("/payload/pageable")
@useDependency(global.Azure.Core.Versions.v1_0_Preview_2)
namespace Payload.Pageable;

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
    "nextLink": "{endpoint}/payload/pageable?skipToken=name-user7&maxpagesize=3"
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
