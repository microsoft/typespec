/**
 * Test for enum with same name in different namespace
 * This is valid in TypeSpec, but will cause SDK generation problem.
 * For such cases, we should use client.tsp to rename one of them.
 */
import "@typespec/http";
import "@typespec/spector";
import "@azure-tools/typespec-client-generator-core";

using Http;
using Azure.ClientGenerator.Core;
using Spector;

@doc("Test for enum with same name in different namespace.")
@scenarioService("/client/naming/enum-conflict")
namespace Client.Naming.EnumConflict;

namespace FirstNamespace {
  @doc("Status enum in first namespace")
  enum Status {
    @doc("Active status")
    Active: "active",

    @doc("Inactive status")
    Inactive: "inactive",
  }

  model FirstModel {
    @doc("Status from first namespace")
    status: Status;

    @doc("Name of the item")
    name: string;
  }
}

namespace SecondNamespace {
  @doc("Status enum in second namespace")
  enum Status {
    @doc("Running status")
    Running: "running",

    @doc("Stopped status")
    Stopped: "stopped",
  }

  model SecondModel {
    @doc("Status from second namespace")
    status: Status;

    @doc("Description of the item")
    description: string;
  }
}

@operationGroup
@route("/first")
interface FirstOperations {
  @scenario
  @scenarioDoc("""
    Test enum with same name in different namespace - first namespace.
    Expected request body:
    ```json
    {"status": "active", "name": "test"}
    ```
    """)
  @post
  @doc("Operation using first namespace Status enum")
  first(@body body: FirstNamespace.FirstModel): FirstNamespace.FirstModel;
}

@operationGroup
@route("/second")
interface SecondOperations {
  @scenario
  @scenarioDoc("""
    Test enum with same name in different namespace - second namespace.
    Expected request body:
    ```json
    {"status": "running", "description": "test description"}
    ```
    """)
  @post
  @doc("Operation using second namespace Status enum")
  second(@body body: SecondNamespace.SecondModel): SecondNamespace.SecondModel;
}
