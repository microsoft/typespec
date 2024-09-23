import "@typespec/http";
import "@azure-tools/cadl-ranch-expect";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

/**
 * Describe changing names of types in a client with `@clientName`
 */
@supportedBy("dpg")
@scenarioService("/client/naming")
namespace Client.Naming;

@route("/property")
namespace Property {
  model LanguageClientNameModel {
    @doc("Pass in true")
    @clientName("CSName", "csharp")
    @clientName("GoName", "go")
    @clientName("JavaName", "java")
    @clientName("TSName", "javascript")
    @clientName("python_name", "python")
    defaultName: boolean;
  }

  model ClientNameModel {
    @doc("Pass in true")
    @clientName("clientName")
    defaultName: boolean;
  }

  model ClientNameAndJsonEncodedNameModel {
    @doc("Pass in true")
    @clientName("clientName")
    @encodedName("application/json", "wireName")
    defaultName: boolean;
  }

  @scenario
  @scenarioDoc("""
    Testing that we can project the client name in our generated SDKs.
    Your generated SDK should generate ClientNameModel with one property `clientName` with wire name `defaultName`.
    
    Expected request body:
    ```json
    {"defaultName": true}
    ```
    """)
  @route("/client")
  @post
  op client(@body body: ClientNameModel): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Testing that we can project the language specific name in our generated SDKs.
    Your generated SDK should generate LanguageClientNameModel with one property with your language specific property name and wire name `defaultName`.
    
    Expected request body:
    ```json
    {"defaultName": true}
    ```
    """)
  @route("/language")
  @post
  op language(@body body: LanguageClientNameModel): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Testing that we can project the client name and the wire name.
    Your generated SDK should generate ClientNameAndJsonEncodedNameModel with one property with client name `clientName` and wire name `wireName`.
    
    Expected request body:
    ```json
    {"wireName": true}
    ```
    """)
  @route("/compatible-with-encoded-name")
  @post
  op compatibleWithEncodedName(@body body: ClientNameAndJsonEncodedNameModel): NoContentResponse;
}

@scenario
@scenarioDoc("""
  Testing that we can project the operation name.
  Your generated SDK should generate an operation called `clientName`.
  
  Expected status code: 204
  """)
@route("/operation")
@clientName("clientName")
@post
op operation(): NoContentResponse;

@scenario
@scenarioDoc("""
  Testing that we can project a parameter name.
  Your generated SDK should generate an operation `parameter` with a single parameter called `clientName`.
  
  Expected query parameter: `defaultName="true"`
  
  """)
@route("/parameter")
@post
op parameter(
  @clientName("clientName")
  @query
  defaultName: string,
): NoContentResponse;

@route("/header")
namespace Header {
  @scenario
  @scenarioDoc("""
    Testing that we can project a header name.
    Your generated SDK should generate an operation header `parameter` with a single parameter called `clientName`.
    
    Expected header parameter: `default-name="true"`
    """)
  @post
  op request(
    @clientName("clientName")
    @header
    `default-name`: string,
  ): void;

  @scenario
  @scenarioDoc("""
    Testing that we can project a header name.
    Your generated SDK should generate an operation header `parameter` with a single parameter called `clientName`.
    
    Expected response header: `default-name="true"`
    """)
  @get
  op response(): {
    @statusCode _: 204;

    @clientName("clientName")
    @header
    `default-name`: string;
  };
}

@route("/model")
@operationGroup
@clientName("ClientModel")
namespace Model {
  @clientName("CSModel", "csharp")
  @clientName("GoModel", "go")
  @clientName("JavaModel", "java")
  @clientName("TSModel", "javascript")
  @clientName("PythonModel", "python")
  model ModelWithLanguageClientName {
    @doc("Pass in true")
    defaultName: boolean;
  }

  @clientName("ClientModel")
  model ModelWithClientClientName {
    @doc("Pass in true")
    defaultName: boolean;
  }

  @scenario
  @scenarioDoc("""
    Testing that we can project the client name in our generated SDKs.
    Your generated SDK should generate the model with name `ClientModel`.
    
    Expected request body:
    ```json
    {"defaultName": true}
    ```
    """)
  @route("/client")
  @post
  op client(@bodyRoot body: ModelWithClientClientName): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Testing that we can project the language specific name in our generated SDKs.
    Your generated SDK should generate the model with your language specific model name.
    
    Expected request body:
    ```json
    {"defaultName": true}
    ```
    """)
  @route("/language")
  @post
  op language(@bodyRoot body: ModelWithLanguageClientName): NoContentResponse;
}

@operationGroup
@route("/union-enum")
namespace UnionEnum {
  @clientName("ClientExtensibleEnum")
  union ServerExtensibleEnum {
    string,
    EnumValue1: "value1",
  }

  union ExtensibleEnum {
    string,

    @clientName("ClientEnumValue1")
    EnumValue1: "value1",

    @clientName("ClientEnumValue2")
    "value2",
  }

  @scenario
  @scenarioDoc("""
      Testing that we can project a enum name and enum value name.
      Your generated SDK should generate an Enum "ClientExtensibleEnum".
      (The exact name may depend on language convention)
    
      Expected request body:
      ```json
      "value1"
      ```
    """)
  @route("/union-enum-name")
  @post
  op unionEnumName(@body body: ServerExtensibleEnum): NoContentResponse;

  @scenario
  @scenarioDoc("""
      Testing that we can project a enum name and enum value name.
      Your generated SDK should generate an Enum with members "ClientEnumValue1", "ClientEnumValue2".
      (The exact name may depend on language convention)
    
      Expected request body:
      ```json
      "value1"
      ```
    """)
  @route("/union-enum-member-name")
  @post
  op unionEnumMemberName(@body body: ExtensibleEnum): NoContentResponse;
}
