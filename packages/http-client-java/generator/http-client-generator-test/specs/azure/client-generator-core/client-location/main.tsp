import "@typespec/http";
import "@typespec/spector";
import "@azure-tools/typespec-client-generator-core";

using Http;
using Spector;
using Azure.ClientGenerator.Core;

@doc("Test for @clientLocation decorator - moving operations between clients")
@scenarioService("/azure/client-generator-core/client-location")
@global.Azure.ClientGenerator.Core.clientNamespace(
  "azure.clientgenerator.core.clientlocation",
  "java"
)
namespace _Specs_.Azure.ClientGenerator.Core.ClientLocation;

// Scenario 1: Move an operation to another sub client (existing interface)
@scenarioDoc("""
  Test moving an operation from one sub client to another existing sub client.
  
  Operation `deleteUser` from interface `UserOperations` should be moved to interface `AdminOperations` using @clientLocation(AdminOperations).
  
  Expected client structure:
  - Interface UserOperations should contain only operation `getUser`
  - Interface AdminOperations should contain operations `getAdminInfo` and `deleteUser` (moved from UserOperations)
  """)
@scenario
namespace MoveToExistingSubClient {
  interface UserOperations {
    @route("/user")
    @get
    getUser(): void;

    @route("/user")
    @delete
    @global.Azure.ClientGenerator.Core.clientLocation(AdminOperations)
    deleteUser(): void;
  }

  interface AdminOperations {
    @route("/admin")
    @get
    getAdminInfo(): void;
  }
}

// Scenario 2: Move an operation to a new sub client (string name)
@scenarioDoc("""
  Test moving an operation to a new sub client specified by string name.
  
  Operation `archiveProduct` from interface `ProductOperations` should be moved to a new sub client named "ArchiveOperations" using @clientLocation("ArchiveOperations").
  
  Expected client structure:
  - Interface ProductOperations should contain only operation `listProducts`  
  - A new sub client "ArchiveOperations" should be created containing operation `archiveProduct`
  """)
@scenario
namespace MoveToNewSubClient {
  interface ProductOperations {
    @route("/products")
    @get
    listProducts(): void;

    @route("/products/archive")
    @post
    @global.Azure.ClientGenerator.Core.clientLocation("ArchiveOperations")
    archiveProduct(): void;
  }
}

// Scenario 3: Move an operation to root client
@scenarioDoc("""
  Test moving an operation to the root client.
  
  Operation `getHealthStatus` from interface `ResourceOperations` should be moved to the root client using @clientLocation(service namespace).
  
  Expected client structure:
  - Interface ResourceOperations should contain only operation `getResource`
  - Root client should contain operation `getHealthStatus` (moved from ResourceOperations)
  """)
@scenario
namespace MoveToRootClient {
  interface ResourceOperations {
    @route("/resource")
    @get
    getResource(): void;

    @route("/health")
    @get
    @global.Azure.ClientGenerator.Core.clientLocation(
      _Specs_.Azure.ClientGenerator.Core.ClientLocation
    )
    getHealthStatus(): void;
  }
}
