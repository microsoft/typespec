import "@typespec/http";
import "@typespec/rest";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "@typespec/spector";

using Http;
using Rest;
using Azure.Core;
using Azure.ResourceManager;
using OpenAPI;
using Spector;

namespace Azure.ResourceManager.OperationTemplates;

@resource("widgets")
model Widget is TrackedResource<WidgetProperties> {
  ...ResourceNameParameter<Widget>;
}

model WidgetProperties {
  @doc("The name of the widget.")
  name?: string;

  @doc("The description of the widget.")
  description?: string;

  @doc("The provisioning state of the widget.")
  @visibility(Lifecycle.Read)
  provisioningState?: string;
}

// Request models for optional body scenarios

model ActionRequest {
  @doc("The action type to perform.")
  actionType?: string;

  @doc("Additional action parameters.")
  parameters?: string;
}

model ActionResult {
  @doc("The result of the action.")
  result: string;
}

model ChangeAllowanceRequest {
  @doc("The new total allowed widgets.")
  totalAllowed?: int32;

  @doc("The reason for the change.")
  reason?: string;
}

model ChangeAllowanceResult {
  @doc("The new total allowed widgets.")
  totalAllowed: int32;

  @doc("The status of the change.")
  status: string;
}

@armResourceOperations
interface OptionalBody {
  @scenario
  @scenarioDoc("""
    Resource GET operation to retrieve a widget.
    
    Expected verb: GET
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.OperationTemplates/widgets/widget1
    Expected query parameter: api-version=2023-12-01-preview
    Expected status code: 200
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.OperationTemplates/widgets/widget1",
      "name": "widget1",
      "type": "Azure.ResourceManager.OperationTemplates/widgets",
      "location": "eastus",
      "properties": {
        "name": "widget1",
        "description": "A test widget",
        "provisioningState": "Succeeded"
      },
      "systemData": {
        "createdBy": "AzureSDK",
        "createdByType": "User",
        "createdAt": <any date>,
        "lastModifiedBy": "AzureSDK",
        "lastModifiedAt": <any date>,
        "lastModifiedByType": "User"
      }
    }
    ```
    """)
  get is ArmResourceRead<Widget>;

  @scenario
  @scenarioDoc("""
    Resource PATCH operation using Legacy.CustomPatchSync with optional request body.
    This tests the optional body functionality in two scenarios:
    1. Empty body scenario: Request body is not sent
    2. With body scenario: Request body contains update data
    
    Expected verb: PATCH  
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.OperationTemplates/widgets/widget1
    Expected query parameter: api-version=2023-12-01-preview
    
    Scenario 1 - Expected request body: None (empty body)
    Scenario 2 - Expected request body: {"properties": {"name": "updated-widget", "description": "Updated description"}}
    
    Expected status code: 200
    Expected response body (empty body scenario):
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.OperationTemplates/widgets/widget1",
      "name": "widget1",
      "type": "Azure.ResourceManager.OperationTemplates/widgets",
      "location": "eastus",
      "properties": {
        "name": "widget1",
        "description": "A test widget",
        "provisioningState": "Succeeded"
      },
      "systemData": {
        "createdBy": "AzureSDK",
        "createdByType": "User",
        "createdAt": <any date>,
        "lastModifiedBy": "AzureSDK",
        "lastModifiedAt": <any date>,
        "lastModifiedByType": "User"
      }
    }
    ```
    
    Expected response body (with body scenario):
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.OperationTemplates/widgets/widget1",
      "name": "widget1",
      "type": "Azure.ResourceManager.OperationTemplates/widgets",
      "location": "eastus",
      "properties": {
        "name": "updated-widget",
        "description": "Updated description",
        "provisioningState": "Succeeded"
      },
      "systemData": {
        "createdBy": "AzureSDK",
        "createdByType": "User",
        "createdAt": <any date>,
        "lastModifiedBy": "AzureSDK",
        "lastModifiedAt": <any date>,
        "lastModifiedByType": "User"
      }
    }
    ```
    """)
  patch is Azure.ResourceManager.Legacy.CustomPatchSync<Widget, Widget, OptionalRequestBody = true>;

  @scenario
  @scenarioDoc("""
    Resource POST action operation using ArmResourceActionSync with optional request body.
    This tests the optional body functionality in two scenarios:
    1. Empty body scenario: Request body is not sent
    2. With body scenario: Request body contains action data
    
    Expected verb: POST
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.OperationTemplates/widgets/widget1/post
    Expected query parameter: api-version=2023-12-01-preview
    
    Scenario 1 - Expected request body: None (empty body)
    Scenario 2 - Expected request body: {"actionType": "perform", "parameters": "test-parameters"}
    
    Expected status code: 200
    Expected response body (empty body scenario):
    ```json
    {
      "result": "Action completed successfully"
    }
    ```
    
    Expected response body (with body scenario):
    ```json
    {
      "result": "Action completed successfully with parameters"
    }
    ```
    """)
  post is ArmResourceActionSync<Widget, ActionRequest, ActionResult, OptionalRequestBody = true>;

  @scenario
  @scenarioDoc("""
    Provider POST action operation using ArmProviderActionSync with optional request body.
    This tests the optional body functionality for subscription-scoped provider actions in two scenarios:
    1. Empty body scenario: Request body is not sent (uses default allowance)
    2. With body scenario: Request body contains allowance change data
    
    Expected verb: POST
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.OperationTemplates/providerPost
    Expected query parameter: api-version=2023-12-01-preview
    
    Scenario 1 - Expected request body: None (empty body)
    Scenario 2 - Expected request body: {"totalAllowed": 100, "reason": "Increased demand"}
    
    Expected status code: 200
    Expected response body (empty body scenario):
    ```json
    {
      "totalAllowed": 50,
      "status": "Changed to default allowance"
    }
    ```
    
    Expected response body (with body scenario):
    ```json
    {
      "totalAllowed": 100,
      "status": "Changed to requested allowance"
    }
    ```
    """)
  providerPost is ArmProviderActionSync<
    ChangeAllowanceRequest,
    ChangeAllowanceResult,
    SubscriptionActionScope,
    {},
    ErrorResponse,
    OptionalRequestBody = true
  >;
}
