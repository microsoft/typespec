import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "@typespec/spector";

using Http;
using Rest;
using Versioning;
using Azure.Core;
using Azure.ResourceManager;
using OpenAPI;
using Spector;

namespace Azure.ResourceManager.CommonProperties;

@resource("confidentialResources")
model ConfidentialResource is TrackedResource<ConfidentialResourceProperties> {
  ...ResourceNameParameter<ConfidentialResource>;
}

@doc("Confidential Resource Properties.")
model ConfidentialResourceProperties {
  @visibility(Lifecycle.Read)
  @doc("The status of the last operation.")
  provisioningState: string;

  username: string;
}

/**
 * Api error.
 */
model ApiError {
  /**
   * The Api error details
   */
  details?: ApiErrorBase[];

  /**
   * The Api inner error
   */
  innererror?: InnerError;

  /**
   * The error code.
   */
  code?: string;

  /**
   * The target of the particular error.
   */
  target?: string;

  /**
   * The error message.
   */
  message?: string;
}

/**
 * Api error base.
 */
model ApiErrorBase {
  /**
   * The error code.
   */
  code?: string;

  /**
   * The target of the particular error.
   */
  target?: string;

  /**
   * The error message.
   */
  message?: string;
}

/**
 * Inner error details.
 */
model InnerError {
  /**
   * The exception type.
   */
  exceptiontype?: string;

  /**
   * The internal error message or exception dump.
   */
  errordetail?: string;
}

/**
 * An error response.
 */
@error
model CloudError {
  /**
   * Api error.
   */
  error?: ApiError;
}

@armResourceOperations
interface Error {
  @scenario
  @scenarioDoc("""
    Resource GET operation.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.CommonProperties/confidentialResources/confidential",
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected response status code: 404
    Expected response body:
    ```json
    {
      "error": {
        "code": "ResourceNotFound",
        "message": "The Resource 'Azure.ResourceManager.CommonProperties/confidentialResources/confidential' under resource group 'test-rg' was not found."
      }
    }
    ```
    """)
  getForPredefinedError is ArmResourceRead<ConfidentialResource>;

  @scenario
  @scenarioDoc("""
    Resource PUT operation.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.CommonProperties/confidentialResources/confidential",
    Expected query parameter: api-version=2023-12-01-preview
    Expected request body:
    ```json
    {
      "location": <any string>,
      "properties": {
        "username": "00"
      }
    }
    ```
    
    Expected response status code: 400
    Expected response body:
    ```json
    {
      "error": {
        "code": "BadRequest",
        "message": "Username should not contain only numbers.",
        "innererror": {
          "exceptiontype": "general"
        }
      }
    }
    ```
    """)
  createForUserDefinedError is ArmResourceCreateOrReplaceSync<
    ConfidentialResource,
    Error = CloudError
  >;
}
