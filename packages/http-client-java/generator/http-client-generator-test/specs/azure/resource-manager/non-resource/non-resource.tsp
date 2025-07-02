import "@typespec/http";
import "@typespec/rest";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "@typespec/spector";

using TypeSpec.Http;
using TypeSpec.Rest;
using Azure.Core;
using Azure.ResourceManager;
using TypeSpec.OpenAPI;
using Spector;

namespace Azure.ResourceManager.NonResource;

/**
 * Though this model has `id`, `name`, `type` properties, it is not a resource as it doesn't extends `Resource`.
 */
model NonResource {
  /**
   * An id.
   */
  id?: string;

  /**
   * A name.
   */
  name?: string;

  /**
   * A type.
   */
  type?: string;
}

/**
 * Operations on non resource model should not be marked as `@armResourceOperations`.
 */
interface NonResourceOperations {
  @scenario
  @scenarioDoc("""
    It's non-resource get operation operating on non-resource model, though the model has `id`, `name`, `type` properties.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Microsoft.NonResource/locations/eastus/otherParameters/hello
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected response body:
    ```json
    {
      "id": "id",
      "name": "hello",
      "type": "nonResource"
    }
    ```
    """)
  @route("/subscriptions/{subscriptionId}/providers/Microsoft.NonResource/locations/{location}/otherParameters/{parameter}")
  @get
  get(
    ...ApiVersionParameter,
    ...SubscriptionIdParameter,

    /**
     * The location parameter.
     */
    @path
    location: string,

    /**
     * Another parameter.
     */
    @path
    parameter: string,
  ): ArmResponse<NonResource> | ErrorResponse;

  @scenario
  @scenarioDoc("""
    It's non-resource put operation operating on non-resource model, though the model has `id`, `name`, `type` properties.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Microsoft.NonResource/locations/eastus/otherParameters/hello
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected request body:
    ```json
    {
      "id": "id",
      "name": "hello",
      "type": "nonResource"
    }
    ```
    
    Expected response body:
    ```json
    {
      "id": "id",
      "name": "hello",
      "type": "nonResource"
    }
    ```
    """)
  @route("/subscriptions/{subscriptionId}/providers/Microsoft.NonResource/locations/{location}/otherParameters/{parameter}")
  @put
  create(
    ...ApiVersionParameter,
    ...SubscriptionIdParameter,

    /**
     * The location parameter.
     */
    @path
    location: string,

    /**
     * Another parameter.
     */
    @path
    parameter: string,

    /**
     * The request body.
     */
    @body
    body: NonResource,
  ): ArmResponse<NonResource> | ErrorResponse;
}
