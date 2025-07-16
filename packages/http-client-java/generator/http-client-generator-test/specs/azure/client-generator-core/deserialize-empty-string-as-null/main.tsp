import "@typespec/http";
import "@typespec/spector";
import "@azure-tools/typespec-client-generator-core";

using Http;
using global.Azure.ClientGenerator.Core;
using Spector;

@doc("Test decorator @deserializeEmptyStringAsNull.")
@scenarioService("/azure/client-generator-core/deserialize-empty-string-as-null")
@global.Azure.ClientGenerator.Core.clientNamespace(
  "azure.clientgenerator.core.deserialize.emptystringnull",
  "java"
)
namespace _Specs_.Azure.ClientGenerator.Core.DeserializeEmptyStringAsNull;

@doc("This is a Model contains a string-like property of type url.")
model ResponseModel {
  @deserializeEmptyStringAsNull
  sampleUrl: url;
}

@scenario
@scenarioDoc("""
  This scenario will be used to test if client code can correctly deserializes an empty url as null.
  Expected response body:
  ```json
  {
    "serviceUrl": ""
  }
  ```
  """)
@route("/responseModel")
@get
op get(): ResponseModel;
