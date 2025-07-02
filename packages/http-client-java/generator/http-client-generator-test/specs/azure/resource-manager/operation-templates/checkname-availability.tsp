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

interface CheckNameAvailability {
  @scenario
  @scenarioDoc("""
      Resource POST operation.
      Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.OperationTemplates/checkNameAvailability
      Expected query parameter: api-version=2023-12-01-preview
      Expected request body:
      ```json
      {
        "name": "checkName",
        "type": "Microsoft.Web/site"
      }
      ```
      Expected response body:
      ```json
      {
        "nameAvailable": false,
        "reason": "AlreadyExists",
        "message": "Hostname 'checkName' already exists. Please select a different name."
      }
      ```
    """)
  checkGlobal is checkGlobalNameAvailability;

  @scenario
  @scenarioDoc("""
      Resource POST operation.
      Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.OperationTemplates/locations/westus/checkNameAvailability
      Expected query parameter: api-version=2023-12-01-preview
      Expected request body:
      ```json
      {
        "name": "checkName",
        "type": "Microsoft.Web/site",
      }
      ```
      Expected response body:
      ```json
      {
        "nameAvailable": false,
        "reason": "AlreadyExists",
        "message": "Hostname 'checkName' already exists. Please select a different name."
      }
      ```
    """)
  checkLocal is checkLocalNameAvailability;
}
