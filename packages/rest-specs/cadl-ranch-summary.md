# Cadl Ranch Project summary

### Authentication_ApiKey_invalid

- Endpoint: `get /authentication/api-key/invalid`

Expect error code 403 and error body:

```json
{
  "error": {
    "code": "InvalidApiKey",
    "message": "API key is invalid"
  }
}
```

### Authentication_ApiKey_valid

- Endpoint: `get /authentication/api-key/valid`

Expects header 'x-ms-api-key': 'valid-key'

### Authentication_Http_Custom_invalid

- Endpoint: `get /authentication/http/custom/invalid`

Expect error code 403 and error body:

```json
{
  "error": "invalid-api-key"
}
```

### Authentication_Http_Custom_valid

- Endpoint: `get /authentication/http/custom/valid`

Expects header 'Authorization': 'SharedAccessKey valid-key'

### Authentication_OAuth2_invalid

- Endpoint: `get /authentication/oauth2/invalid`

Expect error code 400 and error body:

```json
{
  "message": "Expected Bearer x but got Bearer y",
  "expected": "Bearer x",
  "actual": "Bearer y"
}
```

### Authentication_OAuth2_valid

- Endpoint: `get /authentication/oauth2/valid`

Expects header 'authorization': 'Bearer https://security.microsoft.com/.default'

### Authentication_Union_validKey

- Endpoint: `get /authentication/union/validkey`

Expects header 'x-ms-api-key': 'valid-key'

### Authentication_Union_validToken

- Endpoint: `get /authentication/union/validtoken`

Expects header 'authorization': 'Bearer https://security.microsoft.com/.default'

### Azure_ClientGenerator_Core_Access_InternalOperation

- Endpoints:
  - `get /azure/client-generator-core/access/internalOperation/noDecoratorInInternal`
  - `get /azure/client-generator-core/access/internalOperation/internalDecoratorInInternal`
  - `get /azure/client-generator-core/access/internalOperation/publicDecoratorInInternal`

This scenario contains internal operations. All should be generated but not exposed.
Expected query parameter: name=<any string>
Expected response body:

```json
{
  "name": <any string>
}
```

### Azure_ClientGenerator_Core_Access_PublicOperation

- Endpoints:
  - `get /azure/client-generator-core/access/publicOperation/noDecoratorInPublic`
  - `get /azure/client-generator-core/access/publicOperation/publicDecoratorInPublic`

This scenario contains public operations. It should be generated and exported.
Expected query parameter: name=<any string>
Expected response body:

```json
{
  "name": <any string>
}
```

### Azure_ClientGenerator_Core_Access_RelativeModelInOperation

- Endpoints:
  - `get /azure/client-generator-core/access/relativeModelInOperation/operation`
  - `get /azure/client-generator-core/access/relativeModelInOperation/discriminator`

This scenario contains internal operations. All should be generated but not exposed.

### Azure_ClientGenerator_Core_Access_SharedModelInOperation

- Endpoints:
  - `get /azure/client-generator-core/access/sharedModelInOperation/public`
  - `get /azure/client-generator-core/access/sharedModelInOperation/internal`

This scenario contains two operations, one public, another internal. The public one should be generated and exported while the internal one should be generated but not exposed.
Expected query parameter: name=<any string>
Expected response body:

```json
{
  "name": <any string>
}
```

### Azure_ClientGenerator_Core_FlattenProperty_putFlattenModel

- Endpoint: `put /azure/client-generator-core/flatten-property/flattenModel`

Update and receive model with 1 level of flattening.
Expected input body:

```json
{
  "name": "foo",
  "properties": {
    "description": "bar",
    "age": 10
  }
}
```

Expected response body:

```json
{
  "name": "test",
  "properties": {
    "description": "test",
    "age": 1
  }
}
```

### Azure_ClientGenerator_Core_FlattenProperty_putNestedFlattenModel

- Endpoint: `put /azure/client-generator-core/flatten-property/nestedFlattenModel`

Update and receive model with 2 levels of flattening.
Expected input body:

```json
{
  "name": "foo",
  "properties": {
    "summary": "bar",
    "properties": {
      "description": "test",
      "age": 10
    }
  }
}
```

Expected response body:

```json
{
  "name": "test",
  "properties": {
    "summary": "test",
    "properties": {
      "description": "foo",
      "age": 1
    }
  }
}
```

### Azure_ClientGenerator_Core_Usage_ModelInOperation

- Endpoints:
  - `post /azure/client-generator-core/usage/inputToInputOutput`
  - `post /azure/client-generator-core/usage/outputToInputOutput`
  - `post /azure/client-generator-core/usage/modelInReadOnlyProperty`

This scenario contains two public operations. Both should be generated and exported.
The models are override to roundtrip, so they should be generated and exported as well.

### Azure_Core_Basic_createOrReplace

- Endpoint: `get /azure/core/basic`

Should only generate models named User and UserOrder.

Expected path parameter: id=1
Expected query parameter: api-version=2022-12-01-preview

Expected input body:

```json
{
  "name": "Madge"
}
```

Expected response body:

```json
{
  "id": 1,
  "name": "Madge",
  "etag": "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
}
```

### Azure_Core_Basic_createOrUpdate

- Endpoint: `get /azure/core/basic`

Should only generate models named User and UserOrder.

Expected path parameter: id=1
Expected query parameter: api-version=2022-12-01-preview

Expected input body:

```json
{
  "name": "Madge"
}
```

Expected response body:

```json
{
  "id": 1,
  "name": "Madge"
}
```

### Azure_Core_Basic_delete

- Endpoint: `get /azure/core/basic`

Expected path parameter: id=1

Expected query parameter: api-version=2022-12-01-preview

Expected response of status code 204 with empty body.

### Azure_Core_Basic_export

- Endpoint: `get /azure/core/basic`

Should only generate models named User and UserOrder.

Expected path parameter: id=1
Expected query parameter: format=json
Expected query parameter: api-version=2022-12-01-preview

Expected response body:

```json
{
  "id": 1,
  "name": "Madge",
  "etag": "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
}
```

### Azure_Core_Basic_exportAllUsers

- Endpoint: `post /azure/core/basic`

Should generate a model named User.

Expected query parameter: format=json
Expected query parameter: api-version=2022-12-01-preview

Expected response body:

```json
{
  "users": [
    {
      "id": 1,
      "name": "Madge",
      "etag": "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
    },
    {
      "id": 2,
      "name": "John",
      "etag": "22bdc430-65e8-45ad-81d9-8ffa60d55b59"
    }
  ]
}
```

### Azure_Core_Basic_get

- Endpoint: `get /azure/core/basic`

Should only generate models named User and UserOrder.

Expected path parameter: id=1
Expected query parameter: api-version=2022-12-01-preview

Expected response body:

```json
{
  "id": 1,
  "name": "Madge",
  "etag": "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
}
```

### Azure_Core_Basic_list

- Endpoint: `get /azure/core/basic`

Should only generate models named User and UserOrder.

Should not generate visible model like CustomPage.

Expected query parameter: api-version=2022-12-01-preview&top=5&skip=10&orderby=id&filter=id%20lt%2010&select=id&select=orders&select=etag&expand=orders

Expected response body:

```json
{
  "value": [
    {
      "id": 1,
      "name": "Madge",
      "etag": "11bdc430-65e8-45ad-81d9-8ffa60d55b59",
      "orders": [{ "id": 1, "userId": 1, "detail": "a recorder" }]
    },
    {
      "id": 2,
      "name": "John",
      "etag": "11bdc430-65e8-45ad-81d9-8ffa60d55b5a",
      "orders": [{ "id": 2, "userId": 2, "detail": "a TV" }]
    }
  ]
}
```

### Azure_Core_Lro_Rpc_longRunningRpc

- Endpoint: `post /azure/core/lro/rpc/generations:submit`

Should generate model GenerationOptions and GenerationResult.
GenerationResponse could be generated, depending on implementation.

Expected verb: POST
Expected request body:

```json
{
  "prompt": "text"
}
```

Expected status code: 202
Expected response header: operation-location={endpoint}/generations/operations/operation1
Expected response body:

```json
{
  "id": "operation1",
  "status": "InProgress"
}
```

Expected verb: GET
Expected URL: {endpoint}/generations/operations/operation1

Expected status code: 200
Expected response body:

```json
{
  "id": "operation1",
  "status": "InProgress"
}
```

Expected verb: GET
Expected URL: {endpoint}/generations/operations/operation1

Expected status code: 200
Expected response body:

```json
{
  "id": "operation1",
  "status": "Succeeded",
  "result": {
    "data": "text data"
  }
}
```

### Azure_Core_Lro_Standard_createOrReplace

- Endpoint: `get /azure/core/lro/standard`

Should only generate one model named User.

Expected verb: PUT
Expected path parameter: name=madge

Expected request body:

```json
{
  "role": "contributor"
}
```

Expected status code: 201
Expected response header: operation-location={endpoint}/users/madge/operations/operation1
Expected response body:

```json
{
  "name": "madge",
  "role": "contributor"
}
```

Expected verb: GET
Expected URL: {endpoint}/users/madge/operations/operation1

Expected status code: 200
Expected response body:

```json
{
  "id": "operation1",
  "status": "InProgress"
}
```

Expected verb: GET
Expected URL: {endpoint}/users/madge/operations/operation1

Expected status code: 200
Expected response body:

```json
{
  "id": "operation1",
  "status": "Succeeded"
}
```

(The last GET call on resource URL is optional)
Expected verb: GET
Expected URL: {endpoint}/users/madge

Expected status code: 200
Expected response body:

```json
{
  "name": "madge",
  "role": "contributor"
}
```

### Azure_Core_Lro_Standard_delete

- Endpoint: `get /azure/core/lro/standard`

Expected verb: DELETE
Expected path parameter: name=madge

Expected status code: 202
Expected response header: operation-location={endpoint}/users/madge/operations/operation2
Expected response body:

```json
{
  "id": "operation2",
  "status": "InProgress"
}
```

Expected verb: GET
Expected URL: {endpoint}/users/madge/operations/operation2

Expected status code: 200
Expected response body:

```json
{
  "id": "operation2",
  "status": "InProgress"
}
```

Expected verb: GET
Expected URL: {endpoint}/users/madge/operations/operation2

Expected status code: 200
Expected response body:

```json
{
  "id": "operation2",
  "status": "Succeeded"
}
```

### Azure_Core_Lro_Standard_export

- Endpoint: `get /azure/core/lro/standard`

Should only generate one model named ExportedUser.

Expected verb: POST
Expected path parameter: name=madge
Expected query parameter: format=json

Expected status code: 202
Expected response header: operation-location={endpoint}/users/madge/operations/operation3
Expected response body:

```json
{
  "id": "operation3",
  "status": "InProgress"
}
```

Expected verb: GET
Expected URL: {endpoint}/users/madge/operations/operation3

Expected status code: 200
Expected response body:

```json
{
  "id": "operation3",
  "status": "InProgress"
}
```

Expected verb: GET
Expected URL: {endpoint}/users/madge/operations/operation3

Expected status code: 200
Expected response body:

```json
{
  "id": "operation3",
  "status": "Succeeded",
  "result": {
    "name": "madge",
    "resourceUri": "/users/madge"
  }
}
```

### Azure_Core_Model_AzureCoreEmbeddingVector_get

- Endpoint: `get /azure/core/model/embeddingVector`

Expect to handle an embedding vector. Mock api will return [0, 1, 2, 3, 4]

### Azure_Core_Model_AzureCoreEmbeddingVector_post

- Endpoint: `post /azure/core/model/embeddingVector`

Expect to send a model which has an embedding vector property.

Expected request body:

```json
{ "embedding": [0, 1, 2, 3, 4] }
```

Expected response body:

```json
{ "embedding": [5, 6, 7, 8, 9] }
```

### Azure_Core_Model_AzureCoreEmbeddingVector_put

- Endpoint: `put /azure/core/model/embeddingVector`

Expect to send an embedding vector. Mock api expect to receive [0, 1, 2, 3, 4]

### Azure_Core_Page_listWithCustomPageModel

- Endpoint: `get /azure/core/page/custom-page`

Should ideally only generate models named User and UserOrder. If your language has to, you can also generate CustomPageModel

Expected query parameter: api-version=2022-12-01-preview

Expected response body:

```json
{
  "items": [
    {
      "id": 1,
      "name": "Madge",
      "etag": "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
    }
  ]
}
```

### Azure_Core_Page_listWithPage

- Endpoint: `get /azure/core/page/page`

Should only generate models named User and UserOrder.

Should not generate visible model like Page.

Expected query parameter: api-version=2022-12-01-preview

Expected response body:

```json
{
  "value": [
    {
      "id": 1,
      "name": "Madge",
      "etag": "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
    }
  ]
}
```

### Azure_Core_Page_listWithParameters

- Endpoint: `get /azure/core/page/parameters`

Expected query parameter: api-version=2022-12-01-preview&another=Second

Expected body parameter: {"inputName": "Madge"}

Expected response body:

```json
{
  "value": [
    {
      "id": 1,
      "name": "Madge",
      "etag": "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
    }
  ]
}
```

### Azure_Core_Page_TwoModelsAsPageItem

- Endpoints:
  - `get /azure/core/page/first-item`
  - `get /azure/core/page/second-item`

This scenario is to test two operations with two different page item types.

### Azure_Core_Scalar_AzureLocationScalar_get

- Endpoint: `get /azure/core/scalar/azureLocation`

Expect to handle a azureLocation value. Mock api will return 'eastus'

### Azure_Core_Scalar_AzureLocationScalar_header

- Endpoint: `post /azure/core/scalar/azureLocation/header`

Expect to send a azureLocation value as header.
Expected header parameter: `region="eastus"`

### Azure_Core_Scalar_AzureLocationScalar_post

- Endpoint: `post /azure/core/scalar/azureLocation`

Expect to send a model which has an azureLocation property.

Expected request body:

```json
{ "location": "eastus" }
```

Expected response body:

```json
{ "location": "eastus" }
```

### Azure_Core_Scalar_AzureLocationScalar_put

- Endpoint: `put /azure/core/scalar/azureLocation`

Expect to send a azureLocation value. Mock api expect to receive 'eastus'

### Azure_Core_Scalar_AzureLocationScalar_query

- Endpoint: `post /azure/core/scalar/azureLocation/query`

Expect to send a azureLocation value as query.
Expected query parameter: `region="eastus"`

### Azure_Core_Traits_repeatableAction

- Endpoint: `get /azure/core/traits`

Expected path parameter: id=1
Expected header parameters:

- repeatability-request-id=<any uuid>
- repeatability-first-sent=<any HTTP header date>
  Expected request body:

```json
{
  "userActionValue": "test"
}
```

Expected response header:

- repeatability-result=accepted
  Expected response body:

```json
{
  "userActionResult": "test"
}
```

### Azure_Core_Traits_smokeTest

- Endpoint: `get /azure/core/traits`

SDK should not genreate `clientRequestId` paramerter but use policy to auto-set the header.
Expected path parameter: id=1
Expected query parameter: api-version=2022-12-01-preview
Expected header parameters:

- foo=123
- if-match=valid
- if-none-match=invalid
- if-unmodified-since=Fri, 26 Aug 2022 14:38:00 GMT
- if-modified-since=Thu, 26 Aug 2021 14:38:00 GMT
- x-ms-client-request-id=<any uuid string>

Expected response header:

- bar="456"
- x-ms-client-request-id=<uuid string same with request header>
- etag="11bdc430-65e8-45ad-81d9-8ffa60d55b59"

Expected response body:

```json
{
  "id": 1,
  "name": "Madge"
}
```

### Azure_ResourceManager_Models_CommonTypes_ManagedIdentity_ManagedIdentityTrackedResources_createWithSystemAssigned

- Endpoint: `put https://management.azure.com`

Resource PUT operation.
Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.CommonTypes.ManagedIdentity/managedIdentityTrackedResources/identity",
Expected query parameter: api-version=2023-12-01-preview
Expected request body:

```json
{
  "location": "eastus",
  "tags": {
    "tagKey1": "tagValue1"
  },
  "properties": {},
  "identity": {
    "type": "SystemAssigned"
  }
}
```

Expected response body:

```json
{
  "id":"/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.CommonTypes.ManagedIdentity/managedIdentityTrackedResources/identity",
  "location": "eastus",
  "tags": {
    "tagKey1": "tagValue1"
  },
  "identity": {
    "type": "SystemAssigned",
    "principalId": <any uuid string>,
    "tenantId": <any uuid string>
   },
  "properties": {
    "provisioningState": "Succeeded"
  }
}
```

### Azure_ResourceManager_Models_CommonTypes_ManagedIdentity_ManagedIdentityTrackedResources_get

- Endpoint: `get https://management.azure.com`

Resource GET operation.
Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.CommonTypes.ManagedIdentity/managedIdentityTrackedResources/identity",
Expected query parameter: api-version=2023-12-01-preview

Expected response body:

```json
{
  "id":"/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.CommonTypes.ManagedIdentity/managedIdentityTrackedResources/identity",
  "location": "eastus",
  "tags": {
    "tagKey1": "tagValue1"
  },
  "identity": {
    "type": "SystemAssigned",
    "principalId": <any uuid string>
    "tenantId": <any uuid string>
   },
  "properties": {
    "provisioningState": "Succeeded"
  }
}
```

### Azure_ResourceManager_Models_CommonTypes_ManagedIdentity_ManagedIdentityTrackedResources_updateWithUserAssignedAndSystemAssigned

- Endpoint: `patch https://management.azure.com`

Resource PATCH operation.
Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.CommonTypes.ManagedIdentity/managedIdentityTrackedResources/identity",
Expected query parameter: api-version=2023-12-01-preview
Expected request body:

```json
{
  "identity": {
    "type": "SystemAssigned,UserAssigned",
    "userAssignedIdentities": {
      "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id1": {}
    }
  }
}
```

Expected response body:

```json
{
  "id":"/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.CommonTypes.ManagedIdentity/managedIdentityTrackedResources/identity",
  "location": "eastus",
  "tags": {
    "tagKey1": "tagValue1"
  },
  "identity": {
    "type": "SystemAssigned,UserAssigned",
    "userAssignedIdentities": {
      "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id1": {
        "principalId": <any uuid string>,
        "clientId": <any uuid string>
      },
    },
    "principalId": <any uuid string>,
    "tenantId": <any uuid string>
  },
  "properties": {
    "provisioningState": "Succeeded"
  }
}
```

### Azure_ResourceManager_Models_Resources_NestedProxyResources_createOrReplace

- Endpoint: `put https://management.azure.com`

Resource PUT operation.
Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/nestedProxyResources/nested
Expected query parameter: api-version=2023-12-01-preview
Expected request body:

```json
{
  "properties": {
    "description": "valid"
  }
}
```

Expected response body:

```json
{
  "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/nestedProxyResources/nested",
  "name": "nested",
  "type": "nested",
  "properties":{
    "description": "valid",
    "provisioningState": "Succeeded"
  },
  "systemData": {
    "createdBy": "AzureSDK",
    "createdByType": "User",
    "createdAt": <any date>,
    "lastModifiedBy": "AzureSDK",
    "lastModifiedAt": <any date>,
    "lastModifiedByType": "User",
  }
}
```

### Azure_ResourceManager_Models_Resources_NestedProxyResources_delete

- Endpoint: `delete https://management.azure.com`

Resource DELETE operation.
Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/nestedProxyResources/nested
Expected query parameter: api-version=2023-12-01-preview
Expected response status code: 204

### Azure_ResourceManager_Models_Resources_NestedProxyResources_get

- Endpoint: `get https://management.azure.com`

Resource GET operation.
Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/nestedProxyResources/nested
Expected query parameter: api-version=2023-12-01-preview

Expected response body:

```json
{
  "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/nestedProxyResources/nested",
  "name": "nested",
  "type": "nested",
  "properties":{
    "description": "valid",
    "provisioningState": "Succeeded"
  },
  "systemData": {
    "createdBy": "AzureSDK",
    "createdByType": "User",
    "createdAt": <any date>,
    "lastModifiedBy": "AzureSDK",
    "lastModifiedAt": <any date>,
    "lastModifiedByType": "User",
  }
}
```

### Azure_ResourceManager_Models_Resources_NestedProxyResources_listByTopLevelTrackedResource

- Endpoint: `get https://management.azure.com`

Resource LIST by parent resource operation.
Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/nestedProxyResources/nested
Expected query parameter: api-version=2023-12-01-preview

Expected response body:

```json
{
  "value": [{
    "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/nestedProxyResources/nested",
    "name": "nested",
    "type": "nested",
    "properties":{
      "description": "valid",
      "provisioningState": "Succeeded"
    },
    "systemData": {
      "createdBy": "AzureSDK",
      "createdByType": "User",
      "createdAt": <any date>,
      "lastModifiedBy": "AzureSDK",
      "lastModifiedAt": <any date>,
      "lastModifiedByType": "User",
    }
  }]
}
```

### Azure_ResourceManager_Models_Resources_NestedProxyResources_update

- Endpoint: `patch https://management.azure.com`

Resource PATCH operation.
Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/nestedProxyResources/nested
Expected query parameter: api-version=2023-12-01-preview
Expected request body:

```json
{
  "properties": {
    "description": "valid2"
  }
}
```

Expected response body:

```json
{
  "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/nestedProxyResources/nested",
  "name": "nested",
  "type": "nested",
  "properties":{
    "description": "valid2",
    "provisioningState": "Succeeded"
  },
  "systemData": {
    "createdBy": "AzureSDK",
    "createdByType": "User",
    "createdAt": <any date>,
    "lastModifiedBy": "AzureSDK",
    "lastModifiedAt": <any date>,
    "lastModifiedByType": "User",
  }
}
```

### Azure_ResourceManager_Models_Resources_SingletonTrackedResources_createOrUpdate

- Endpoint: `put https://management.azure.com`

Resource PUT operation.
Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources/default
Expected query parameter: api-version=2023-12-01-preview
Expected request body:

```json
{
  "location": "eastus",
  "properties": {
    "description": "valid"
  }
}
```

Expected response body:

```json
{
  "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources/default",
  "name": "default",
  "type": "Azure.ResourceManager.Models.Resources/singletonTrackedResources",
  "location": "eastus",
  "properties": {
    "description": "valid",
    "provisioningState": "Succeeded"
  },
  "systemData": {
    "createdBy": "AzureSDK",
    "createdByType": "User",
    "createdAt": <any date>,
    "lastModifiedBy": "AzureSDK",
    "lastModifiedAt": <any date>,
    "lastModifiedByType": "User",
  }
}
```

### Azure_ResourceManager_Models_Resources_SingletonTrackedResources_getByResourceGroup

- Endpoint: `get https://management.azure.com`

Resource GET operation.
Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources/default
Expected query parameter: api-version=2023-12-01-preview

Expected response body:

```json
{
  "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources/default",
  "name": "default",
  "type": "Azure.ResourceManager.Models.Resources/singletonTrackedResources",
  "location": "eastus",
  "properties":{
    "description": "valid",
    "provisioningState": "Succeeded"
  },
  "systemData": {
    "createdBy": "AzureSDK",
    "createdByType": "User",
    "createdAt": <any date>,
    "lastModifiedBy": "AzureSDK",
    "lastModifiedAt": <any date>,
    "lastModifiedByType": "User",
  }
}
```

### Azure_ResourceManager_Models_Resources_SingletonTrackedResources_listByResourceGroup

- Endpoint: `get https://management.azure.com`

Resource LIST by resource group operation.
Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources
Expected query parameter: api-version=2023-12-01-preview

Expected response body:

```json
{
  "value": [{
    "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources/default",
    "name": "default",
    "type": "Azure.ResourceManager.Models.Resources/singletonTrackedResources",
    "location": "eastus",
    "properties":{
      "description": "valid",
      "provisioningState": "Succeeded"
    },
    "systemData": {
      "createdBy": "AzureSDK",
      "createdByType": "User",
      "createdAt": <any date>,
      "lastModifiedBy": "AzureSDK",
      "lastModifiedAt": <any date>,
      "lastModifiedByType": "User",
    }
  }]
}
```

### Azure_ResourceManager_Models_Resources_SingletonTrackedResources_update

- Endpoint: `patch https://management.azure.com`

Resource PATCH operation.
Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources/default
Expected query parameter: api-version=2023-12-01-preview
Expected request body:

```json
{
  "location": "eastus2",
  "properties": {
    "description": "valid2"
  }
}
```

Expected response body:

```json
{
  "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources/default",
  "name": "default",
  "type": "Azure.ResourceManager.Models.Resources/singletonTrackedResources",
  "location": "eastus2",
  "properties":{
    "description": "valid2",
    "provisioningState": "Succeeded"
  },
  "systemData": {
    "createdBy": "AzureSDK",
    "createdByType": "User",
    "createdAt": <any date>,
    "lastModifiedBy": "AzureSDK",
    "lastModifiedAt": <any date>,
    "lastModifiedByType": "User",
  }
}
```

### Azure_ResourceManager_Models_Resources_TopLevelTrackedResources_actionSync

- Endpoint: `post https://management.azure.com`

  Resource sync action.
  Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/actionSync
  Expected query parameter: api-version=2023-12-01-preview
  Expected request body:

  ```json
  {
    "message": "Resource action at top level.",
    "urgent": true
  }
  ```

### Azure_ResourceManager_Models_Resources_TopLevelTrackedResources_createOrReplace

- Endpoint: `put https://management.azure.com`

Resource PUT operation.
Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top
Expected query parameter: api-version=2023-12-01-preview
Expected request body:

```json
{
  "location": "eastus",
  "properties": {
    "description": "valid"
  }
}
```

Expected response body:

```json
{
  "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top",
  "name": "top",
  "type": "topLevel",
  "location": "eastus",
  "properties": {
    "description": "valid",
    "provisioningState": "Succeeded"
  },
  "systemData": {
    "createdBy": "AzureSDK",
    "createdByType": "User",
    "createdAt": <any date>,
    "lastModifiedBy": "AzureSDK",
    "lastModifiedAt": <any date>,
    "lastModifiedByType": "User",
  }
}
```

### Azure_ResourceManager_Models_Resources_TopLevelTrackedResources_delete

- Endpoint: `delete https://management.azure.com`

Resource DELETE operation.
Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top
Expected query parameter: api-version=2023-12-01-preview

````
Expected response status code: 204

### Azure_ResourceManager_Models_Resources_TopLevelTrackedResources_get

- Endpoint: `get https://management.azure.com`

Resource GET operation.
Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top
Expected query parameter: api-version=2023-12-01-preview

Expected response body:
```json
{
  "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top",
  "name": "top",
  "type": "topLevel",
  "location": "eastus",
  "properties":{
    "description": "valid",
    "provisioningState": "Succeeded"
  },
  "systemData": {
    "createdBy": "AzureSDK",
    "createdByType": "User",
    "createdAt": <any date>,
    "lastModifiedBy": "AzureSDK",
    "lastModifiedAt": <any date>,
    "lastModifiedByType": "User",
  }
}
````

### Azure_ResourceManager_Models_Resources_TopLevelTrackedResources_listByResourceGroup

- Endpoint: `get https://management.azure.com`

Resource LIST by resource group operation.
Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources
Expected query parameter: api-version=2023-12-01-preview

Expected response body:

```json
{
  "value": [{
    "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top",
    "name": "top",
    "type": "topLevel",
    "location": "eastus",
    "properties":{
      "description": "valid",
      "provisioningState": "Succeeded"
    },
    "systemData": {
      "createdBy": "AzureSDK",
      "createdByType": "User",
      "createdAt": <any date>,
      "lastModifiedBy": "AzureSDK",
      "lastModifiedAt": <any date>,
      "lastModifiedByType": "User",
    }
  }]
}
```

### Azure_ResourceManager_Models_Resources_TopLevelTrackedResources_listBySubscription

- Endpoint: `get https://management.azure.com`

Resource LIST by subscription operation.
Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources
Expected query parameter: api-version=2023-12-01-preview

Expected response body:

```json
{
  "value": [{
    "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top",
    "name": "top",
    "type": "topLevel",
    "location": "eastus",
    "properties":{
      "description": "valid",
      "provisioningState": "Succeeded"
    },
    "systemData": {
      "createdBy": "AzureSDK",
      "createdByType": "User",
      "createdAt": <any date>,
      "lastModifiedBy": "AzureSDK",
      "lastModifiedAt": <any date>,
      "lastModifiedByType": "User",
    }
  }]
}
```

### Azure_ResourceManager_Models_Resources_TopLevelTrackedResources_update

- Endpoint: `patch https://management.azure.com`

Resource PATCH operation.
Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top
Expected query parameter: api-version=2023-12-01-preview
Expected request body:

```json
{
  "properties": {
    "description": "valid2"
  }
}
```

Expected response body:

```json
{
  "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top",
  "name": "top",
  "type": "topLevel",
  "location": "eastus",
  "properties":{
    "description": "valid2",
    "provisioningState": "Succeeded"
  },
  "systemData": {
    "createdBy": "AzureSDK",
    "createdByType": "User",
    "createdAt": <any date>,
    "lastModifiedBy": "AzureSDK",
    "lastModifiedAt": <any date>,
    "lastModifiedByType": "User",
  }
}
```

### Azure_SpecialHeaders_XmsClientRequestId

- Endpoint: `get /azure/special-headers/x-ms-client-request-id/`

Test case for azure client request id header. SDK should not generate `clientRequestId` paramerter but use policy to auto-set the header.
Expected header parameters:

- x-ms-client-request-id=<any uuid string>
  Expected response header:
- x-ms-client-request-id=<uuid string same with request header>

### Client_AzureExampleClient_basicAction

- Endpoint: `post /azure/example/basic/basic`

Expected request and response is same as the JSON example at examples/2022-12-01-preview/basic.json

When generate the code, one need to set the "examples-directory" option.

Expected query parameter: query-param=query&api-version=2022-12-01-preview
Expected header parameter: header-param=header

Expected input body:

```json
{
  "stringProperty": "text",
  "modelProperty": {
    "int32Property": 1,
    "float32Property": 1.5,
    "enumProperty": "EnumValue1"
  },
  "arrayProperty": ["item"],
  "recordProperty": {
    "record": "value"
  }
}
```

Expected response body:

```json
{
  "stringProperty": "text"
}
```

### Client_Naming_Header_request

- Endpoint: `post /client/naming/header`

Testing that we can project a header name.
Your generated SDK should generate an operation header `parameter` with a single parameter called `clientName`.

Expected header parameter: `default-name="true"`

### Client_Naming_Header_response

- Endpoint: `get /client/naming/header`

Testing that we can project a header name.
Your generated SDK should generate an operation header `parameter` with a single parameter called `clientName`.

Expected response header: `default-name="true"`

### Client_Naming_Model_client

- Endpoint: `post /client/naming/model/client`

Testing that we can project the client name in our generated SDKs.
Your generated SDK should generate the model with name `ClientModel`.

Expected request body:

```json
{ "defaultName": true }
```

### Client_Naming_Model_language

- Endpoint: `post /client/naming/model/language`

Testing that we can project the language specific name in our generated SDKs.
Your generated SDK should generate the model with your language specific model name.

Expected request body:

```json
{ "defaultName": true }
```

### Client_Naming_operation

- Endpoint: `post /client/naming/operation`

Testing that we can project the operation name.
Your generated SDK should generate an operation called `clientName`.

Expected status code: 204

### Client_Naming_parameter

- Endpoint: `post /client/naming/parameter`

Testing that we can project a parameter name.
Your generated SDK should generate an operation `parameter` with a single parameter called `clientName`.

Expected query parameter: `defaultName="true"`

### Client_Naming_Property_client

- Endpoint: `post /client/naming/property/client`

Testing that we can project the client name in our generated SDKs.
Your generated SDK should generate ClientNameModel with one property `clientName` with wire name `defaultName`.

Expected request body:

```json
{ "defaultName": true }
```

### Client_Naming_Property_compatibleWithEncodedName

- Endpoint: `post /client/naming/property/compatible-with-encoded-name`

Testing that we can project the client name and the wire name.
Your generated SDK should generate ClientNameAndJsonEncodedNameModel with one property with client name `clientName` and wire name `wireName`.

Expected request body:

```json
{ "wireName": true }
```

### Client_Naming_Property_language

- Endpoint: `post /client/naming/property/language`

Testing that we can project the language specific name in our generated SDKs.
Your generated SDK should generate LanguageClientNameModel with one property with your language specific property name and wire name `defaultName`.

Expected request body:

```json
{ "defaultName": true }
```

### Client_Naming_UnionEnum_unionEnumMemberName

- Endpoint: `post /client/naming/union-enum/union-enum-member-name`

  Testing that we can project a enum name and enum value name.
  Your generated SDK should generate an Enum with members "ClientEnumValue1", "ClientEnumValue2".
  (The exact name may depend on language convention)

  Expected request body:

  ```json
  "value1"
  ```

### Client_Naming_UnionEnum_unionEnumName

- Endpoint: `post /client/naming/union-enum/union-enum-name`

  Testing that we can project a enum name and enum value name.
  Your generated SDK should generate an Enum "ClientExtensibleEnum".
  (The exact name may depend on language convention)

  Expected request body:

  ```json
  "value1"
  ```

### Client_Structure_AnotherClientOperationGroup

- Endpoints:
  - `post /client/structure/{client}/six`
  - `post /client/structure/{client}/five`

This is to show we can have multiple clients, with multiple operation groups in each client.
The client and its operation groups can be moved to a sub namespace/package.

```ts
const client2 = new SubNamespace.SecondClient("client-operation-group");

client2.five();
client2.group5.six();
```

### Client_Structure_ClientOperationGroup

- Endpoints:
  - `post /client/structure/{client}/two`
  - `post /client/structure/{client}/three`
  - `post /client/structure/{client}/four`
  - `post /client/structure/{client}/one`

This is to show we can have multiple clients, with multiple operation groups in each client.

```ts
const client1 = new FirstClient("client-operation-group");

client1.one();

client1.group3.two();
client1.group3.three();

client1.group4.four();
```

### Client_Structure_MultiClient

- Endpoints:
  - `post /client/structure/{client}/one`
  - `post /client/structure/{client}/three`
  - `post /client/structure/{client}/five`
  - `post /client/structure/{client}/two`
  - `post /client/structure/{client}/four`
  - `post /client/structure/{client}/six`

Include multiple clients in the same spec.

```ts
const clientA = new ClientAClient("multi-client");
const clientB = new ClientBClient("multi-client");

clientA.renamedOne();
clientA.renamedThree();
clientA.renamedFive();

clientB.renamedTwo();
clientB.renamedFour();
clientB.renamedSix();
```

### Client_Structure_RenamedOperation

- Endpoints:
  - `post /client/structure/{client}/two`
  - `post /client/structure/{client}/four`
  - `post /client/structure/{client}/six`
  - `post /client/structure/{client}/one`
  - `post /client/structure/{client}/three`
  - `post /client/structure/{client}/five`

This is to show we can have more than one operation group in a client. The client side should be able to call the api like

```ts
const client = new RenamedOperationClient("renamed-operation");

client.renamedOne();
client.renamedThree();
client.renamedFive();

client.group.renamedTwo();
client.group.renamedFour();
client.group.renamedSix();
```

### Client_Structure_Service

- Endpoints:
  - `post /client/structure/{client}/seven`
  - `post /client/structure/{client}/nine`
  - `post /client/structure/{client}/eight`
  - `post /client/structure/{client}/three`
  - `post /client/structure/{client}/four`
  - `post /client/structure/{client}/five`
  - `post /client/structure/{client}/six`
  - `post /client/structure/{client}/one`
  - `post /client/structure/{client}/two`

This is to show that if we don't do any customization. The client side should be able to call the api like

```ts
const client = new ServiceClient("default");
client.one();
client.two();
client.foo.three();
client.foo.four();
client.bar.five();
client.bar.six();
client.baz.foo.seven();
client.qux.eight();
client.qux.bar.nine();
```

### Client_Structure_TwoOperationGroup

- Endpoints:
  - `post /client/structure/{client}/one`
  - `post /client/structure/{client}/three`
  - `post /client/structure/{client}/four`
  - `post /client/structure/{client}/two`
  - `post /client/structure/{client}/five`
  - `post /client/structure/{client}/six`

This is to show we can have more than one operation group in a client. The client side should be able to call the api like

```ts
const client = new TwoOperationGroupClient("two-operation-group");

client.group1.one();
client.group1.three();
client.group1.four();

client.group2.two();
client.group2.five();
client.group2.six();
```

### Encode_Bytes_Header_base64

- Endpoint: `get /encode/bytes/header/base64`

Test base64 encode for bytes header.
Expected header:
value=dGVzdA== (base64 encode of test)

### Encode_Bytes_Header_base64url

- Endpoint: `get /encode/bytes/header/base64url`

Test base64url encode for bytes header.
Expected header:
value=dGVzdA (base64url encode of test)

### Encode_Bytes_Header_base64urlArray

- Endpoint: `get /encode/bytes/header/base64url-array`

Test base64url encode for bytes array header.
Expected header:
value=dGVzdA,dGVzdA

### Encode_Bytes_Header_default

- Endpoint: `get /encode/bytes/header/default`

Test default encode (base64) for bytes header.
Expected header:
value=dGVzdA== (base64 encode of test)

### Encode_Bytes_Property_base64

- Endpoint: `post /encode/bytes/property/base64`

Test operation with request and response model contains bytes properties with base64 encode.
Expected request body:

```json
{
  "value": "dGVzdA==" // base64 encode of test
}
```

Expected response body:

```json
{
  "value": "dGVzdA=="
}
```

### Encode_Bytes_Property_base64url

- Endpoint: `post /encode/bytes/property/base64url`

Test operation with request and response model contains bytes properties with base64url encode.
Expected request body:

```json
{
  "value": "dGVzdA" // base64url encode of test
}
```

Expected response body:

```json
{
  "value": "dGVzdA"
}
```

### Encode_Bytes_Property_base64urlArray

- Endpoint: `post /encode/bytes/property/base64url-array`

Test operation with request and response model contains bytes array properties with base64url encode.
Expected request body:

```json
{
  "value": ["dGVzdA", "dGVzdA"]
}
```

Expected response body:

```json
{
  "value": ["dGVzdA", "dGVzdA"]
}
```

### Encode_Bytes_Property_default

- Endpoint: `post /encode/bytes/property/default`

Test operation with request and response model contains bytes properties with default encode (base64).
Expected request body:

```json
{
  "value": "dGVzdA==" // base64 encode of test
}
```

Expected response body:

```json
{
  "value": "dGVzdA=="
}
```

### Encode_Bytes_Query_base64

- Endpoint: `get /encode/bytes/query/base64`

Test base64 encode for bytes query parameter.
Expected query parameter:
value=dGVzdA== (base64 encode of test)

### Encode_Bytes_Query_base64url

- Endpoint: `get /encode/bytes/query/base64url`

Test base64url encode for bytes query parameter.
Expected query parameter:
value=dGVzdA (base64url encode of test)

### Encode_Bytes_Query_base64urlArray

- Endpoint: `get /encode/bytes/query/base64url-array`

Test base64url encode for bytes array query parameter.
Expected query parameter:
value=dGVzdA, dGVzdA

### Encode_Bytes_Query_default

- Endpoint: `get /encode/bytes/query/default`

Test default encode (base64) for bytes query parameter.
Expected query parameter:
value=dGVzdA== (base64 encode of test)

### Encode_Bytes_RequestBody_base64

- Endpoint: `post /encode/bytes/body/request/base64`

Test base64 encode for bytes body.
Expected body:
"dGVzdA==" (base64 encode of test, in JSON string)

### Encode_Bytes_RequestBody_base64url

- Endpoint: `post /encode/bytes/body/request/base64url`

Test base64url encode for bytes body.
Expected body:
"dGVzdA" (base64url encode of test, in JSON string)

### Encode_Bytes_RequestBody_customContentType

- Endpoint: `post /encode/bytes/body/request/custom-content-type`

When content type is a custom type(image/png here) and body is `bytes` the payload is a binary file.
File should match packages/cadl-ranch-specs/assets/image.png

### Encode_Bytes_RequestBody_default

- Endpoint: `post /encode/bytes/body/request/default`

Test default encode (base64) for bytes in a json body.
Expected body:
"dGVzdA==" (base64 encode of test, in JSON string)

### Encode_Bytes_RequestBody_octetStream

- Endpoint: `post /encode/bytes/body/request/octet-stream`

When content type is application/octet-stream and body is `bytes` the payload is a binary file.
File should match packages/cadl-ranch-specs/assets/image.png

### Encode_Bytes_ResponseBody_base64

- Endpoint: `get /encode/bytes/body/response/base64`

Test base64 encode for bytes body.
Expected body:
"dGVzdA==" (base64 encode of test, in JSON string)

### Encode_Bytes_ResponseBody_base64url

- Endpoint: `get /encode/bytes/body/response/base64url`

Test base64url encode for bytes body.
Expected body:
"dGVzdA" (base64url encode of test, in JSON string)

### Encode_Bytes_ResponseBody_customContentType

- Endpoint: `get /encode/bytes/body/response/custom-content-type`

When content type is a custom type(image/png here) and body is `bytes` the payload is a binary file.
File should match packages/cadl-ranch-specs/assets/image.png

### Encode_Bytes_ResponseBody_default

- Endpoint: `get /encode/bytes/body/response/default`

Test default encode (base64) for bytes in a json body.
Expected body:
"dGVzdA==" (base64 encode of test, in JSON string)

### Encode_Bytes_ResponseBody_octetStream

- Endpoint: `get /encode/bytes/body/response/octet-stream`

When content type is application/octet-stream and body is `bytes` the payload is a binary file.
File should match packages/cadl-ranch-specs/assets/image.png

### Encode_Datetime_Header_default

- Endpoint: `get /encode/datetime/header/default`

Test default encode (rfc7231) for datetime header.
Expected header:
value=Fri, 26 Aug 2022 14:38:00 GMT

### Encode_Datetime_Header_rfc3339

- Endpoint: `get /encode/datetime/header/rfc3339`

Test rfc3339 encode for datetime header.
Expected header:
value=2022-08-26T18:38:00.000Z

### Encode_Datetime_Header_rfc7231

- Endpoint: `get /encode/datetime/header/rfc7231`

Test rfc7231 encode for datetime header.
Expected header:
value=Fri, 26 Aug 2022 14:38:00 GMT

### Encode_Datetime_Header_unixTimestamp

- Endpoint: `get /encode/datetime/header/unix-timestamp`

Test unixTimestamp encode for datetime header.
Expected header:
value=1686566864

### Encode_Datetime_Header_unixTimestampArray

- Endpoint: `get /encode/datetime/header/unix-timestamp-array`

Test unixTimestamp encode for datetime array header.
Expected header:
value=1686566864,1686734256

### Encode_Datetime_Property_default

- Endpoint: `post /encode/datetime/property/default`

Test operation with request and response model contains datetime property with default encode (rfc3339).
Expected request body:

```json
{
  "value": "2022-08-26T18:38:00.000Z"
}
```

Expected response body:

```json
{
  "value": "2022-08-26T18:38:00.000Z"
}
```

### Encode_Datetime_Property_rfc3339

- Endpoint: `post /encode/datetime/property/rfc3339`

Test operation with request and response model contains datetime property with rfc3339 encode.
Expected request body:

```json
{
  "value": "2022-08-26T18:38:00.000Z"
}
```

Expected response body:

```json
{
  "value": "2022-08-26T18:38:00.000Z"
}
```

### Encode_Datetime_Property_rfc7231

- Endpoint: `post /encode/datetime/property/rfc7231`

Test operation with request and response model contains datetime property with rfc7231 encode.
Expected request body:

```json
{
  "value": "Fri, 26 Aug 2022 14:38:00 GMT"
}
```

Expected response body:

```json
{
  "value": "Fri, 26 Aug 2022 14:38:00 GMT"
}
```

### Encode_Datetime_Property_unixTimestamp

- Endpoint: `post /encode/datetime/property/unix-timestamp`

Test operation with request and response model contains datetime property with unixTimestamp encode.
Expected request body:

```json
{
  "value": 1686566864
}
```

Expected response body:

```json
{
  "value": 1686566864
}
```

### Encode_Datetime_Property_unixTimestampArray

- Endpoint: `post /encode/datetime/property/unix-timestamp-array`

Test operation with request and response model contains datetime array property with unixTimestamp encode.
Expected request body:f

```json
{
  "value": [1686566864, 1686734256]
}
```

Expected response body:

```json
{
  "value": [1686566864, 1686734256]
}
```

### Encode_Datetime_Query_default

- Endpoint: `get /encode/datetime/query/default`

Test default encode (rfc3339) for datetime query parameter.
Expected query parameter:
value=2022-08-26T18:38:00.000Z

### Encode_Datetime_Query_rfc3339

- Endpoint: `get /encode/datetime/query/rfc3339`

Test rfc3339 encode for datetime query parameter.
Expected query parameter:
value=2022-08-26T18:38:00.000Z

### Encode_Datetime_Query_rfc7231

- Endpoint: `get /encode/datetime/query/rfc7231`

Test rfc7231 encode for datetime query parameter.
Expected query parameter:
value=Fri, 26 Aug 2022 14:38:00 GMT

### Encode_Datetime_Query_unixTimestamp

- Endpoint: `get /encode/datetime/query/unix-timestamp`

Test unixTimestamp encode for datetime query parameter.
Expected query parameter:
value=1686566864

### Encode_Datetime_Query_unixTimestampArray

- Endpoint: `get /encode/datetime/query/unix-timestamp-array`

Test unixTimestamp encode for datetime array query parameter.
Expected query parameter:
value=1686566864, 1686734256

### Encode_Datetime_ResponseHeader_default

- Endpoint: `get /encode/datetime/responseheader/default`

Test default encode (rfc7231) for datetime header.
Expected response header:
value=Fri, 26 Aug 2022 14:38:00 GMT

### Encode_Datetime_ResponseHeader_rfc3339

- Endpoint: `get /encode/datetime/responseheader/rfc3339`

Test rfc3339 encode for datetime header.
Expected response header:
value=2022-08-26T18:38:00.000Z

### Encode_Datetime_ResponseHeader_rfc7231

- Endpoint: `get /encode/datetime/responseheader/rfc7231`

Test rfc7231 encode for datetime header.
Expected response header:
value=Fri, 26 Aug 2022 14:38:00 GMT

### Encode_Datetime_ResponseHeader_unixTimestamp

- Endpoint: `get /encode/datetime/responseheader/unix-timestamp`

Test unixTimestamp encode for datetime header.
Expected response header:
value=1686566864

### Encode_Duration_Header_default

- Endpoint: `get /encode/duration/header/default`

Test default encode for a duration header.
Expected header `input=P40D`

### Encode_Duration_Header_float64Seconds

- Endpoint: `get /encode/duration/header/float64-seconds`

Test float64 seconds encode for a duration header.
Expected header `duration: 35.625`

### Encode_Duration_Header_floatSeconds

- Endpoint: `get /encode/duration/header/float-seconds`

Test float seconds encode for a duration header.
Expected header `duration: 35.625`

### Encode_Duration_Header_int32Seconds

- Endpoint: `get /encode/duration/header/int32-seconds`

Test int32 seconds encode for a duration header.
Expected header `duration: 36`

### Encode_Duration_Header_iso8601

- Endpoint: `get /encode/duration/header/iso8601`

Test iso8601 encode for a duration header.
Expected header `duration: P40D`

### Encode_Duration_Header_iso8601Array

- Endpoint: `get /encode/duration/header/iso8601-array`

Test iso8601 encode for a duration array header.
Expected header `duration: [P40D,P50D]`

### Encode_Duration_Property_default

- Endpoint: `post /encode/duration/property/default`

Test operation with request and response model contains a duration property with default encode.
Expected request body:

```json
{
  "value": "P40D"
}
```

Expected response body:

```json
{
  "value": "P40D"
}
```

### Encode_Duration_Property_float64Seconds

- Endpoint: `get /encode/duration/property/float64-seconds`

Test operation with request and response model contains a duration property with float64 seconds encode.
Expected request body:

```json
{
  "value": 35.625
}
```

Expected response body:

```json
{
  "value": 35.625
}
```

### Encode_Duration_Property_floatSeconds

- Endpoint: `get /encode/duration/property/float-seconds`

Test operation with request and response model contains a duration property with float seconds encode.
Expected request body:

```json
{
  "value": 35.625
}
```

Expected response body:

```json
{
  "value": 35.625
}
```

### Encode_Duration_Property_floatSecondsArray

- Endpoint: `get /encode/duration/property/float-seconds-array`

Test operation with request and response model contains an array property which elements are duration with float seconds encode.
Expected request body:

```json
{
  "value": [35.625, 46.75]
}
```

Expected response body:

```json
{
  "value": [35.625, 46.75]
}
```

### Encode_Duration_Property_int32Seconds

- Endpoint: `get /encode/duration/property/int32-seconds`

Test operation with request and response model contains a duration property with int32 seconds encode.
Expected request body:

```json
{
  "value": 36
}
```

Expected response body:

```json
{
  "value": 36
}
```

### Encode_Duration_Property_iso8601

- Endpoint: `post /encode/duration/property/iso8601`

Test operation with request and response model contains a duration property with iso8601 encode.
Expected request body:

```json
{
  "value": "P40D"
}
```

Expected response body:

```json
{
  "value": "P40D"
}
```

### Encode_Duration_Query_default

- Endpoint: `get /encode/duration/query/default`

Test default encode for a duration parameter.
Expected query parameter `input=P40D`

### Encode_Duration_Query_float64Seconds

- Endpoint: `get /encode/duration/query/float64-seconds`

Test float64 seconds encode for a duration parameter.
Expected query parameter `input=35.625`

### Encode_Duration_Query_floatSeconds

- Endpoint: `get /encode/duration/query/float-seconds`

Test float seconds encode for a duration parameter.
Expected query parameter `input=35.625`

### Encode_Duration_Query_int32Seconds

- Endpoint: `get /encode/duration/query/int32-seconds`

Test int32 seconds encode for a duration parameter.
Expected query parameter `input=36`

### Encode_Duration_Query_int32SecondsArray

- Endpoint: `get /encode/duration/query/int32-seconds-array`

Test int32 seconds encode for a duration array parameter.
Expected query parameter `input=36,47`

### Encode_Duration_Query_iso8601

- Endpoint: `get /encode/duration/query/iso8601`

Test iso8601 encode for a duration parameter.
Expected query parameter `input=P40D`

### Encode_Numeric_Property_safeintAsString

- Endpoint: `post /encode/numeric/property/safeint`

Test operation with request and response model contains property of safeint type with string encode.
Expected request body:

```json
{
  "value": "10000000000"
}
```

Expected response body:

```json
{
  "value": "10000000000"
}
```

### Encode_Numeric_Property_uint32AsStringOptional

- Endpoint: `post /encode/numeric/property/uint32`

Test operation with request and response model contains property of uint32 type with string encode.
Expected request body:

```json
{
  "value": "1"
}
```

Expected response body:

```json
{
  "value": "1"
}
```

### Encode_Numeric_Property_uint8AsString

- Endpoint: `post /encode/numeric/property/uint8`

Test operation with request and response model contains property of uint8 type with string encode.
Expected request body:

```json
{
  "value": "255"
}
```

Expected response body:

```json
{
  "value": "255"
}
```

### Parameters_Basic_ExplicitBody_simple

- Endpoint: `put /parameters/basic/explicit-body/simple`

Test case for simple explicit body.

Should generate request body model named `User`.
Should generate an operation like below:

```
spreadAsRequestBody(bodyParameter: BodyParameter)
```

Note the parameter name is guessed from the model name and it may vary by language.

Expected request body:

```json
{ "name": "foo" }
```

### Parameters_Basic_ImplicitBody_simple

- Endpoint: `put /parameters/basic/implicit-body/simple`

Test case for simple implicit body.

Should generate an operation like below:

```
simple(name: string)
```

Expected request body:

```json
{ "name": "foo" }
```

### Parameters_BodyOptionality_OptionalExplicit

- Endpoints:
  - `post /parameters/body-optionality/optional-explicit/set`
  - `post /parameters/body-optionality/optional-explicit/omit`

Scenario defining how an explicit optional body parameter is specified.

Expected request body for `set`

```json
{ "name": "foo" }
```

Expected no request body for `omit`

### Parameters_BodyOptionality_requiredExplicit

- Endpoint: `post /parameters/body-optionality/required-explicit`

Scenario defining how an explicit required body parameter is specified.

Expected request body:

```json
{ "name": "foo" }
```

### Parameters_BodyOptionality_requiredImplicit

- Endpoint: `post /parameters/body-optionality/required-implicit`

Scenario defining how an implicit required body parameter is specified.

Expected request body:

```json
{ "name": "foo" }
```

### Parameters_CollectionFormat_Header_csv

- Endpoint: `get /parameters/collection-format/header/csv`

This test is testing sending a csv collection format array header parameters

### Parameters_CollectionFormat_Query_csv

- Endpoint: `get /parameters/collection-format/query/csv`

This test is testing sending a csv collection format array query parameters

### Parameters_CollectionFormat_Query_multi

- Endpoint: `get /parameters/collection-format/query/multi`

This test is testing sending a multi collection format array query parameters

### Parameters_CollectionFormat_Query_pipes

- Endpoint: `get /parameters/collection-format/query/pipes`

This test is testing sending a pipes collection format array query parameters

### Parameters_CollectionFormat_Query_ssv

- Endpoint: `get /parameters/collection-format/query/ssv`

This test is testing sending a ssv collection format array query parameters

### Parameters_CollectionFormat_Query_tsv

- Endpoint: `get /parameters/collection-format/query/tsv`

This test is testing sending a tsv collection format array query parameters

### Parameters_Spread_Alias_spreadAsRequestBody

- Endpoint: `put /parameters/spread/alias/request-body`

Test case for spread alias.

Should not generate any model named `BodyParameter`.
Should generate an operation like:

```
spreadAsRequestBody(name: string)
```

Expected request body:

```json
{ "name": "foo" }
```

### Parameters_Spread_Alias_spreadAsRequestParameter

- Endpoint: `put /parameters/spread/alias/request-parameter/{id}`

Test case for spread alias with path and header parameter.

Should not generate any model named `RequestParameter`.
Should generate an operation like below:

```
spreadAsRequestParameter(id: string, x_ms_test_header: string, name: string)
```

Note the parameter name may be normalized and vary by language.

Expected path parameter: id="1"
Expected header parameter: x-ms-test-header="bar"
Expected request body:

```json
{ "name": "foo" }
```

### Parameters_Spread_Alias_spreadParameterWithInnerAlias

- Endpoint: `post /parameters/spread/alias/inner-alias-parameter`

Test case for spread alias with contains another alias property as body.

Should not generate any model named `InnerAlias` and `InnerAliasParameter`.
Should generate an operation like below:

```
spreadParameterWithInnerAlias(id: string, name: string, age: int32, x_ms_test_header: string)
```

Note the parameter name is guessed from the model name and it may vary by language.
Expected path parameter: id="1"
Expected header parameter: x-ms-test-header="bar"
Expected request body:

```json
{
  "name": "foo",
  "age": 1
}
```

### Parameters_Spread_Alias_spreadParameterWithInnerModel

- Endpoint: `post /parameters/spread/alias/inner-model-parameter/{id}`

Test case for spread alias.

Should not generate any model named `InnerModel`.
Should not generate any model named `InnerModelParameter`.
Should generate an operation like:

```
spreadParameterWithInnerModel(id: string, x_ms_test_header: string, name: string)
```

Note the parameter name is guessed from the model name and it may vary by language.

Expected path parameter: id="1"
Expected header parameter: x-ms-test-header="bar"
Expected request body:

```json
{ "name": "foo" }
```

### Parameters_Spread_Alias_spreadWithMultipleParameters

- Endpoint: `put /parameters/spread/alias/multiple-parameters/{id}`

Test case for spread alias including 6 parameters. May handle as property bag for these parameters.

Should not generate any model named `MultipleRequestParameters`.
Since it contains both optional properties and required properties, the method signature might vary across different languages.
Note it's also acceptable if some languages handle it as property bag.

Expected path parameter: id="1"
Expected header parameter: x-ms-test-header="bar"
Expected request body:

```json
{
  "requiredString": "foo",
  "optionalInt": 1,
  "requiredIntList": [1, 2],
  "optionalStringList": ["foo", "bar"]
}
```

### Parameters_Spread_Model_spreadAsRequestBody

- Endpoint: `put /parameters/spread/model/request-body`

Test case for spread named model.

Should not generate request body model named `BodyParameter`.
Should generate an operation like below:

```
spreadAsRequestBody(name: string)
```

Note the parameter name is guessed from the model name and it may vary by language.

Expected request body:

```json
{ "name": "foo" }
```

### Parameters_Spread_Model_spreadCompositeRequest

- Endpoint: `put /parameters/spread/model/composite-request/{name}`

Test case for spread model with all http request decorator.

Should generate request body model named `BodyParameter`.
Should not generate model named `CompositeRequest`.
Should generate an operation like below:

```
spreadCompositeRequest(name: string, testHeader: string, bodyParameter: BodyParameter)
```

Note the parameter name is guessed from the model name and it may vary by language.

Expected path parameter: name="foo"
Expected header parameter: testHeader="bar"
Expected request body:

```json
{ "name": "foo" }
```

### Parameters_Spread_Model_spreadCompositeRequestMix

- Endpoint: `put /parameters/spread/model/composite-request-mix/{name}`

Test case for spread model with non-body http request decorator.

Should not generate model named `CompositeRequestMix`.
Should generate an operation like below:

```
spreadCompositeRequestMix(name: string, testHeader: string, prop: string)
```

Note the parameter name is guessed from the model name and it may vary by language.

Expected path parameter: name="foo"
Expected header parameter: testHeader="bar"
Expected request body:

```json
{ "prop": "foo" }
```

### Parameters_Spread_Model_spreadCompositeRequestOnlyWithBody

- Endpoint: `put /parameters/spread/model/composite-request-only-with-body`

Test case for spread model only with `@body` property.

Should generate request body model named `BodyParameter`.
Should not generate model named `CompositeRequestOnlyWithBody`.
Should generate an operation like below:

```
spreadCompositeRequestOnlyWithBody(bodyParameter: BodyParameter)
```

Note the parameter name is guessed from the model name and it may vary by language.

Expected request body:

```json
{ "name": "foo" }
```

### Parameters_Spread_Model_spreadCompositeRequestWithoutBody

- Endpoint: `put /parameters/spread/model/composite-request-without-body/{name}`

Test case for spread model without `@body` property.

Should not generate model named `CompositeRequestOnlyWithBody`.
Should generate an operation like below:

```
spreadCompositeRequestWithoutBody(name: string, testHeader: string)
```

Expected path parameter: name="foo"
Expected header parameter: testHeader="bar"

### Payload_ContentNegotiation_DifferentBody

- Endpoints:
  - `get /content-negotiation/different-body`
  - `get /content-negotiation/different-body`

Scenario that a different payload depending on the accept header.

- application/json return a png image in a Json object
- image/png return the png image

### Payload_ContentNegotiation_SameBody

- Endpoints:
  - `get /content-negotiation/same-body`
  - `get /content-negotiation/same-body`

Scenario that returns a different file encoding depending on the accept header.

- image/png return a png image
- image/jpeg return a jpeg image

### Payload_JsonMergePatch_createResource

- Endpoint: `put /json-merge-patch/create/resource`

Expected input body:

```json
{
  "name": "Madge",
  "description": "desc",
  "map": {
    "key": {
      "name": "InnerMadge",
      "description": "innerDesc"
    }
  },
  "array": [
    {
      "name": "InnerMadge",
      "description": "innerDesc"
    }
  ],
  "intValue": 1,
  "floatValue": 1.1,
  "innerModel": {
    "name": "InnerMadge",
    "description": "innerDesc"
  },
  "intArray": [1, 2, 3]
}
```

Expected response body:

```json
{
  "name": "Madge",
  "description": "desc",
  "map": {
    "key": {
      "name": "InnerMadge",
      "description": "innerDesc"
    }
  },
  "array": [
    {
      "name": "InnerMadge",
      "description": "innerDesc"
    }
  ],
  "intValue": 1,
  "floatValue": 1.1,
  "innerModel": {
    "name": "InnerMadge",
    "description": "innerDesc"
  },
  "intArray": [1, 2, 3]
}
```

### Payload_JsonMergePatch_updateOptionalResource

- Endpoint: `patch /json-merge-patch/update/resource/optional`

Should serialize null values with merge-patch+json enabled.

Expected input body:

```json
{
  "description": null,
  "map": {
    "key": {
      "description": null
    },
    "key2": null
  },
  "array": null,
  "intValue": null,
  "floatValue": null,
  "innerModel": null,
  "intArray": null
}
```

Expected response body:

```json
{
  "name": "Madge",
  "map": {
    "key": {
      "name": "InnerMadge"
    }
  }
}
```

### Payload_JsonMergePatch_updateResource

- Endpoint: `patch /json-merge-patch/update/resource`

Should serialize null values with merge-patch+json enabled.

Expected input body:

```json
{
  "description": null,
  "map": {
    "key": {
      "description": null
    },
    "key2": null
  },
  "array": null,
  "intValue": null,
  "floatValue": null,
  "innerModel": null,
  "intArray": null
}
```

Expected response body:

```json
{
  "name": "Madge",
  "map": {
    "key": {
      "name": "InnerMadge"
    }
  }
}
```

### Payload_MediaType_StringBody_getAsJson

- Endpoint: `get /payload/media-type/string-body/getAsJson`

Expected response body is "foo".

### Payload_MediaType_StringBody_getAsText

- Endpoint: `get /payload/media-type/string-body/getAsText`

Expected response body is a string '{cat}'.

### Payload_MediaType_StringBody_sendAsJson

- Endpoint: `post /payload/media-type/string-body/sendAsJson`

Expected request body is "foo".

### Payload_MediaType_StringBody_sendAsText

- Endpoint: `post /payload/media-type/string-body/sendAsText`

Expected request body is a string '{cat}'.

### Payload_MultiPart_FormData_anonymousModel

- Endpoint: `post /multipart/form-data/anonymous-model`

Expect request (

- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.4, content-type of file part shall be labeled with
  appropriate media type, cadl-ranch will check it; content-type of other parts is optional, cadl-ranch will ignore it.
- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.2, filename of file part SHOULD be supplied.
  If there are duplicated filename in same filedName, cadl-ranch can't parse them all.
  ):

```
POST /multipart/form-data/anonymous-model HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="<any-name-is-ok>"
Content-Type: application/octet-stream;

{…file content of .jpg file…}
--abcde12345--
```

### Payload_MultiPart_FormData_basic

- Endpoint: `post /multipart/form-data/mixed-parts`

Expect request (

- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.4, content-type of file part shall be labeled with
  appropriate media type, cadl-ranch will check it; content-type of other parts is optional, cadl-ranch will ignore it.
- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.2, filename of file part SHOULD be supplied.
  If there are duplicated filename in same fieldName, cadl-ranch can't parse them all.
  ):

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="id"
Content-Type: text/plain

123
--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="<any-or-no-name-is-ok>"
Content-Type: application/octet-stream;

{…file content of .jpg file…}
--abcde12345--
```

### Payload_MultiPart_FormData_binaryArrayParts

- Endpoint: `post /multipart/form-data/binary-array-parts`

Expect request (

- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.4, content-type of file part shall be labeled with
  appropriate media type, cadl-ranch will check it; content-type of other parts is optional, cadl-ranch will ignore it.
- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.2, filename of file part SHOULD be supplied.
  If there are duplicated filename in same fieldName, cadl-ranch can't parse them all.
  ):

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="id"
Content-Type: text/plain

123
--abcde12345
Content-Disposition: form-data; name="pictures"; filename="<any-or-no-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .png file…}
--abcde12345
Content-Disposition: form-data; name="pictures"; filename="<any-or-no-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .png file…}
--abcde12345--
```

### Payload_MultiPart_FormData_checkFileNameAndContentType

- Endpoint: `post /multipart/form-data/check-filename-and-content-type`

this case will check filename and content-type of file part, so expect request:

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="id"
Content-Type: text/plain

123
--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="hello.jpg"
Content-Type: image/jpg

{…file content of .jpg file…}
--abcde12345--
```

### Payload_MultiPart_FormData_fileArrayAndBasic

- Endpoint: `post /multipart/form-data/complex-parts`

Expect request (

- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.4, content-type of file part shall be labeled with
  appropriate media type, cadl-ranch will check it; content-type of other parts is optional, cadl-ranch will ignore it.
- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.2, filename of file part SHOULD be supplied.
  If there are duplicated filename in same fieldName, cadl-ranch can't parse them all.
  ):

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="id"
Content-Type: text/plain

123
--abcde12345
Content-Disposition: form-data; name="address"
Content-Type: application/json

{
  "city": "X"
}
--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="<any-or-no-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .jpg file…}
--abcde12345--
Content-Disposition: form-data; name="previousAddresses"
Content-Type: application/json

[{
  "city": "Y"
},{
  "city": "Z"
}]
--abcde12345
Content-Disposition: form-data; name="pictures"; filename="<any-or-no-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .png file…}
--abcde12345
Content-Disposition: form-data; name="pictures"; filename="<any-or-no-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .png file…}
--abcde12345--
```

### Payload_MultiPart_FormData_HttpParts_ContentType_imageJpegContentType

- Endpoint: `post /multipart/form-data/check-filename-and-specific-content-type-with-httppart`

This case will check filename and specific content-type of file part, so expect request:

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="hello.jpg"
Content-Type: image/jpg

{…file content of .jpg file…}
--abcde12345--
```

### Payload_MultiPart_FormData_HttpParts_ContentType_optionalContentType

- Endpoint: `post /multipart/form-data/file-with-http-part-optional-content-type`

Please send request twice, first time with no content-type and second time with content-type "application/octet-stream". Expect request:

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="<any-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .jpg file…}
--abcde12345
```

### Payload_MultiPart_FormData_HttpParts_ContentType_requiredContentType

- Endpoint: `post /multipart/form-data/check-filename-and-required-content-type-with-httppart`

This case will check required content-type of file part, so expect request:

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="<any-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .jpg file…}
--abcde12345--
```

### Payload_MultiPart_FormData_HttpParts_jsonArrayAndFileArray

- Endpoint: `post /multipart/form-data/complex-parts-with-httppart`

For File part, filename will not be checked but it is necessary otherwise cadl-ranch can't parse it;
content-type will be checked with value "application/octet-stream". Expect request:

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="id"
Content-Type: text/plain

123
--abcde12345
Content-Disposition: form-data; name="address"
Content-Type: application/json

{
  "city": "X"
}
--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="<any-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .jpg file…}
--abcde12345--
Content-Disposition: form-data; name="previousAddresses"
Content-Type: application/json

[{
  "city": "Y"
},{
  "city": "Z"
}]
--abcde12345
Content-Disposition: form-data; name="pictures"; filename="<any-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .png file…}
--abcde12345
Content-Disposition: form-data; name="pictures"; filename="<any-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .png file…}
--abcde12345--
```

### Payload_MultiPart_FormData_HttpParts_NonString_float

- Endpoint: `post /multipart/form-data/non-string-float`

Expect request:

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="temperature"
Content-Type: text/plain

0.5
--abcde12345
```

### Payload_MultiPart_FormData_jsonPart

- Endpoint: `post /multipart/form-data/json-part`

Expect request (

- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.4, content-type of file part shall be labeled with
  appropriate media type, cadl-ranch will check it; content-type of other parts is optional, cadl-ranch will ignore it.
- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.2, filename of file part SHOULD be supplied.
  If there are duplicated filename in same fieldName, cadl-ranch can't parse them all.
  ):

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="address"
Content-Type: application/json

{
  "city": "X"
}
--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="<any-or-no-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .jpg file…}
--abcde12345--
```

### Payload_MultiPart_FormData_multiBinaryParts

- Endpoint: `post /multipart/form-data/multi-binary-parts`

Please send request twice, first time with only profileImage, second time with both profileImage and picture(

- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.4, content-type of file part shall be labeled with
  appropriate media type, cadl-ranch will check it; content-type of other parts is optional, cadl-ranch will ignore it.
- according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.2, filename of file part SHOULD be supplied.
  If there are duplicated filename in same fieldName, cadl-ranch can't parse them all.
  ):

```
POST /upload HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345

--abcde12345
Content-Disposition: form-data; name="profileImage"; filename="<any-or-no-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .jpg file…}
--abcde12345
Content-Disposition: form-data; name="picture"; filename="<any-or-no-name-is-ok>"
Content-Type: application/octet-stream

{…file content of .png file…}
--abcde12345--
```

### Payload_Pageable_list

- Endpoint: `get /payload/pageable`

List users.

SDK may hide the "maxpagesize" from API signature. The functionality of "maxpagesize" could be in related language Page model.

Expected query parameter:
maxpagesize=3

Expected response body:

```json
{
  "value": [
    {
      "name": "user5"
    },
    {
      "name": "user6"
    },
    {
      "name": "user7"
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
  "value": [
    {
      "name": "user8"
    }
  ]
}
```

### Payload_Xml_ModelWithArrayOfModelValue_get

- Endpoint: `get /payload/xml/modelWithArrayOfModel`

Expected response body:

```xml
<ModelWithArrayOfModel>
  <items>
    <SimpleModel>
      <name>foo</name>
      <age>123</age>
    </SimpleModel>
    <SimpleModel>
      <name>bar</name>
      <age>456</age>
    </SimpleModel>
  </items>
</ModelWithArrayOfModel>
```

### Payload_Xml_ModelWithArrayOfModelValue_put

- Endpoint: `put /payload/xml/modelWithArrayOfModel`

Expected request body:

```xml
<ModelWithArrayOfModel>
  <items>
    <SimpleModel>
      <name>foo</name>
      <age>123</age>
    </SimpleModel>
    <SimpleModel>
      <name>bar</name>
      <age>456</age>
    </SimpleModel>
  </items>
</ModelWithArrayOfModel>
```

### Payload_Xml_ModelWithAttributesValue_get

- Endpoint: `get /payload/xml/modelWithAttributes`

Expected response body:

```xml
<ModelWithAttributes id1="123" id2="foo">
  <enabled>true</enabled>
</ModelWithAttributes>
```

### Payload_Xml_ModelWithAttributesValue_put

- Endpoint: `put /payload/xml/modelWithAttributes`

Expected request body:

```xml
<ModelWithAttributes id1="123" id2="foo">
  <enabled>true</enabled>
</ModelWithAttributes>
```

### Payload_Xml_ModelWithDictionaryValue_get

- Endpoint: `get /payload/xml/modelWithDictionary`

Expected response body:

```xml
<ModelWithDictionary>
  <metadata>
    <Color>blue</Color>
    <Count>123</Count>
    <Enabled>false</Enabled>
  </metadata>
</ModelWithDictionary>
```

### Payload_Xml_ModelWithDictionaryValue_put

- Endpoint: `put /payload/xml/modelWithDictionary`

Expected request body:

```xml
<ModelWithDictionary>
  <metadata>
    <Color>blue</Color>
    <Count>123</Count>
    <Enabled>false</Enabled>
  </metadata>
</ModelWithDictionary>
```

### Payload_Xml_ModelWithEmptyArrayValue_get

- Endpoint: `get /payload/xml/modelWithEmptyArray`

Expected response body:

```xml
<ModelWithEmptyArray>
  <items />
</ModelWithEmptyArray>
```

### Payload_Xml_ModelWithEmptyArrayValue_put

- Endpoint: `put /payload/xml/modelWithEmptyArray`

Expected request body:

```xml
<ModelWithEmptyArray>
  <items />
</ModelWithEmptyArray>
```

### Payload_Xml_ModelWithEncodedNamesValue_get

- Endpoint: `get /payload/xml/modelWithEncodedNames`

Expected response body:

```xml
<ModelWithEncodedNamesSrc>
  <SimpleModelData>
    <name>foo</name>
    <age>123</age>
  </SimpleModelData>
  <PossibleColors>
    <string>red</string>
    <string>green</string>
    <string>blue</string>
  </PossibleColors>
</ModelWithEncodedNamesSrc>
```

### Payload_Xml_ModelWithEncodedNamesValue_put

- Endpoint: `put /payload/xml/modelWithEncodedNames`

Expected request body:

```xml
<ModelWithEncodedNamesSrc>
  <SimpleModelData>
    <name>foo</name>
    <age>123</age>
  </SimpleModelData>
  <PossibleColors>
    <string>red</string>
    <string>green</string>
    <string>blue</string>
  </PossibleColors>
</ModelWithEncodedNamesSrc>
```

### Payload_Xml_ModelWithOptionalFieldValue_get

- Endpoint: `get /payload/xml/modelWithOptionalField`

Expected response body:

```xml
<ModelWithOptionalField>
  <item>widget</item>
</ModelWithOptionalField>
```

### Payload_Xml_ModelWithOptionalFieldValue_put

- Endpoint: `put /payload/xml/modelWithOptionalField`

Expected request body:

```xml
<ModelWithOptionalField>
  <item>widget</item>
</ModelWithOptionalField>
```

### Payload_Xml_ModelWithRenamedArraysValue_get

- Endpoint: `get /payload/xml/modelWithRenamedArrays`

Expected response body:

```xml
<ModelWithRenamedArrays>
  <Colors>red</Colors>
  <Colors>green</Colors>
  <Colors>blue</Colors>
  <Counts>
    <int32>1</int32>
    <int32>2</int32>
  </Counts>
</ModelWithRenamedArrays>
```

### Payload_Xml_ModelWithRenamedArraysValue_put

- Endpoint: `put /payload/xml/modelWithRenamedArrays`

Expected request body:

```xml
<ModelWithRenamedArrays>
  <Colors>red</Colors>
  <Colors>green</Colors>
  <Colors>blue</Colors>
  <Counts>
    <int32>1</int32>
    <int32>2</int32>
  </Counts>
</ModelWithRenamedArrays>
```

### Payload_Xml_ModelWithRenamedFieldsValue_get

- Endpoint: `get /payload/xml/modelWithRenamedFields`

Expected response body:

```xml
<ModelWithRenamedFieldsSrc>
  <InputData>
    <name>foo</name>
    <age>123</age>
  </InputData>
  <OutputData>
    <name>bar</name>
    <age>456</age>
  </OutputData>
</ModelWithRenamedFieldsSrc>
```

### Payload_Xml_ModelWithRenamedFieldsValue_put

- Endpoint: `put /payload/xml/modelWithRenamedFields`

Expected request body:

```xml
<ModelWithRenamedFieldsSrc>
  <InputData>
    <name>foo</name>
    <age>123</age>
  </InputData>
  <OutputData>
    <name>bar</name>
    <age>456</age>
  </OutputData>
</ModelWithRenamedFieldsSrc>
```

### Payload_Xml_ModelWithSimpleArraysValue_get

- Endpoint: `get /payload/xml/modelWithSimpleArrays`

Expected response body:

```xml
<ModelWithSimpleArrays>
  <colors>
    <string>red</string>
    <string>green</string>
    <string>blue</string>
  </colors>
  <counts>
    <int32>1</int32>
    <int32>2</int32>
  </counts>
</ModelWithSimpleArrays>
```

### Payload_Xml_ModelWithSimpleArraysValue_put

- Endpoint: `put /payload/xml/modelWithSimpleArrays`

Expected request body:

```xml
<ModelWithSimpleArrays>
  <colors>
    <string>red</string>
    <string>green</string>
    <string>blue</string>
  </colors>
  <counts>
    <int32>1</int32>
    <int32>2</int32>
  </counts>
</ModelWithSimpleArrays>
```

### Payload_Xml_ModelWithTextValue_get

- Endpoint: `get /payload/xml/modelWithText`

Expected response body:

```xml
<ModelWithText language="foo">
  This is some text.
</ModelWithText>
```

### Payload_Xml_ModelWithTextValue_put

- Endpoint: `put /payload/xml/modelWithText`

Expected request body:

```xml
<ModelWithText language="foo">
  This is some text.
</ModelWithText>
```

### Payload_Xml_ModelWithUnwrappedArrayValue_get

- Endpoint: `get /payload/xml/modelWithUnwrappedArray`

Expected response body:

```xml
<ModelWithUnwrappedArray>
  <colors>red</colors>
  <colors>green</colors>
  <colors>blue</colors>
  <counts>
    <int32>1</int32>
    <int32>2</int32>
  </counts>
</ModelWithUnwrappedArray>
```

### Payload_Xml_ModelWithUnwrappedArrayValue_put

- Endpoint: `put /payload/xml/modelWithUnwrappedArray`

Expected request body:

```xml
<ModelWithUnwrappedArray>
  <colors>red</colors>
  <colors>green</colors>
  <colors>blue</colors>
  <counts>
    <int32>1</int32>
    <int32>2</int32>
  </counts>
</ModelWithUnwrappedArray>
```

### Payload_Xml_SimpleModelValue_get

- Endpoint: `get /payload/xml/simpleModel`

Expected response body:

```xml
<SimpleModel>
  <name>foo</name>
  <age>123</age>
</SimpleModel>
```

### Payload_Xml_SimpleModelValue_put

- Endpoint: `put /payload/xml/simpleModel`

Expected request body:

```xml
<SimpleModel>
  <name>foo</name>
  <age>123</age>
</SimpleModel>
```

### Resiliency_ServiceDriven_addOperation

- Endpoint: `delete /resiliency/service-driven/client:v2/service:{serviceDeploymentVersion}/api-version:{apiVersion}/add-operation`

Need the following two calls:

- Call with client spec version "v1" with `serviceDeploymentVersion="v2"` and `apiVersion="v2"`
- Call with client spec version "v2" with `serviceDeploymentVersion="v2"` and `apiVersion="v2"`

There are three concepts that should be clarified:

1. Client spec version: refers to the spec that the client is generated from. 'v1' is a client generated from old.tsp and 'v2' is a client generated from main.tsp.
2. Service deployment version: refers to a deployment version of the service. 'v1' represents the initial deployment of the service with a single api version. 'v2' represents the new deployment of a service with multiple api versions
3. Api version: The initial deployment of the service only supports api version 'v1'. The new deployment of the service supports api versions 'v1' and 'v2'.

With the above two calls, we test the following configurations from this service spec:

- A client generated from the first service spec can break the glass and call the second deployment of a service with api version v2
- A client generated from the second service spec can call the second deployment of a service with api version v2 with the updated changes

Tests that we can grow up by adding an operation.

### Resiliency_ServiceDriven_AddOptionalParam_fromNone

- Endpoint: `head /resiliency/service-driven/client:v2/service:{serviceDeploymentVersion}/api-version:{apiVersion}/add-optional-param/from-none`

Need the following two calls:

- Pass in `serviceDeploymentVersion="v2"` and `apiVersion="v1"` with no parameters.
- Pass in `serviceDeploymentVersion="v2"` and `apiVersion="v2"` with query parameter `new-parameter="new"`.

There are three concepts that should be clarified:

1. Client spec version: refers to the spec that the client is generated from. 'v1' is a client generated from old.tsp and 'v2' is a client generated from main.tsp.
2. Service deployment version: refers to a deployment version of the service. 'v1' represents the initial deployment of the service with a single api version. 'v2' represents the new deployment of a service with multiple api versions
3. Api version: The initial deployment of the service only supports api version 'v1'. The new deployment of the service supports api versions 'v1' and 'v2'.

With the above two calls, we test the following configurations from this service spec:

- A client generated from the second service spec can call the second deployment of a service with api version v1
- A client generated from the second service spec can call the second deployment of a service with api version v2 with the updated changes

Tests that we can grow up an operation from accepting no parameters to accepting an optional input parameter.

### Resiliency_ServiceDriven_AddOptionalParam_fromOneOptional

- Endpoint: `get /resiliency/service-driven/client:v2/service:{serviceDeploymentVersion}/api-version:{apiVersion}/add-optional-param/from-one-optional`

Need the following two calls:

- Pass in `serviceDeploymentVersion="v2"` and `apiVersion="v1"` with query parameter `parameter="optional"`.
- Pass in `serviceDeploymentVersion="v2"` and `apiVersion="v2"` with query parameter `parameter="optional"` and query parameter `new-parameter="new"`.

There are three concepts that should be clarified:

1. Client spec version: refers to the spec that the client is generated from. 'v1' is a client generated from old.tsp and 'v2' is a client generated from main.tsp.
2. Service deployment version: refers to a deployment version of the service. 'v1' represents the initial deployment of the service with a single api version. 'v2' represents the new deployment of a service with multiple api versions
3. Api version: The initial deployment of the service only supports api version 'v1'. The new deployment of the service supports api versions 'v1' and 'v2'.

With the above two calls, we test the following configurations from this service spec:

- A client generated from the second service spec can call the second deployment of a service with api version v1
- A client generated from the second service spec can call the second deployment of a service with api version v2 with the updated changes

Tests that we can grow up an operation from accepting one optional parameter to accepting two optional parameters.

### Resiliency_ServiceDriven_AddOptionalParam_fromOneRequired

- Endpoint: `get /resiliency/service-driven/client:v2/service:{serviceDeploymentVersion}/api-version:{apiVersion}/add-optional-param/from-one-required`

Need the following two calls:

- Pass in `serviceDeploymentVersion="v2"` and `apiVersion="v1"` with query parameter `parameter="required"`.
- Pass in `serviceDeploymentVersion="v2"` and `apiVersion="v2"` with query parameter `parameter="required"` and query parameter `new-parameter="new"`.

There are three concepts that should be clarified:

1. Client spec version: refers to the spec that the client is generated from. 'v1' is a client generated from old.tsp and 'v2' is a client generated from main.tsp.
2. Service deployment version: refers to a deployment version of the service. 'v1' represents the initial deployment of the service with a single api version. 'v2' represents the new deployment of a service with multiple api versions
3. Api version: The initial deployment of the service only supports api version 'v1'. The new deployment of the service supports api versions 'v1' and 'v2'.

With the above two calls, we test the following configurations from this service spec:

- A client generated from the second service spec can call the second deployment of a service with api version v1
- A client generated from the second service spec can call the second deployment of a service with api version v2 with the updated changes

Tests that we can grow up an operation from accepting one required parameter to accepting a required parameter and an optional parameter.

### Routes_fixed

- Endpoint: `get /routes/fixed`

Simple operation at a fixed in an interface
Expected path: /routes/fixed

### Routes_InInterface

- Endpoint: `get /routes/in-interface/fixed`

Simple operation at a fixed in an interface
Expected path: /routes/in-interface/fixed

### Routes_PathParameters_annotationOnly

- Endpoint: `get /routes/path/annotation-only`

Path parameter annotated with @path but not defined explicitly in the route
Value: "a"
Expected path: /routes/path/annotation-only/a

### Routes_PathParameters_explicit

- Endpoint: `get /routes/path/explicit/{param}`

Path parameter defined explicitly
Value: "a"
Expected path: /routes/path/explicit/a

### Routes_PathParameters_LabelExpansion_Explode_array

- Endpoint: `get /routes/path/label/explode/array{.param*}`

Test label expansion with explode: true when passed an array value.
Param value: ["a","b"]
Expected path: /routes/label/explode/array.a.b

### Routes_PathParameters_LabelExpansion_Explode_primitive

- Endpoint: `get /routes/path/label/explode/primitive{.param*}`

Test label expansion with explode: true when passed a primitive value.
Param value: "a"
Expected path: /routes/label/explode/primitive.a

### Routes_PathParameters_LabelExpansion_Explode_record

- Endpoint: `get /routes/path/label/explode/record{.param*}`

Test label expansion with explode: true when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/label/explode/record.a=1.b=2

### Routes_PathParameters_LabelExpansion_Standard_array

- Endpoint: `get /routes/path/label/standard/array{.param}`

Test label expansion with explode: false when passed an array value.
Param value: ["a","b"]
Expected path: /routes/label/standard/array.a,b

### Routes_PathParameters_LabelExpansion_Standard_primitive

- Endpoint: `get /routes/path/label/standard/primitive{.param}`

Test label expansion with explode: false when passed a primitive value.
Param value: "a"
Expected path: /routes/label/standard/primitive.a

### Routes_PathParameters_LabelExpansion_Standard_record

- Endpoint: `get /routes/path/label/standard/record{.param}`

Test label expansion with explode: false when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/label/standard/record.a,1,b,2

### Routes_PathParameters_MatrixExpansion_Explode_array

- Endpoint: `get /routes/path/matrix/explode/array{;param*}`

Test matrix expansion with explode: true when passed an array value.
Param value: ["a","b"]
Expected path: /routes/matrix/explode/array;a.b

### Routes_PathParameters_MatrixExpansion_Explode_primitive

- Endpoint: `get /routes/path/matrix/explode/primitive{;param*}`

Test matrix expansion with explode: true when passed a primitive value.
Param value: "a"
Expected path: /routes/matrix/explode/primitive;a

### Routes_PathParameters_MatrixExpansion_Explode_record

- Endpoint: `get /routes/path/matrix/explode/record{;param*}`

Test matrix expansion with explode: true when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/matrix/explode/record;a=1;b=2

### Routes_PathParameters_MatrixExpansion_Standard_array

- Endpoint: `get /routes/path/matrix/standard/array{;param}`

Test matrix expansion with explode: false when passed an array value.
Param value: ["a","b"]
Expected path: /routes/matrix/standard/array;a,b

### Routes_PathParameters_MatrixExpansion_Standard_primitive

- Endpoint: `get /routes/path/matrix/standard/primitive{;param}`

Test matrix expansion with explode: false when passed a primitive value.
Param value: "a"
Expected path: /routes/matrix/standard/primitive;a

### Routes_PathParameters_MatrixExpansion_Standard_record

- Endpoint: `get /routes/path/matrix/standard/record{;param}`

Test matrix expansion with explode: false when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/matrix/standard/record;a,1,b,2

### Routes_PathParameters_PathExpansion_Explode_array

- Endpoint: `get /routes/path/path/explode/array{/param*}`

Test path expansion with explode: true when passed an array value.
Param value: ["a","b"]
Expected path: /routes/path/explode/array/a/b

### Routes_PathParameters_PathExpansion_Explode_primitive

- Endpoint: `get /routes/path/path/explode/primitive{/param*}`

Test path expansion with explode: true when passed a primitive value.
Param value: "a"
Expected path: /routes/path/explode/primitive/a

### Routes_PathParameters_PathExpansion_Explode_record

- Endpoint: `get /routes/path/path/explode/record{/param*}`

Test path expansion with explode: true when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/path/explode/record/a=1/b=2

### Routes_PathParameters_PathExpansion_Standard_array

- Endpoint: `get /routes/path/path/standard/array{/param}`

Test path expansion with explode: false when passed an array value.
Param value: ["a","b"]
Expected path: /routes/path/standard/array/a,b

### Routes_PathParameters_PathExpansion_Standard_primitive

- Endpoint: `get /routes/path/path/standard/primitive{/param}`

Test path expansion with explode: false when passed a primitive value.
Param value: "a"
Expected path: /routes/path/standard/primitive/a

### Routes_PathParameters_PathExpansion_Standard_record

- Endpoint: `get /routes/path/path/standard/record{/param}`

Test path expansion with explode: false when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/path/standard/record/a,1,b,2

### Routes_PathParameters_ReservedExpansion_annotation

- Endpoint: `get /routes/path/reserved-expansion/annotation`

Defines a path parameter that shouldn't encode reserved characters. It should however still encode the other url characters.
Param value: "foo/bar baz"
Expected path: "/routes/path/reserved-expansion/annotation/foo/bar%20baz"

### Routes_PathParameters_ReservedExpansion_template

- Endpoint: `get /routes/path/reserved-expansion/template/{+param}`

Defines a path parameter that shouldn't encode reserved characters. It should however still encode the other url characters.
Param value: "foo/bar baz"
Expected path: "/routes/path/reserved-expansion/template/foo/bar%20baz"

### Routes_PathParameters_SimpleExpansion_Explode_array

- Endpoint: `get /routes/path/simple/explode/array{param*}`

Test simple expansion with explode: true when passed an array value.
Param value: ["a","b"]
Expected path: /routes/simple/explode/arraya.b

### Routes_PathParameters_SimpleExpansion_Explode_primitive

- Endpoint: `get /routes/path/simple/explode/primitive{param*}`

Test simple expansion with explode: true when passed a primitive value.
Param value: "a"
Expected path: /routes/simple/explode/primitivea

### Routes_PathParameters_SimpleExpansion_Explode_record

- Endpoint: `get /routes/path/simple/explode/record{param*}`

Test simple expansion with explode: true when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/simple/explode/recorda=1,b=2

### Routes_PathParameters_SimpleExpansion_Standard_array

- Endpoint: `get /routes/path/simple/standard/array{param}`

Test simple expansion with explode: false when passed an array value.
Param value: ["a","b"]
Expected path: /routes/simple/standard/arraya,b

### Routes_PathParameters_SimpleExpansion_Standard_primitive

- Endpoint: `get /routes/path/simple/standard/primitive{param}`

Test simple expansion with explode: false when passed a primitive value.
Param value: "a"
Expected path: /routes/simple/standard/primitivea

### Routes_PathParameters_SimpleExpansion_Standard_record

- Endpoint: `get /routes/path/simple/standard/record{param}`

Test simple expansion with explode: false when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/simple/standard/recorda,1,b,2

### Routes_PathParameters_templateOnly

- Endpoint: `get /routes/path/template-only/{param}`

Path parameter defined implicitly
Value: "a"
Expected path: /routes/path/template-only/a

### Routes_QueryParameters_annotationOnly

- Endpoint: `get /routes/query/annotation-only`

Query parameter annotated with @query but not defined explicitly in the route

### Routes_QueryParameters_explicit

- Endpoint: `get /routes/query/explicit{?param}`

Query parameter marked with explicit @query

### Routes_QueryParameters_QueryContinuation_Explode_array

- Endpoint: `get /routes/query/query-continuation/explode/array?fixed=true{&param*}`

Test query continuation expansion with explode: true when passed an array value.
Param value: ["a","b"]
Expected path: /routes/query/query-continuation/explode/array?fixed=true&param=a&param=b

### Routes_QueryParameters_QueryContinuation_Explode_primitive

- Endpoint: `get /routes/query/query-continuation/explode/primitive?fixed=true{&param*}`

Test query continuation expansion with explode: true when passed a primitive value.
Param value: "a"
Expected path: /routes/query/query-continuation/explode/primitive?fixed=true&param=a

### Routes_QueryParameters_QueryContinuation_Explode_record

- Endpoint: `get /routes/query/query-continuation/explode/record?fixed=true{&param*}`

Test query continuation expansion with explode: true when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/query/query-continuation/explode/record?fixed=true&a=1&b=2

### Routes_QueryParameters_QueryContinuation_Standard_array

- Endpoint: `get /routes/query/query-continuation/standard/array?fixed=true{&param}`

Test query continuation expansion with explode: false when passed an array value.
Param value: ["a","b"]
Expected path: /routes/query/query-continuation/standard/array?fixed=true&param=a,b

### Routes_QueryParameters_QueryContinuation_Standard_primitive

- Endpoint: `get /routes/query/query-continuation/standard/primitive?fixed=true{&param}`

Test query continuation expansion with explode: false when passed a primitive value.
Param value: "a"
Expected path: /routes/query/query-continuation/standard/primitive?fixed=true&param=a

### Routes_QueryParameters_QueryContinuation_Standard_record

- Endpoint: `get /routes/query/query-continuation/standard/record?fixed=true{&param}`

Test query continuation expansion with explode: false when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/query/query-continuation/standard/record?fixed=true&param=a,1,b,2

### Routes_QueryParameters_QueryExpansion_Explode_array

- Endpoint: `get /routes/query/query-expansion/explode/array{?param*}`

Test query expansion with explode: true when passed an array value.
Param value: ["a","b"]
Expected path: /routes/query/query-expansion/explode/array?param=a&param=b

### Routes_QueryParameters_QueryExpansion_Explode_primitive

- Endpoint: `get /routes/query/query-expansion/explode/primitive{?param*}`

Test query expansion with explode: true when passed a primitive value.
Param value: "a"
Expected path: /routes/query/query-expansion/explode/primitive?param=a

### Routes_QueryParameters_QueryExpansion_Explode_record

- Endpoint: `get /routes/query/query-expansion/explode/record{?param*}`

Test query expansion with explode: true when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/query/query-expansion/explode/record?a=1&b=2

### Routes_QueryParameters_QueryExpansion_Standard_array

- Endpoint: `get /routes/query/query-expansion/standard/array{?param}`

Test query expansion with explode: false when passed an array value.
Param value: ["a","b"]
Expected path: /routes/query/query-expansion/standard/array?param=a,b

### Routes_QueryParameters_QueryExpansion_Standard_primitive

- Endpoint: `get /routes/query/query-expansion/standard/primitive{?param}`

Test query expansion with explode: false when passed a primitive value.
Param value: "a"
Expected path: /routes/query/query-expansion/standard/primitive?param=a

### Routes_QueryParameters_QueryExpansion_Standard_record

- Endpoint: `get /routes/query/query-expansion/standard/record{?param}`

Test query expansion with explode: false when passed a record value.
Param value: {a: 1, b: 2}
Expected path: /routes/query/query-expansion/standard/record?param=a,1,b,2

### Routes_QueryParameters_templateOnly

- Endpoint: `get /routes/query/template-only{?param}`

Query parameter defined implicitly

### Serialization_EncodedName_Json_Property_get

- Endpoint: `get /serialization/encoded-name/json/property`

Testing that you deserialize the right json name over the wire.

Your generated SDK should generate JsonEncodedNameModel with one property `defaultName` with wire name `wireName`.

Expected response body:

```json
{ "wireName": true }
```

### Serialization_EncodedName_Json_Property_send

- Endpoint: `post /serialization/encoded-name/json/property`

Testing that you send the right JSON name on the wire.
Your generated SDK should generate JsonEncodedNameModel with one property `defaultName` with wire name `wireName`.

Expected request body:

```json
{ "wireName": true }
```

### Server_Endpoint_NotDefined_valid

- Endpoint: `head /server/endpoint/not-defined/valid`

A simple operation in a server without defining a endpoint. Expected uri: '<endpoint you start cadl-ranch>/valid'

### Server_Path_Multiple_noOperationParams

- Endpoint: `get /server/path/multiple/{apiVersion}`

Operation with client path parameters.

Expected path parameter: apiVersion=v1.0

### Server_Path_Multiple_withOperationPathParam

- Endpoint: `get /server/path/multiple/{apiVersion}`

Operation with client and method path parameters.

Expected path parameter: apiVersion=v1.0, keyword=test

### Server_Path_Single_myOp

- Endpoint: `head /server/path/single/myOp`

An simple operation in a parameterized server.

### Server_Versions_NotVersioned_withoutApiVersion

- Endpoint: `head /server/versions/not-versioned/without-api-version`

A simple operation without api-version. Expected url: '/without-api-version', it should not contain any api-version.

### Server_Versions_NotVersioned_withPathApiVersion

- Endpoint: `head /server/versions/not-versioned/with-path-api-version`

A simple operation with path api-version, which doesn't have any default value. Expected url: '/with-path-api-version/v1.0'.

### Server_Versions_NotVersioned_withQueryApiVersion

- Endpoint: `head /server/versions/not-versioned/with-query-api-version`

A simple operation with query api-version, which doesn't have any default value. Expected url: '/with-query-api-version?api-version=v1.0'.

### Server_Versions_Versioned_withoutApiVersion

- Endpoint: `head /server/versions/versioned/without-api-version`

A simple operation without api-version. Expected url: '/without-api-version', it should not contain any api-version.

### Server_Versions_Versioned_withPathApiVersion

- Endpoint: `head /server/versions/versioned/with-path-api-version`

A simple operation with path api-version, whose default value is defined as '2022-12-01-preview'. Expected url: '/with-path-api-version/2022-12-01-preview'.

### Server_Versions_Versioned_withQueryApiVersion

- Endpoint: `head /server/versions/versioned/with-query-api-version`

A simple operation with query api-version, whose default value is defined as '2022-12-01-preview'. Expected url: '/with-query-api-version?api-version=2022-12-01-preview'.

### Server_Versions_Versioned_withQueryOldApiVersion

- Endpoint: `head /server/versions/versioned/with-query-old-api-version`

A simple operation with query api-version, that do NOT use the default but '2021-01-01-preview'. It's expected to be set at the client level. Expected url: '/with-old-query-api-version?api-version=2021-01-01-preview'.

### SpecialHeaders_ConditionalRequest_headIfModifiedSince

- Endpoint: `head /special-headers/conditional-request/if-modified-since`

Check when only If-Modified-Since in header is defined.
Expected header parameters:

- if-modified-since=Fri, 26 Aug 2022 14:38:00 GMT

### SpecialHeaders_ConditionalRequest_postIfMatch

- Endpoint: `post /special-headers/conditional-request/if-match`

Check when only If-Match in header is defined.
Expected header parameters:

- if-match="valid"

### SpecialHeaders_ConditionalRequest_postIfNoneMatch

- Endpoint: `post /special-headers/conditional-request/if-none-match`

Check when only If-None-Match in header is defined.
Expected header parameters:

- if-nonematch="invalid"

### SpecialHeaders_ConditionalRequest_postIfUnmodifiedSince

- Endpoint: `post /special-headers/conditional-request/if-unmodified-since`

Check when only If-Unmodified-Since in header is defined.
Expected header parameters:

- if-unmodified-since=Fri, 26 Aug 2022 14:38:00 GMT

### SpecialHeaders_Repeatability_immediateSuccess

- Endpoint: `post /special-headers/repeatability/immediateSuccess`

Check we recognize Repeatability-Request-ID and Repeatability-First-Sent.

### SpecialWords_ModelProperties_sameAsModel

- Endpoint: `get /special-words/model-properties/same-as-model`

Verify that a property can be called the same as the model name. This can be an issue in some languages where the class name is the constructor.

Send

```json
{ "SameAsModel": "ok" }
```

### SpecialWords_Models_and

- Endpoint: `get /special-words/models/and`

Verify that the name "and" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_as

- Endpoint: `get /special-words/models/as`

Verify that the name "as" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_assert

- Endpoint: `get /special-words/models/assert`

Verify that the name "assert" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_async

- Endpoint: `get /special-words/models/async`

Verify that the name "async" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_await

- Endpoint: `get /special-words/models/await`

Verify that the name "await" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_break

- Endpoint: `get /special-words/models/break`

Verify that the name "break" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_class

- Endpoint: `get /special-words/models/class`

Verify that the name "class" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_constructor

- Endpoint: `get /special-words/models/constructor`

Verify that the name "constructor" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_continue

- Endpoint: `get /special-words/models/continue`

Verify that the name "continue" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_def

- Endpoint: `get /special-words/models/def`

Verify that the name "def" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_del

- Endpoint: `get /special-words/models/del`

Verify that the name "del" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_elif

- Endpoint: `get /special-words/models/elif`

Verify that the name "elif" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_else

- Endpoint: `get /special-words/models/else`

Verify that the name "else" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_except

- Endpoint: `get /special-words/models/except`

Verify that the name "except" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_exec

- Endpoint: `get /special-words/models/exec`

Verify that the name "exec" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_finally

- Endpoint: `get /special-words/models/finally`

Verify that the name "finally" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_for

- Endpoint: `get /special-words/models/for`

Verify that the name "for" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_from

- Endpoint: `get /special-words/models/from`

Verify that the name "from" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_global

- Endpoint: `get /special-words/models/global`

Verify that the name "global" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_if

- Endpoint: `get /special-words/models/if`

Verify that the name "if" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_import

- Endpoint: `get /special-words/models/import`

Verify that the name "import" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_in

- Endpoint: `get /special-words/models/in`

Verify that the name "in" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_is

- Endpoint: `get /special-words/models/is`

Verify that the name "is" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_lambda

- Endpoint: `get /special-words/models/lambda`

Verify that the name "lambda" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_not

- Endpoint: `get /special-words/models/not`

Verify that the name "not" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_or

- Endpoint: `get /special-words/models/or`

Verify that the name "or" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_pass

- Endpoint: `get /special-words/models/pass`

Verify that the name "pass" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_raise

- Endpoint: `get /special-words/models/raise`

Verify that the name "raise" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_return

- Endpoint: `get /special-words/models/return`

Verify that the name "return" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_try

- Endpoint: `get /special-words/models/try`

Verify that the name "try" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_while

- Endpoint: `get /special-words/models/while`

Verify that the name "while" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_with

- Endpoint: `get /special-words/models/with`

Verify that the name "with" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Models_yield

- Endpoint: `get /special-words/models/yield`

Verify that the name "yield" works. Send

```json
{ "name": "ok" }
```

### SpecialWords_Operations_and

- Endpoint: `get /special-words/operations/and`

Verify that the name "and" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_as

- Endpoint: `get /special-words/operations/as`

Verify that the name "as" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_assert

- Endpoint: `get /special-words/operations/assert`

Verify that the name "assert" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_async

- Endpoint: `get /special-words/operations/async`

Verify that the name "async" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_await

- Endpoint: `get /special-words/operations/await`

Verify that the name "await" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_break

- Endpoint: `get /special-words/operations/break`

Verify that the name "break" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_class

- Endpoint: `get /special-words/operations/class`

Verify that the name "class" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_constructor

- Endpoint: `get /special-words/operations/constructor`

Verify that the name "constructor" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_continue

- Endpoint: `get /special-words/operations/continue`

Verify that the name "continue" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_def

- Endpoint: `get /special-words/operations/def`

Verify that the name "def" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_del

- Endpoint: `get /special-words/operations/del`

Verify that the name "del" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_elif

- Endpoint: `get /special-words/operations/elif`

Verify that the name "elif" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_else

- Endpoint: `get /special-words/operations/else`

Verify that the name "else" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_except

- Endpoint: `get /special-words/operations/except`

Verify that the name "except" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_exec

- Endpoint: `get /special-words/operations/exec`

Verify that the name "exec" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_finally

- Endpoint: `get /special-words/operations/finally`

Verify that the name "finally" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_for

- Endpoint: `get /special-words/operations/for`

Verify that the name "for" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_from

- Endpoint: `get /special-words/operations/from`

Verify that the name "from" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_global

- Endpoint: `get /special-words/operations/global`

Verify that the name "global" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_if

- Endpoint: `get /special-words/operations/if`

Verify that the name "if" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_import

- Endpoint: `get /special-words/operations/import`

Verify that the name "import" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_in

- Endpoint: `get /special-words/operations/in`

Verify that the name "in" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_is

- Endpoint: `get /special-words/operations/is`

Verify that the name "is" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_lambda

- Endpoint: `get /special-words/operations/lambda`

Verify that the name "lambda" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_not

- Endpoint: `get /special-words/operations/not`

Verify that the name "not" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_or

- Endpoint: `get /special-words/operations/or`

Verify that the name "or" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_pass

- Endpoint: `get /special-words/operations/pass`

Verify that the name "pass" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_raise

- Endpoint: `get /special-words/operations/raise`

Verify that the name "raise" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_return

- Endpoint: `get /special-words/operations/return`

Verify that the name "return" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_try

- Endpoint: `get /special-words/operations/try`

Verify that the name "try" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_while

- Endpoint: `get /special-words/operations/while`

Verify that the name "while" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_with

- Endpoint: `get /special-words/operations/with`

Verify that the name "with" works as an operation name. Call this operation to pass.

### SpecialWords_Operations_yield

- Endpoint: `get /special-words/operations/yield`

Verify that the name "yield" works as an operation name. Call this operation to pass.

### SpecialWords_Parameters_and

- Endpoint: `get /special-words/parameters/and`

Verify that the name "and" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_as

- Endpoint: `get /special-words/parameters/as`

Verify that the name "as" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_assert

- Endpoint: `get /special-words/parameters/assert`

Verify that the name "assert" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_async

- Endpoint: `get /special-words/parameters/async`

Verify that the name "async" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_await

- Endpoint: `get /special-words/parameters/await`

Verify that the name "await" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_break

- Endpoint: `get /special-words/parameters/break`

Verify that the name "break" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_cancellationToken

- Endpoint: `get /special-words/parameters/cancellationToken`

Verify that the name "cancellationToken" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_class

- Endpoint: `get /special-words/parameters/class`

Verify that the name "class" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_constructor

- Endpoint: `get /special-words/parameters/constructor`

Verify that the name "constructor" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_continue

- Endpoint: `get /special-words/parameters/continue`

Verify that the name "continue" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_def

- Endpoint: `get /special-words/parameters/def`

Verify that the name "def" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_del

- Endpoint: `get /special-words/parameters/del`

Verify that the name "del" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_elif

- Endpoint: `get /special-words/parameters/elif`

Verify that the name "elif" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_else

- Endpoint: `get /special-words/parameters/else`

Verify that the name "else" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_except

- Endpoint: `get /special-words/parameters/except`

Verify that the name "except" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_exec

- Endpoint: `get /special-words/parameters/exec`

Verify that the name "exec" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_finally

- Endpoint: `get /special-words/parameters/finally`

Verify that the name "finally" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_for

- Endpoint: `get /special-words/parameters/for`

Verify that the name "for" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_from

- Endpoint: `get /special-words/parameters/from`

Verify that the name "from" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_global

- Endpoint: `get /special-words/parameters/global`

Verify that the name "global" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_if

- Endpoint: `get /special-words/parameters/if`

Verify that the name "if" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_import

- Endpoint: `get /special-words/parameters/import`

Verify that the name "import" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_in

- Endpoint: `get /special-words/parameters/in`

Verify that the name "in" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_is

- Endpoint: `get /special-words/parameters/is`

Verify that the name "is" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_lambda

- Endpoint: `get /special-words/parameters/lambda`

Verify that the name "lambda" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_not

- Endpoint: `get /special-words/parameters/not`

Verify that the name "not" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_or

- Endpoint: `get /special-words/parameters/or`

Verify that the name "or" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_pass

- Endpoint: `get /special-words/parameters/pass`

Verify that the name "pass" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_raise

- Endpoint: `get /special-words/parameters/raise`

Verify that the name "raise" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_return

- Endpoint: `get /special-words/parameters/return`

Verify that the name "return" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_try

- Endpoint: `get /special-words/parameters/try`

Verify that the name "try" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_while

- Endpoint: `get /special-words/parameters/while`

Verify that the name "while" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_with

- Endpoint: `get /special-words/parameters/with`

Verify that the name "with" works. Send this parameter to pass with value `ok`.

### SpecialWords_Parameters_yield

- Endpoint: `get /special-words/parameters/yield`

Verify that the name "yield" works. Send this parameter to pass with value `ok`.

### Type_Array_BooleanValue_get

- Endpoint: `get /type/array/boolean`

Expected Array response body:

```json
[true, false]
```

### Type_Array_BooleanValue_put

- Endpoint: `put /type/array/boolean`

Expected Array input body:

```json
[true, false]
```

### Type_Array_DatetimeValue_get

- Endpoint: `get /type/array/datetime`

Expected Array response body:

```json
["2022-08-26T18:38:00Z"]
```

### Type_Array_DatetimeValue_put

- Endpoint: `put /type/array/datetime`

Expected Array input body:

```json
["2022-08-26T18:38:00Z"]
```

### Type_Array_DurationValue_get

- Endpoint: `get /type/array/duration`

Expected Array response body:

```json
["P123DT22H14M12.011S"]
```

### Type_Array_DurationValue_put

- Endpoint: `put /type/array/duration`

Expected Array input body:

```json
["P123DT22H14M12.011S"]
```

### Type_Array_Float32Value_get

- Endpoint: `get /type/array/float32`

Expected Array response body:

```json
[43.125]
```

### Type_Array_Float32Value_put

- Endpoint: `put /type/array/float32`

Expected Array input body:

```json
[43.125]
```

### Type_Array_Int32Value_get

- Endpoint: `get /type/array/int32`

Expected Array response body:

```json
[1, 2]
```

### Type_Array_Int32Value_put

- Endpoint: `put /type/array/int32`

Expected Array input body:

```json
[1, 2]
```

### Type_Array_Int64Value_get

- Endpoint: `get /type/array/int64`

Expected Array response body:

```json
[0x7fffffffffffffff, -0x7fffffffffffffff]
```

### Type_Array_Int64Value_put

- Endpoint: `put /type/array/int64`

Expected Array input body:

```json
[0x7fffffffffffffff, -0x7fffffffffffffff]
```

### Type_Array_ModelValue_get

- Endpoint: `get /type/array/model`

Expected Array response body:

```json
[{ "property": "hello" }, { "property": "world" }]
```

### Type_Array_ModelValue_put

- Endpoint: `put /type/array/model`

Expected Array input body:

```json
[{ "property": "hello" }, { "property": "world" }]
```

### Type_Array_NullableBooleanValue_get

- Endpoint: `get /type/array/nullable-boolean`

Expected Array response body:

```json
[true, null, false]
```

### Type_Array_NullableBooleanValue_put

- Endpoint: `put /type/array/nullable-boolean`

Expected Array input body:

```json
[true, null, false]
```

### Type_Array_NullableFloatValue_get

- Endpoint: `get /type/array/nullable-float`

Expected Array response body:

```json
[1.25, null, 3.0]
```

### Type_Array_NullableFloatValue_put

- Endpoint: `put /type/array/nullable-float`

Expected Array input body:

```json
[1.25, null, 3.0]
```

### Type_Array_NullableInt32Value_get

- Endpoint: `get /type/array/nullable-int32`

Expected Array response body:

```json
[1, null, 3]
```

### Type_Array_NullableInt32Value_put

- Endpoint: `put /type/array/nullable-int32`

Expected Array input body:

```json
[1, null, 3]
```

### Type_Array_NullableModelValue_get

- Endpoint: `get /type/array/nullable-model`

Expected Array response body:

```json
[{ "property": "hello" }, null, { "property": "world" }]
```

### Type_Array_NullableModelValue_put

- Endpoint: `put /type/array/nullable-model`

Expected Array input body:

```json
[{ "property": "hello" }, null, { "property": "world" }]
```

### Type_Array_NullableStringValue_get

- Endpoint: `get /type/array/nullable-string`

Expected Array response body:

```json
["hello", null, "world"]
```

### Type_Array_NullableStringValue_put

- Endpoint: `put /type/array/nullable-string`

Expected Array input body:

```json
["hello", null, "world"]
```

### Type_Array_StringValue_get

- Endpoint: `get /type/array/string`

Expected Array response body:

```json
["hello", ""]
```

### Type_Array_StringValue_put

- Endpoint: `put /type/array/string`

Expected Array input body:

```json
["hello", ""]
```

### Type_Array_UnknownValue_get

- Endpoint: `get /type/array/unknown`

Expected Array response body:

```json
[1, 'hello', 'k3': null]
```

### Type_Array_UnknownValue_put

- Endpoint: `put /type/array/unknown`

Expected Array input body:

```json
[1, 'hello', 'k3': null]
```

### Type_Dictionary_BooleanValue_get

- Endpoint: `get /type/dictionary/boolean`

Expected dictionary response body:

```json
{ "k1": true, "k2": false }
```

### Type_Dictionary_BooleanValue_put

- Endpoint: `put /type/dictionary/boolean`

Expected dictionary input body:

```json
{ "k1": true, "k2": false }
```

### Type_Dictionary_DatetimeValue_get

- Endpoint: `get /type/dictionary/datetime`

Expected dictionary response body:

```json
{ "k1": "2022-08-26T18:38:00Z" }
```

### Type_Dictionary_DatetimeValue_put

- Endpoint: `put /type/dictionary/datetime`

Expected dictionary input body:

```json
{ "k1": "2022-08-26T18:38:00Z" }
```

### Type_Dictionary_DurationValue_get

- Endpoint: `get /type/dictionary/duration`

Expected dictionary response body:

```json
{ "k1": "P123DT22H14M12.011S" }
```

### Type_Dictionary_DurationValue_put

- Endpoint: `put /type/dictionary/duration`

Expected dictionary input body:

```json
{ "k1": "P123DT22H14M12.011S" }
```

### Type_Dictionary_Float32Value_get

- Endpoint: `get /type/dictionary/float32`

Expected dictionary response body:

```json
{ "k1": 43.125 }
```

### Type_Dictionary_Float32Value_put

- Endpoint: `put /type/dictionary/float32`

Expected dictionary input body:

```json
{ "k1": 43.125 }
```

### Type_Dictionary_Int32Value_get

- Endpoint: `get /type/dictionary/int32`

Expected dictionary response body:

```json
{ "k1": 1, "k2": 2 }
```

### Type_Dictionary_Int32Value_put

- Endpoint: `put /type/dictionary/int32`

Expected dictionary input body:

```json
{ "k1": 1, "k2": 2 }
```

### Type_Dictionary_Int64Value_get

- Endpoint: `get /type/dictionary/int64`

Expected dictionary response body:

```json
{ "k1": 0x7fffffffffffffff, "k2": -0x7fffffffffffffff }
```

### Type_Dictionary_Int64Value_put

- Endpoint: `put /type/dictionary/int64`

Expected dictionary input body:

```json
{ "k1": 0x7fffffffffffffff, "k2": -0x7fffffffffffffff }
```

### Type_Dictionary_ModelValue_get

- Endpoint: `get /type/dictionary/model`

Expected dictionary response body:

```json
{ "k1": { "property": "hello" }, "k2": { "property": "world" } }
```

### Type_Dictionary_ModelValue_put

- Endpoint: `put /type/dictionary/model`

Expected dictionary input body:

```json
{ "k1": { "property": "hello" }, "k2": { "property": "world" } }
```

### Type_Dictionary_NullableFloatValue_get

- Endpoint: `get /type/dictionary/nullable-float`

Expected dictionary response body:

```json
{ "k1": 1.25, "k2": 0.5, "k3": null }
```

### Type_Dictionary_NullableFloatValue_put

- Endpoint: `put /type/dictionary/nullable-float`

Expected dictionary input body:

```json
{ "k1": 1.25, "k2": 0.5, "k3": null }
```

### Type_Dictionary_RecursiveModelValue_get

- Endpoint: `get /type/dictionary/model/recursive`

Expected dictionary response body:

```json
{
  "k1": { "property": "hello", "children": {} },
  "k2": {
    "property": "world",
    "children": { "k2.1": { "property": "inner world" } }
  }
}
```

### Type_Dictionary_RecursiveModelValue_put

- Endpoint: `put /type/dictionary/model/recursive`

Expected dictionary input body:

```json
{
  "k1": { "property": "hello", "children": {} },
  "k2": {
    "property": "world",
    "children": { "k2.1": { "property": "inner world" } }
  }
}
```

### Type_Dictionary_StringValue_get

- Endpoint: `get /type/dictionary/string`

Expected dictionary response body:

```json
{ "k1": "hello", "k2": "" }
```

### Type_Dictionary_StringValue_put

- Endpoint: `put /type/dictionary/string`

Expected dictionary input body:

```json
{ "k1": "hello", "k2": "" }
```

### Type_Dictionary_UnknownValue_get

- Endpoint: `get /type/dictionary/unknown`

Expected dictionary response body:

```json
{ "k1": 1, "k2": "hello", "k3": null }
```

### Type_Dictionary_UnknownValue_put

- Endpoint: `put /type/dictionary/unknown`

Expected dictionary input body:

```json
{ "k1": 1, "k2": "hello", "k3": null }
```

### Type_Enum_Extensible_String_getKnownValue

- Endpoint: `get /type/enum/extensible/string/known-value`

Expect to handle a known value. Mock api will return 'Monday'

### Type_Enum_Extensible_String_getUnknownValue

- Endpoint: `get /type/enum/extensible/string/unknown-value`

Expect to handle an unknown value. Mock api will return 'Weekend'

### Type_Enum_Extensible_String_putKnownValue

- Endpoint: `put /type/enum/extensible/string/known-value`

Expect to send a known value. Mock api expect to receive 'Monday'

### Type_Enum_Extensible_String_putUnknownValue

- Endpoint: `put /type/enum/extensible/string/unknown-value`

Expect to handle an unknown value. Mock api expect to receive 'Weekend'

### Type_Enum_Fixed_String_getKnownValue

- Endpoint: `get /type/enum/fixed/string/known-value`

Expect to handle a known value. Mock api will return 'Monday'

### Type_Enum_Fixed_String_putKnownValue

- Endpoint: `put /type/enum/fixed/string/known-value`

Expect to send a known value. Mock api expect to receive 'Monday'

### Type_Enum_Fixed_String_putUnknownValue

- Endpoint: `put /type/enum/fixed/string/unknown-value`

Expect to handle an unknown value. Mock api expect to receive 'Weekend'

### Type_Model_Empty_getEmpty

- Endpoint: `get /type/model/empty/alone`

Send a GET request which returns the following body {}

### Type_Model_Empty_postRoundTripEmpty

- Endpoint: `post /type/model/empty/round-trip`

Send a POST request with the following body {} which returns the same.

### Type_Model_Empty_putEmpty

- Endpoint: `put /type/model/empty/alone`

Send a PUT request with the following body {}

### Type_Model_Inheritance_EnumDiscriminator_getExtensibleModel

- Endpoint: `get /type/model/inheritance/enum-discriminator/extensible-enum`

Receive model with extensible enum discriminator type.
Expected response body:

```json
{ "kind": "golden", "weight": 10 }
```

### Type_Model_Inheritance_EnumDiscriminator_getExtensibleModelMissingDiscriminator

- Endpoint: `get /type/model/inheritance/enum-discriminator/extensible-enum/missingdiscriminator`

Get a model omitting the discriminator.
Expected response body:

```json
{ "weight": 10 }
```

### Type_Model_Inheritance_EnumDiscriminator_getExtensibleModelWrongDiscriminator

- Endpoint: `get /type/model/inheritance/enum-discriminator/extensible-enum/wrongdiscriminator`

Get a model containing discriminator value never defined.
Expected response body:

```json
{ "weight": 8, "kind": "wrongKind" }
```

### Type_Model_Inheritance_EnumDiscriminator_getFixedModel

- Endpoint: `get /type/model/inheritance/enum-discriminator/fixed-enum`

Receive model with fixed enum discriminator type.
Expected response body:

```json
{ "kind": "cobra", "length": 10 }
```

### Type_Model_Inheritance_EnumDiscriminator_getFixedModelMissingDiscriminator

- Endpoint: `get /type/model/inheritance/enum-discriminator/fixed-enum/missingdiscriminator`

Get a model omitting the discriminator.
Expected response body:

```json
{ "length": 10 }
```

### Type_Model_Inheritance_EnumDiscriminator_getFixedModelWrongDiscriminator

- Endpoint: `get /type/model/inheritance/enum-discriminator/fixed-enum/wrongdiscriminator`

Get a model containing discriminator value never defined.
Expected response body:

```json
{ "length": 8, "kind": "wrongKind" }
```

### Type_Model_Inheritance_EnumDiscriminator_putExtensibleModel

- Endpoint: `put /type/model/inheritance/enum-discriminator/extensible-enum`

Send model with extensible enum discriminator type.
Expected request body:

```json
{ "kind": "golden", "weight": 10 }
```

### Type_Model_Inheritance_EnumDiscriminator_putFixedModel

- Endpoint: `put /type/model/inheritance/enum-discriminator/fixed-enum`

Send model with fixed enum discriminator type.
Expected request body:

```json
{ "kind": "cobra", "length": 10 }
```

### Type_Model_Inheritance_NestedDiscriminator_getMissingDiscriminator

- Endpoint: `get /type/model/inheritance/nested-discriminator/missingdiscriminator`

Get a model omitting the discriminator.
Expected response body:

```json
{ "age": 1 }
```

### Type_Model_Inheritance_NestedDiscriminator_getModel

- Endpoint: `get /type/model/inheritance/nested-discriminator/model`

Generate and receive polymorphic model in multiple levels inheritance with 2 discriminators.
Expected response body:

```json
{ "age": 1, "kind": "shark", "sharktype": "goblin" }
```

### Type_Model_Inheritance_NestedDiscriminator_getRecursiveModel

- Endpoint: `get /type/model/inheritance/nested-discriminator/recursivemodel`

Generate and receive polymorphic models has collection and dictionary properties referring to other polymorphic models.
Expected response body:

```json
{
  "age": 1,
  "kind": "salmon",
  "partner": {
    "age": 2,
    "kind": "shark",
    "sharktype": "saw"
  },
  "friends": [
    {
      "age": 2,
      "kind": "salmon",
      "partner": {
        "age": 3,
        "kind": "salmon"
      },
      "hate": {
        "key1": {
          "age": 4,
          "kind": "salmon"
        },
        "key2": {
          "age": 2,
          "kind": "shark",
          "sharktype": "goblin"
        }
      }
    },
    {
      "age": 3,
      "kind": "shark",
      "sharktype": "goblin"
    }
  ],
  "hate": {
    "key3": {
      "age": 3,
      "kind": "shark",
      "sharktype": "saw"
    },
    "key4": {
      "age": 2,
      "kind": "salmon",
      "friends": [
        {
          "age": 1,
          "kind": "salmon"
        },
        {
          "age": 4,
          "kind": "shark",
          "sharktype": "goblin"
        }
      ]
    }
  }
}
```

### Type_Model_Inheritance_NestedDiscriminator_getWrongDiscriminator

- Endpoint: `get /type/model/inheritance/nested-discriminator/wrongdiscriminator`

Get a model containing discriminator value never defined.
Expected response body:

```json
{ "age": 1, "kind": "wrongKind" }
```

### Type_Model_Inheritance_NestedDiscriminator_putModel

- Endpoint: `put /type/model/inheritance/nested-discriminator/model`

Generate and send polymorphic model in multiple levels inheritance with 2 discriminators.
Expected input body:

```json
{ "age": 1, "kind": "shark", "sharktype": "goblin" }
```

### Type_Model_Inheritance_NestedDiscriminator_putRecursiveModel

- Endpoint: `put /type/model/inheritance/nested-discriminator/recursivemodel`

Generate and send polymorphic models has collection and dictionary properties referring to other polymorphic models.
Expected input body:

```json
{
  "age": 1,
  "kind": "salmon",
  "partner": {
    "age": 2,
    "kind": "shark",
    "sharktype": "saw"
  },
  "friends": [
    {
      "age": 2,
      "kind": "salmon",
      "partner": {
        "age": 3,
        "kind": "salmon"
      },
      "hate": {
        "key1": {
          "age": 4,
          "kind": "salmon"
        },
        "key2": {
          "age": 2,
          "kind": "shark",
          "sharktype": "goblin"
        }
      }
    },
    {
      "age": 3,
      "kind": "shark",
      "sharktype": "goblin"
    }
  ],
  "hate": {
    "key3": {
      "age": 3,
      "kind": "shark",
      "sharktype": "saw"
    },
    "key4": {
      "age": 2,
      "kind": "salmon",
      "friends": [
        {
          "age": 1,
          "kind": "salmon"
        },
        {
          "age": 4,
          "kind": "shark",
          "sharktype": "goblin"
        }
      ]
    }
  }
}
```

### Type_Model_Inheritance_NotDiscriminated_getValid

- Endpoint: `get /type/model/inheritance/not-discriminated/valid`

Generate and receive model.
Expected response body:

```json
{ "name": "abc", "age": 32, "smart": true }
```

### Type_Model_Inheritance_NotDiscriminated_postValid

- Endpoint: `post /type/model/inheritance/not-discriminated/valid`

Generate and send model.
Expected input body:

```json
{ "name": "abc", "age": 32, "smart": true }
```

### Type_Model_Inheritance_NotDiscriminated_putValid

- Endpoint: `put /type/model/inheritance/not-discriminated/valid`

Generate, send, and receive round-trip bottom model.

### Type_Model_Inheritance_Recursive_get

- Endpoint: `get /type/model/inheritance/recursive`

Send a GET request which returns the following body:
Expected response body:

```json
{
  "level": 0,
  "extension": [
    {
      "level": 1,
      "extension": [
        {
          "level": 2
        }
      ]
    },
    {
      "level": 1
    }
  ]
}
```

### Type_Model_Inheritance_Recursive_put

- Endpoint: `put /type/model/inheritance/recursive`

Send a PUT request with the following body:
Expected input body:

```json
{
  "level": 0,
  "extension": [
    {
      "level": 1,
      "extension": [
        {
          "level": 2
        }
      ]
    },
    {
      "level": 1
    }
  ]
}
```

### Type_Model_Inheritance_SingleDiscriminator_getLegacyModel

- Endpoint: `get /type/model/inheritance/single-discriminator/legacy-model`

Generate and receive polymorphic model defined in legacy way.
Expected response body:

```json
{ "size": 20, "kind": "t-rex" }
```

### Type_Model_Inheritance_SingleDiscriminator_getMissingDiscriminator

- Endpoint: `get /type/model/inheritance/single-discriminator/missingdiscriminator`

Get a model omitting the discriminator.
Expected response body:

```json
{ "wingspan": 1 }
```

### Type_Model_Inheritance_SingleDiscriminator_getModel

- Endpoint: `get /type/model/inheritance/single-discriminator/model`

Generate and receive polymorphic model in single level inheritance with 1 discriminator.
Expected response body:

```json
{ "wingspan": 1, "kind": "sparrow" }
```

### Type_Model_Inheritance_SingleDiscriminator_getRecursiveModel

- Endpoint: `get /type/model/inheritance/single-discriminator/recursivemodel`

Generate and receive polymorphic models has collection and dictionary properties referring to other polymorphic models.
Expected response body:

```json
{
  "wingspan": 5,
  "kind": "eagle",
  "partner": {
    "wingspan": 2,
    "kind": "goose"
  },
  "friends": [
    {
      "wingspan": 2,
      "kind": "seagull"
    }
  ],
  "hate": {
    "key3": {
      "wingspan": 1,
      "kind": "sparrow"
    }
  }
}
```

### Type_Model_Inheritance_SingleDiscriminator_getWrongDiscriminator

- Endpoint: `get /type/model/inheritance/single-discriminator/wrongdiscriminator`

Get a model containing discriminator value never defined.
Expected response body:

```json
{ "wingspan": 1, "kind": "wrongKind" }
```

### Type_Model_Inheritance_SingleDiscriminator_putModel

- Endpoint: `put /type/model/inheritance/single-discriminator/model`

Generate and send polymorphic model in single level inheritance with 1 discriminator.
Expected input body:

```json
{ "wingspan": 1, "kind": "sparrow" }
```

### Type_Model_Inheritance_SingleDiscriminator_putRecursiveModel

- Endpoint: `put /type/model/inheritance/single-discriminator/recursivemodel`

Generate and send polymorphic models has collection and dictionary properties referring to other polymorphic models.
Expected input body:

```json
{
  "wingspan": 5,
  "kind": "eagle",
  "partner": {
    "wingspan": 2,
    "kind": "goose"
  },
  "friends": [
    {
      "wingspan": 2,
      "kind": "seagull"
    }
  ],
  "hate": {
    "key3": {
      "wingspan": 1,
      "kind": "sparrow"
    }
  }
}
```

### Type_Model_Templated_float32Type

- Endpoint: `put /type/model/templated/float32ValuesType`

Expected input body:

```json
{
  "kind": "Float32Values",
  "values": [0.5],
  "value": 0.5
}
```

Expected response body:

```json
{
  "kind": "Float32Values",
  "values": [0.5],
  "value": 0.5
}
```

### Type_Model_Templated_int32Type

- Endpoint: `put /type/model/templated/int32ValuesType`

Expected input body:

```json
{
  "kind": "Int32Values",
  "values": [1234],
  "value": 1234
}
```

Expected response body:

```json
{
  "kind": "Int32Values",
  "values": [1234],
  "value": 1234
}
```

### Type_Model_Templated_numericType

- Endpoint: `put /type/model/templated/numericType`

Expected input body:

```json
{
  "kind": "Int32Values",
  "values": [1234],
  "value": 1234
}
```

Expected response body:

```json
{
  "values": [1234],
  "value": 1234
}
```

### Type_Model_Usage_input

- Endpoint: `get /type/model/usage/input`

Send a POST request with the following body {requiredProp: "example-value"}

### Type_Model_Usage_inputAndOutput

- Endpoint: `get /type/model/usage/input-output`

Send a POST request which return the following body {requiredProp: "example-value"} and return the same.

### Type_Model_Usage_output

- Endpoint: `get /type/model/usage/output`

Send a GET request which return the following body {requiredProp: "example-value"}

### Type_Model_Visibility_deleteModel

- Endpoint: `delete /type/model/visibility`

Generate abd send put model with write/create properties.
Expected input body:

```json
{
  "deleteProp": true
}
```

### Type_Model_Visibility_getModel

- Endpoint: `get /type/model/visibility`

Generate and receive output model with readonly properties.
Expected input body:

```json
{
  "queryProp": 123
}
```

Expected response body:

```json
{
  "readProp": "abc"
}
```

### Type_Model_Visibility_headModel

- Endpoint: `head /type/model/visibility`

Generate abd send put model with write/create properties.
Expected input body:

```json
{
  "queryProp": 123
}
```

### Type_Model_Visibility_patchModel

- Endpoint: `patch /type/model/visibility`

Generate abd send put model with write/update properties.
Expected input body:

```json
{
  "updateProp": [1, 2]
}
```

### Type_Model_Visibility_postModel

- Endpoint: `post /type/model/visibility`

Generate abd send put model with write/create properties.
Expected input body:

```json
{
  "createProp": ["foo", "bar"]
}
```

### Type_Model_Visibility_putModel

- Endpoint: `put /type/model/visibility`

Generate abd send put model with write/create/update properties.
Expected input body:

```json
{
  "createProp": ["foo", "bar"],
  "updateProp": [1, 2]
}
```

### Type_Model_Visibility_putReadOnlyModel

- Endpoint: `put /type/model/visibility/readonlyroundtrip`

Generate and receive output model with readonly properties.

Expected input body:

```json
{}
```

Expected response body:

```json
{
  "optionalNullableIntList": [1, 2, 3],
  "optionalStringRecord": { "k1": "value1", "k2": "value2" }
}
```

### Type_Property_AdditionalProperties_ExtendsDifferentSpreadFloat_get

- Endpoint: `get /type/property/additionalProperties/extendsDifferentSpreadFloat`

Expected response body:

```json
{ "name": "abc", "prop": 43.125, "derivedProp": 43.125 }
```

### Type_Property_AdditionalProperties_ExtendsDifferentSpreadFloat_put

- Endpoint: `put /type/property/additionalProperties/extendsDifferentSpreadFloat`

Expected input body:

```json
{ "name": "abc", "prop": 43.125, "derivedProp": 43.125 }
```

### Type_Property_AdditionalProperties_ExtendsDifferentSpreadModel_get

- Endpoint: `get /type/property/additionalProperties/extendsDifferentSpreadModel`

Expected response body:

```json
{
  "knownProp": "abc",
  "prop": { "state": "ok" },
  "derivedProp": { "state": "ok" }
}
```

### Type_Property_AdditionalProperties_ExtendsDifferentSpreadModel_put

- Endpoint: `put /type/property/additionalProperties/extendsDifferentSpreadModel`

Expected input body:

```json
{
  "knownProp": "abc",
  "prop": { "state": "ok" },
  "derivedProp": { "state": "ok" }
}
```

### Type_Property_AdditionalProperties_ExtendsDifferentSpreadModelArray_get

- Endpoint: `get /type/property/additionalProperties/extendsDifferentSpreadModelArray`

Expected response body:

```json
{
  "knownProp": "abc",
  "prop": [{ "state": "ok" }, { "state": "ok" }],
  "derivedProp": [{ "state": "ok" }, { "state": "ok" }]
}
```

### Type_Property_AdditionalProperties_ExtendsDifferentSpreadModelArray_put

- Endpoint: `put /type/property/additionalProperties/extendsDifferentSpreadModelArray`

Expected input body:

```json
{
  "knownProp": "abc",
  "prop": [{ "state": "ok" }, { "state": "ok" }],
  "derivedProp": [{ "state": "ok" }, { "state": "ok" }]
}
```

### Type_Property_AdditionalProperties_ExtendsDifferentSpreadString_get

- Endpoint: `get /type/property/additionalProperties/extendsDifferentSpreadString`

Expected response body:

```json
{ "id": 43.125, "prop": "abc", "derivedProp": "abc" }
```

### Type_Property_AdditionalProperties_ExtendsDifferentSpreadString_put

- Endpoint: `put /type/property/additionalProperties/extendsDifferentSpreadString`

Expected input body:

```json
{ "id": 43.125, "prop": "abc", "derivedProp": "abc" }
```

### Type_Property_AdditionalProperties_ExtendsFloat_get

- Endpoint: `get /type/property/additionalProperties/extendsRecordFloat`

Expected response body:

```json
{ "id": 43.125, "prop": 43.125 }
```

### Type_Property_AdditionalProperties_ExtendsFloat_put

- Endpoint: `put /type/property/additionalProperties/extendsRecordFloat`

Expected input body:

```json
{ "id": 43.125, "prop": 43.125 }
```

### Type_Property_AdditionalProperties_ExtendsModel_get

- Endpoint: `get /type/property/additionalProperties/extendsRecordModel`

Expected response body:

```json
{ "knownProp": { "state": "ok" }, "prop": { "state": "ok" } }
```

### Type_Property_AdditionalProperties_ExtendsModel_put

- Endpoint: `put /type/property/additionalProperties/extendsRecordModel`

Expected input body:

```json
{ "knownProp": { "state": "ok" }, "prop": { "state": "ok" } }
```

### Type_Property_AdditionalProperties_ExtendsModelArray_get

- Endpoint: `get /type/property/additionalProperties/extendsRecordModelArray`

Expected response body:

```json
{
  "knownProp": [{ "state": "ok" }, { "state": "ok" }],
  "prop": [{ "state": "ok" }, { "state": "ok" }]
}
```

### Type_Property_AdditionalProperties_ExtendsModelArray_put

- Endpoint: `put /type/property/additionalProperties/extendsRecordModelArray`

Expected input body:

```json
{
  "knownProp": [{ "state": "ok" }, { "state": "ok" }],
  "prop": [{ "state": "ok" }, { "state": "ok" }]
}
```

### Type_Property_AdditionalProperties_ExtendsString_get

- Endpoint: `get /type/property/additionalProperties/extendsRecordString`

Expected response body:

```json
{ "name": "ExtendsStringAdditionalProperties", "prop": "abc" }
```

### Type_Property_AdditionalProperties_ExtendsString_put

- Endpoint: `put /type/property/additionalProperties/extendsRecordString`

Expected input body:

```json
{ "name": "ExtendsStringAdditionalProperties", "prop": "abc" }
```

### Type_Property_AdditionalProperties_ExtendsUnknown_get

- Endpoint: `get /type/property/additionalProperties/extendsRecordUnknown`

Expected response body:

```json
{
  "name": "ExtendsUnknownAdditionalProperties",
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_ExtendsUnknown_put

- Endpoint: `put /type/property/additionalProperties/extendsRecordUnknown`

Expected input body:

```json
{
  "name": "ExtendsUnknownAdditionalProperties",
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_ExtendsUnknownDerived_get

- Endpoint: `get /type/property/additionalProperties/extendsRecordUnknownDerived`

Expected response body:

```json
{
  "name": "ExtendsUnknownAdditionalProperties",
  "index": 314,
  "age": 2.71875,
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_ExtendsUnknownDerived_put

- Endpoint: `put /type/property/additionalProperties/extendsRecordUnknownDerived`

Expected input body:

```json
{
  "name": "ExtendsUnknownAdditionalProperties",
  "index": 314,
  "age": 2.71875,
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_ExtendsUnknownDiscriminated_get

- Endpoint: `get /type/property/additionalProperties/extendsUnknownDiscriminated`

Expected response body:

```json
{
  "kind": "derived",
  "name": "Derived",
  "index": 314,
  "age": 2.71875,
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_ExtendsUnknownDiscriminated_put

- Endpoint: `put /type/property/additionalProperties/extendsUnknownDiscriminated`

Expected input body:

```json
{
  "kind": "derived",
  "name": "Derived",
  "index": 314,
  "age": 2.71875,
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_IsFloat_get

- Endpoint: `get /type/property/additionalProperties/isRecordFloat`

Expected response body:

```json
{ "id": 43.125, "prop": 43.125 }
```

### Type_Property_AdditionalProperties_IsFloat_put

- Endpoint: `put /type/property/additionalProperties/isRecordFloat`

Expected input body:

```json
{ "id": 43.125, "prop": 43.125 }
```

### Type_Property_AdditionalProperties_IsModel_get

- Endpoint: `get /type/property/additionalProperties/isRecordModel`

Expected response body:

```json
{ "knownProp": { "state": "ok" }, "prop": { "state": "ok" } }
```

### Type_Property_AdditionalProperties_IsModel_put

- Endpoint: `put /type/property/additionalProperties/isRecordModel`

Expected input body:

```json
{ "knownProp": { "state": "ok" }, "prop": { "state": "ok" } }
```

### Type_Property_AdditionalProperties_IsModelArray_get

- Endpoint: `get /type/property/additionalProperties/isRecordModelArray`

Expected response body:

```json
{
  "knownProp": [{ "state": "ok" }, { "state": "ok" }],
  "prop": [{ "state": "ok" }, { "state": "ok" }]
}
```

### Type_Property_AdditionalProperties_IsModelArray_put

- Endpoint: `put /type/property/additionalProperties/isRecordModelArray`

Expected input body:

```json
{
  "knownProp": [{ "state": "ok" }, { "state": "ok" }],
  "prop": [{ "state": "ok" }, { "state": "ok" }]
}
```

### Type_Property_AdditionalProperties_IsString_get

- Endpoint: `get /type/property/additionalProperties/isRecordstring`

Expected response body:

```json
{ "name": "IsStringAdditionalProperties", "prop": "abc" }
```

### Type_Property_AdditionalProperties_IsString_put

- Endpoint: `put /type/property/additionalProperties/isRecordstring`

Expected input body:

```json
{ "name": "IsStringAdditionalProperties", "prop": "abc" }
```

### Type_Property_AdditionalProperties_IsUnknown_get

- Endpoint: `get /type/property/additionalProperties/isRecordUnknown`

Expected response body:

```json
{
  "name": "IsUnknownAdditionalProperties",
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_IsUnknown_put

- Endpoint: `put /type/property/additionalProperties/isRecordUnknown`

Expected input body:

```json
{
  "name": "IsUnknownAdditionalProperties",
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_IsUnknownDerived_get

- Endpoint: `get /type/property/additionalProperties/isRecordUnknownDerived`

Expected response body:

```json
{
  "name": "IsUnknownAdditionalProperties",
  "index": 314,
  "age": 2.71875,
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_IsUnknownDerived_put

- Endpoint: `put /type/property/additionalProperties/isRecordUnknownDerived`

Expected input body:

```json
{
  "name": "IsUnknownAdditionalProperties",
  "index": 314,
  "age": 2.71875,
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_IsUnknownDiscriminated_get

- Endpoint: `get /type/property/additionalProperties/isUnknownDiscriminated`

Expected response body:

```json
{
  "kind": "derived",
  "name": "Derived",
  "index": 314,
  "age": 2.71875,
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_IsUnknownDiscriminated_put

- Endpoint: `put /type/property/additionalProperties/isUnknownDiscriminated`

Expected input body:

```json
{
  "kind": "derived",
  "name": "Derived",
  "index": 314,
  "age": 2.71875,
  "prop1": 32,
  "prop2": true,
  "prop3": "abc"
}
```

### Type_Property_AdditionalProperties_MultipleSpread_get

- Endpoint: `get /type/property/additionalProperties/multipleSpreadRecord`

Expected response body:

```json
{ "flag": true, "prop1": "abc", "prop2": 43.125 }
```

### Type_Property_AdditionalProperties_MultipleSpread_put

- Endpoint: `put /type/property/additionalProperties/multipleSpreadRecord`

Expected input body:

```json
{ "flag": true, "prop1": "abc", "prop2": 43.125 }
```

### Type_Property_AdditionalProperties_SpreadDifferentFloat_get

- Endpoint: `get /type/property/additionalProperties/spreadDifferentRecordFloat`

Expected response body:

```json
{ "name": "abc", "prop": 43.125 }
```

### Type_Property_AdditionalProperties_SpreadDifferentFloat_put

- Endpoint: `put /type/property/additionalProperties/spreadDifferentRecordFloat`

Expected input body:

```json
{ "name": "abc", "prop": 43.125 }
```

### Type_Property_AdditionalProperties_SpreadDifferentModel_get

- Endpoint: `get /type/property/additionalProperties/spreadDifferentRecordModel`

Expected response body:

```json
{ "knownProp": "abc", "prop": { "state": "ok" } }
```

### Type_Property_AdditionalProperties_SpreadDifferentModel_put

- Endpoint: `put /type/property/additionalProperties/spreadDifferentRecordModel`

Expected input body:

```json
{ "knownProp": "abc", "prop": { "state": "ok" } }
```

### Type_Property_AdditionalProperties_SpreadDifferentModelArray_get

- Endpoint: `get /type/property/additionalProperties/spreadDifferentRecordModelArray`

Expected response body:

```json
{ "knownProp": "abc", "prop": [{ "state": "ok" }, { "state": "ok" }] }
```

### Type_Property_AdditionalProperties_SpreadDifferentModelArray_put

- Endpoint: `put /type/property/additionalProperties/spreadDifferentRecordModelArray`

Expected input body:

```json
{ "knownProp": "abc", "prop": [{ "state": "ok" }, { "state": "ok" }] }
```

### Type_Property_AdditionalProperties_SpreadDifferentString_get

- Endpoint: `get /type/property/additionalProperties/spreadDifferentRecordString`

Expected response body:

```json
{ "id": 43.125, "prop": "abc" }
```

### Type_Property_AdditionalProperties_SpreadDifferentString_put

- Endpoint: `put /type/property/additionalProperties/spreadDifferentRecordString`

Expected input body:

```json
{ "id": 43.125, "prop": "abc" }
```

### Type_Property_AdditionalProperties_SpreadFloat_get

- Endpoint: `get /type/property/additionalProperties/spreadRecordFloat`

Expected response body:

```json
{ "id": 43.125, "prop": 43.125 }
```

### Type_Property_AdditionalProperties_SpreadFloat_put

- Endpoint: `put /type/property/additionalProperties/spreadRecordFloat`

Expected input body:

```json
{ "id": 43.125, "prop": 43.125 }
```

### Type_Property_AdditionalProperties_SpreadModel_get

- Endpoint: `get /type/property/additionalProperties/spreadRecordModel`

Expected response body:

```json
{ "knownProp": { "state": "ok" }, "prop": { "state": "ok" } }
```

### Type_Property_AdditionalProperties_SpreadModel_put

- Endpoint: `put /type/property/additionalProperties/spreadRecordModel`

Expected input body:

```json
{ "knownProp": { "state": "ok" }, "prop": { "state": "ok" } }
```

### Type_Property_AdditionalProperties_SpreadModelArray_get

- Endpoint: `get /type/property/additionalProperties/spreadRecordModelArray`

Expected response body:

```json
{
  "knownProp": [{ "state": "ok" }, { "state": "ok" }],
  "prop": [{ "state": "ok" }, { "state": "ok" }]
}
```

### Type_Property_AdditionalProperties_SpreadModelArray_put

- Endpoint: `put /type/property/additionalProperties/spreadRecordModelArray`

Expected input body:

```json
{
  "knownProp": [{ "state": "ok" }, { "state": "ok" }],
  "prop": [{ "state": "ok" }, { "state": "ok" }]
}
```

### Type_Property_AdditionalProperties_SpreadRecordDiscriminatedUnion_get

- Endpoint: `get /type/property/additionalProperties/spreadRecordDiscriminatedUnion`

Expected response body:

```json
{
  "name": "abc",
  "prop1": { "kind": "kind0", "fooProp": "abc" },
  "prop2": {
    "kind": "kind1",
    "start": "2021-01-01T00:00:00Z",
    "end": "2021-01-02T00:00:00Z"
  }
}
```

### Type_Property_AdditionalProperties_SpreadRecordDiscriminatedUnion_put

- Endpoint: `put /type/property/additionalProperties/spreadRecordDiscriminatedUnion`

Expected input body:

```json
{
  "name": "abc",
  "prop1": { "kind": "kind0", "fooProp": "abc" },
  "prop2": {
    "kind": "kind1",
    "start": "2021-01-01T00:00:00Z",
    "end": "2021-01-02T00:00:00Z"
  }
}
```

### Type_Property_AdditionalProperties_SpreadRecordNonDiscriminatedUnion_get

- Endpoint: `get /type/property/additionalProperties/spreadRecordNonDiscriminatedUnion`

Expected response body:

```json
{
  "name": "abc",
  "prop1": { "kind": "kind0", "fooProp": "abc" },
  "prop2": {
    "kind": "kind1",
    "start": "2021-01-01T00:00:00Z",
    "end": "2021-01-02T00:00:00Z"
  }
}
```

### Type_Property_AdditionalProperties_SpreadRecordNonDiscriminatedUnion_put

- Endpoint: `put /type/property/additionalProperties/spreadRecordNonDiscriminatedUnion`

Expected input body:

```json
{
  "name": "abc",
  "prop1": { "kind": "kind0", "fooProp": "abc" },
  "prop2": {
    "kind": "kind1",
    "start": "2021-01-01T00:00:00Z",
    "end": "2021-01-02T00:00:00Z"
  }
}
```

### Type_Property_AdditionalProperties_SpreadRecordNonDiscriminatedUnion2_get

- Endpoint: `get /type/property/additionalProperties/spreadRecordNonDiscriminatedUnion2`

Expected response body:

```json
{
  "name": "abc",
  "prop1": { "kind": "kind1", "start": "2021-01-01T00:00:00Z" },
  "prop2": {
    "kind": "kind1",
    "start": "2021-01-01T00:00:00Z",
    "end": "2021-01-02T00:00:00Z"
  }
}
```

### Type_Property_AdditionalProperties_SpreadRecordNonDiscriminatedUnion2_put

- Endpoint: `put /type/property/additionalProperties/spreadRecordNonDiscriminatedUnion2`

Expected input body:

```json
{
  "name": "abc",
  "prop1": { "kind": "kind1", "start": "2021-01-01T00:00:00Z" },
  "prop2": {
    "kind": "kind1",
    "start": "2021-01-01T00:00:00Z",
    "end": "2021-01-02T00:00:00Z"
  }
}
```

### Type_Property_AdditionalProperties_SpreadRecordNonDiscriminatedUnion3_get

- Endpoint: `get /type/property/additionalProperties/spreadRecordNonDiscriminatedUnion3`

Expected response body:

```json
{'name': 'abc', 'prop1': [{'kind': 'kind1', 'start': '2021-01-01T00:00:00Z'}, {'kind': 'kind1', 'start': '2021-01-01T00:00:00Z'], 'prop2': {'kind': 'kind1', 'start': '2021-01-01T00:00:00Z', 'end': '2021-01-02T00:00:00Z'}}
```

### Type_Property_AdditionalProperties_SpreadRecordNonDiscriminatedUnion3_put

- Endpoint: `put /type/property/additionalProperties/spreadRecordNonDiscriminatedUnion3`

Expected input body:

```json
{'name': 'abc', 'prop1': [{'kind': 'kind1', 'start': '2021-01-01T00:00:00Z'}, {'kind': 'kind1', 'start': '2021-01-01T00:00:00Z'], 'prop2': {'kind': 'kind1', 'start': '2021-01-01T00:00:00Z', 'end': '2021-01-02T00:00:00Z'}}
```

### Type_Property_AdditionalProperties_SpreadRecordUnion_get

- Endpoint: `get /type/property/additionalProperties/spreadRecordUnion`

Expected response body:

```json
{ "flag": true, "prop1": "abc", "prop2": 43.125 }
```

### Type_Property_AdditionalProperties_SpreadRecordUnion_put

- Endpoint: `put /type/property/additionalProperties/spreadRecordUnion`

Expected input body:

```json
{ "flag": true, "prop1": "abc", "prop2": 43.125 }
```

### Type_Property_AdditionalProperties_SpreadString_get

- Endpoint: `get /type/property/additionalProperties/spreadRecordString`

Expected response body:

```json
{ "name": "SpreadSpringRecord", "prop": "abc" }
```

### Type_Property_AdditionalProperties_SpreadString_put

- Endpoint: `put /type/property/additionalProperties/spreadRecordString`

Expected input body:

```json
{ "name": "SpreadSpringRecord", "prop": "abc" }
```

### Type_Property_Nullable_Bytes_getNonNull

- Endpoint: `get /type/property/nullable/bytes/non-null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": aGVsbG8sIHdvcmxkIQ==}
```

### Type_Property_Nullable_Bytes_getNull

- Endpoint: `get /type/property/nullable/bytes/null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_Bytes_patchNonNull

- Endpoint: `patch /type/property/nullable/bytes/non-null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": aGVsbG8sIHdvcmxkIQ==}
```

### Type_Property_Nullable_Bytes_patchNull

- Endpoint: `patch /type/property/nullable/bytes/null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_CollectionsByte_getNonNull

- Endpoint: `get /type/property/nullable/collections/bytes/non-null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": [aGVsbG8sIHdvcmxkIQ==, aGVsbG8sIHdvcmxkIQ==]}
```

### Type_Property_Nullable_CollectionsByte_getNull

- Endpoint: `get /type/property/nullable/collections/bytes/null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_CollectionsByte_patchNonNull

- Endpoint: `patch /type/property/nullable/collections/bytes/non-null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": [aGVsbG8sIHdvcmxkIQ==, aGVsbG8sIHdvcmxkIQ==]}
```

### Type_Property_Nullable_CollectionsByte_patchNull

- Endpoint: `patch /type/property/nullable/collections/bytes/null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_CollectionsModel_getNonNull

- Endpoint: `get /type/property/nullable/collections/model/non-null`

Expected response body:

```json
{
  "requiredProperty": "foo",
  "nullableProperty": [{ "property": "hello" }, { "property": "world" }]
}
```

### Type_Property_Nullable_CollectionsModel_getNull

- Endpoint: `get /type/property/nullable/collections/model/null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_CollectionsModel_patchNonNull

- Endpoint: `patch /type/property/nullable/collections/model/non-null`

Expected request body:

```json
{
  "requiredProperty": "foo",
  "nullableProperty": [{ "property": "hello" }, { "property": "world" }]
}
```

### Type_Property_Nullable_CollectionsModel_patchNull

- Endpoint: `patch /type/property/nullable/collections/model/null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_CollectionsString_getNonNull

- Endpoint: `get /type/property/nullable/collections/string/non-null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": ["hello", "world"] }
```

### Type_Property_Nullable_CollectionsString_getNull

- Endpoint: `get /type/property/nullable/collections/string/null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_CollectionsString_patchNonNull

- Endpoint: `patch /type/property/nullable/collections/string/non-null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": ["hello", "world"] }
```

### Type_Property_Nullable_CollectionsString_patchNull

- Endpoint: `patch /type/property/nullable/collections/string/null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_Datetime_getNonNull

- Endpoint: `get /type/property/nullable/datetime/non-null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": 2022-08-26T18:38:00Z}
```

### Type_Property_Nullable_Datetime_getNull

- Endpoint: `get /type/property/nullable/datetime/null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_Datetime_patchNonNull

- Endpoint: `patch /type/property/nullable/datetime/non-null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": 2022-08-26T18:38:00Z}
```

### Type_Property_Nullable_Datetime_patchNull

- Endpoint: `patch /type/property/nullable/datetime/null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_Duration_getNonNull

- Endpoint: `get /type/property/nullable/duration/non-null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": P123DT22H14M12.011S}
```

### Type_Property_Nullable_Duration_getNull

- Endpoint: `get /type/property/nullable/duration/null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_Duration_patchNonNull

- Endpoint: `patch /type/property/nullable/duration/non-null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": P123DT22H14M12.011S}
```

### Type_Property_Nullable_Duration_patchNull

- Endpoint: `patch /type/property/nullable/duration/null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_String_getNonNull

- Endpoint: `get /type/property/nullable/string/non-null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": hello}
```

### Type_Property_Nullable_String_getNull

- Endpoint: `get /type/property/nullable/string/null`

Expected response body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Nullable_String_patchNonNull

- Endpoint: `patch /type/property/nullable/string/non-null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": hello}
```

### Type_Property_Nullable_String_patchNull

- Endpoint: `patch /type/property/nullable/string/null`

Expected request body:

```json
{ "requiredProperty": "foo", "nullableProperty": null }
```

### Type_Property_Optional_BooleanLiteral_getAll

- Endpoint: `get /type/property/optional/boolean/literal/all`

Expected response body:

```json
{ "property": true }
```

### Type_Property_Optional_BooleanLiteral_getDefault

- Endpoint: `get /type/property/optional/boolean/literal/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_BooleanLiteral_putAll

- Endpoint: `put /type/property/optional/boolean/literal/all`

Expected request body:

```json
{ "property": true }
```

### Type_Property_Optional_BooleanLiteral_putDefault

- Endpoint: `put /type/property/optional/boolean/literal/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_Bytes_getAll

- Endpoint: `get /type/property/optional/bytes/all`

Expected response body:

```json
{ "property": "aGVsbG8sIHdvcmxkIQ==" }
```

### Type_Property_Optional_Bytes_getDefault

- Endpoint: `get /type/property/optional/bytes/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_Bytes_putAll

- Endpoint: `put /type/property/optional/bytes/all`

Expected request body:

```json
{ "property": "aGVsbG8sIHdvcmxkIQ==" }
```

### Type_Property_Optional_Bytes_putDefault

- Endpoint: `put /type/property/optional/bytes/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_CollectionsByte_getAll

- Endpoint: `get /type/property/optional/collections/bytes/all`

Expected response body:

```json
{ "property": ["aGVsbG8sIHdvcmxkIQ==", "aGVsbG8sIHdvcmxkIQ=="] }
```

### Type_Property_Optional_CollectionsByte_getDefault

- Endpoint: `get /type/property/optional/collections/bytes/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_CollectionsByte_putAll

- Endpoint: `put /type/property/optional/collections/bytes/all`

Expected request body:

```json
{ "property": ["aGVsbG8sIHdvcmxkIQ==", "aGVsbG8sIHdvcmxkIQ=="] }
```

### Type_Property_Optional_CollectionsByte_putDefault

- Endpoint: `put /type/property/optional/collections/bytes/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_CollectionsModel_getAll

- Endpoint: `get /type/property/optional/collections/model/all`

Expected response body:

```json
{ "property": [{ "property": "hello" }, { "property": "world" }] }
```

### Type_Property_Optional_CollectionsModel_getDefault

- Endpoint: `get /type/property/optional/collections/model/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_CollectionsModel_putAll

- Endpoint: `put /type/property/optional/collections/model/all`

Expected request body:

```json
{ "property": [{ "property": "hello" }, { "property": "world" }] }
```

### Type_Property_Optional_CollectionsModel_putDefault

- Endpoint: `put /type/property/optional/collections/model/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_Datetime_getAll

- Endpoint: `get /type/property/optional/datetime/all`

Expected response body:

```json
{ "property": "2022-08-26T18:38:00Z" }
```

### Type_Property_Optional_Datetime_getDefault

- Endpoint: `get /type/property/optional/datetime/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_Datetime_putAll

- Endpoint: `put /type/property/optional/datetime/all`

Expected request body:

```json
{ "property": "2022-08-26T18:38:00Z" }
```

### Type_Property_Optional_Datetime_putDefault

- Endpoint: `put /type/property/optional/datetime/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_Duration_getAll

- Endpoint: `get /type/property/optional/duration/all`

Expected response body:

```json
{ "property": "P123DT22H14M12.011S" }
```

### Type_Property_Optional_Duration_getDefault

- Endpoint: `get /type/property/optional/duration/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_Duration_putAll

- Endpoint: `put /type/property/optional/duration/all`

Expected request body:

```json
{ "property": "P123DT22H14M12.011S" }
```

### Type_Property_Optional_Duration_putDefault

- Endpoint: `put /type/property/optional/duration/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_FloatLiteral_getAll

- Endpoint: `get /type/property/optional/float/literal/all`

Expected response body:

```json
{ "property": 1.25 }
```

### Type_Property_Optional_FloatLiteral_getDefault

- Endpoint: `get /type/property/optional/float/literal/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_FloatLiteral_putAll

- Endpoint: `put /type/property/optional/float/literal/all`

Expected request body:

```json
{ "property": 1.25 }
```

### Type_Property_Optional_FloatLiteral_putDefault

- Endpoint: `put /type/property/optional/float/literal/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_IntLiteral_getAll

- Endpoint: `get /type/property/optional/int/literal/all`

Expected response body:

```json
{ "property": 1 }
```

### Type_Property_Optional_IntLiteral_getDefault

- Endpoint: `get /type/property/optional/int/literal/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_IntLiteral_putAll

- Endpoint: `put /type/property/optional/int/literal/all`

Expected request body:

```json
{ "property": 1 }
```

### Type_Property_Optional_IntLiteral_putDefault

- Endpoint: `put /type/property/optional/int/literal/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_PlainDate_getAll

- Endpoint: `get /type/property/optional/plainDate/all`

Expected response body:

```json
{ "property": "2022-12-12" }
```

### Type_Property_Optional_PlainDate_getDefault

- Endpoint: `get /type/property/optional/plainDate/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_PlainDate_putAll

- Endpoint: `put /type/property/optional/plainDate/all`

Expected request body:

```json
{ "property": "2022-12-12" }
```

### Type_Property_Optional_PlainDate_putDefault

- Endpoint: `put /type/property/optional/plainDate/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_PlainTime_getAll

- Endpoint: `get /type/property/optional/plainTime/all`

Expected response body:

```json
{ "property": "13:06:12" }
```

### Type_Property_Optional_PlainTime_getDefault

- Endpoint: `get /type/property/optional/plainTime/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_PlainTime_putAll

- Endpoint: `put /type/property/optional/plainTime/all`

Expected request body:

```json
{ "property": "13:06:12" }
```

### Type_Property_Optional_PlainTime_putDefault

- Endpoint: `put /type/property/optional/plainTime/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_RequiredAndOptional_getAll

- Endpoint: `get /type/property/optional/requiredAndOptional/all`

Expected response body:

```json
{ "optionalProperty": "hello", "requiredProperty": 42 }
```

### Type_Property_Optional_RequiredAndOptional_getRequiredOnly

- Endpoint: `get /type/property/optional/requiredAndOptional/requiredOnly`

Expected response body:

```json
{ "requiredProperty": 42 }
```

### Type_Property_Optional_RequiredAndOptional_putAll

- Endpoint: `put /type/property/optional/requiredAndOptional/all`

Expected request body:

```json
{ "optionalProperty": "hello", "requiredProperty": 42 }
```

### Type_Property_Optional_RequiredAndOptional_putRequiredOnly

- Endpoint: `put /type/property/optional/requiredAndOptional/requiredOnly`

Expected request body:

```json
{ "requiredProperty": 42 }
```

### Type_Property_Optional_String_getAll

- Endpoint: `get /type/property/optional/string/all`

Expected response body:

```json
{ "property": "hello" }
```

### Type_Property_Optional_String_getDefault

- Endpoint: `get /type/property/optional/string/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_String_putAll

- Endpoint: `put /type/property/optional/string/all`

Expected request body:

```json
{ "property": "hello" }
```

### Type_Property_Optional_String_putDefault

- Endpoint: `put /type/property/optional/string/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_StringLiteral_getAll

- Endpoint: `get /type/property/optional/string/literal/all`

Expected response body:

```json
{ "property": "hello" }
```

### Type_Property_Optional_StringLiteral_getDefault

- Endpoint: `get /type/property/optional/string/literal/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_StringLiteral_putAll

- Endpoint: `put /type/property/optional/string/literal/all`

Expected request body:

```json
{ "property": "hello" }
```

### Type_Property_Optional_StringLiteral_putDefault

- Endpoint: `put /type/property/optional/string/literal/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_UnionFloatLiteral_getAll

- Endpoint: `get /type/property/optional/union/float/literal/all`

Expected response body:

```json
{ "property": 2.375 }
```

### Type_Property_Optional_UnionFloatLiteral_getDefault

- Endpoint: `get /type/property/optional/union/float/literal/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_UnionFloatLiteral_putAll

- Endpoint: `put /type/property/optional/union/float/literal/all`

Expected request body:

```json
{ "property": 2.375 }
```

### Type_Property_Optional_UnionFloatLiteral_putDefault

- Endpoint: `put /type/property/optional/union/float/literal/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_UnionIntLiteral_getAll

- Endpoint: `get /type/property/optional/union/int/literal/all`

Expected response body:

```json
{ "property": 2 }
```

### Type_Property_Optional_UnionIntLiteral_getDefault

- Endpoint: `get /type/property/optional/union/int/literal/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_UnionIntLiteral_putAll

- Endpoint: `put /type/property/optional/union/int/literal/all`

Expected request body:

```json
{ "property": 2 }
```

### Type_Property_Optional_UnionIntLiteral_putDefault

- Endpoint: `put /type/property/optional/union/int/literal/default`

Expected request body:

```json
{}
```

### Type_Property_Optional_UnionStringLiteral_getAll

- Endpoint: `get /type/property/optional/union/string/literal/all`

Expected response body:

```json
{ "property": "world" }
```

### Type_Property_Optional_UnionStringLiteral_getDefault

- Endpoint: `get /type/property/optional/union/string/literal/default`

Expected response body:

```json
{}
```

### Type_Property_Optional_UnionStringLiteral_putAll

- Endpoint: `put /type/property/optional/union/string/literal/all`

Expected request body:

```json
{ "property": "world" }
```

### Type_Property_Optional_UnionStringLiteral_putDefault

- Endpoint: `put /type/property/optional/union/string/literal/default`

Expected request body:

```json
{}
```

### Type_Property_ValueTypes_Boolean_get

- Endpoint: `get /type/property/value-types/boolean`

Expected response body:

```json
{ "property": true }
```

### Type_Property_ValueTypes_Boolean_put

- Endpoint: `put /type/property/value-types/boolean`

Expected input body:

```json
{ "property": true }
```

### Type_Property_ValueTypes_BooleanLiteral_get

- Endpoint: `get /type/property/value-types/boolean/literal`

Expected response body:

```json
{ "property": true }
```

### Type_Property_ValueTypes_BooleanLiteral_put

- Endpoint: `put /type/property/value-types/boolean/literal`

Expected input body:

```json
{ "property": true }
```

### Type_Property_ValueTypes_Bytes_get

- Endpoint: `get /type/property/value-types/bytes`

Expected response body:

```json
{"property": aGVsbG8sIHdvcmxkIQ==}
```

### Type_Property_ValueTypes_Bytes_put

- Endpoint: `put /type/property/value-types/bytes`

Expected input body:

```json
{"property": aGVsbG8sIHdvcmxkIQ==}
```

### Type_Property_ValueTypes_CollectionsInt_get

- Endpoint: `get /type/property/value-types/collections/int`

Expected response body:

```json
{ "property": [1, 2] }
```

### Type_Property_ValueTypes_CollectionsInt_put

- Endpoint: `put /type/property/value-types/collections/int`

Expected input body:

```json
{ "property": [1, 2] }
```

### Type_Property_ValueTypes_CollectionsModel_get

- Endpoint: `get /type/property/value-types/collections/model`

Expected response body:

```json
{ "property": [{ "property": "hello" }, { "property": "world" }] }
```

### Type_Property_ValueTypes_CollectionsModel_put

- Endpoint: `put /type/property/value-types/collections/model`

Expected input body:

```json
{ "property": [{ "property": "hello" }, { "property": "world" }] }
```

### Type_Property_ValueTypes_CollectionsString_get

- Endpoint: `get /type/property/value-types/collections/string`

Expected response body:

```json
{ "property": ["hello", "world"] }
```

### Type_Property_ValueTypes_CollectionsString_put

- Endpoint: `put /type/property/value-types/collections/string`

Expected input body:

```json
{ "property": ["hello", "world"] }
```

### Type_Property_ValueTypes_Datetime_get

- Endpoint: `get /type/property/value-types/datetime`

Expected response body:

```json
{"property": 2022-08-26T18:38:00Z}
```

### Type_Property_ValueTypes_Datetime_put

- Endpoint: `put /type/property/value-types/datetime`

Expected input body:

```json
{"property": 2022-08-26T18:38:00Z}
```

### Type_Property_ValueTypes_Decimal_get

- Endpoint: `get /type/property/value-types/decimal`

Expected response body:

```json
{ "property": 0.33333 }
```

### Type_Property_ValueTypes_Decimal_put

- Endpoint: `put /type/property/value-types/decimal`

Expected input body:

```json
{ "property": 0.33333 }
```

### Type_Property_ValueTypes_Decimal128_get

- Endpoint: `get /type/property/value-types/decimal128`

Expected response body:

```json
{ "property": 0.33333 }
```

### Type_Property_ValueTypes_Decimal128_put

- Endpoint: `put /type/property/value-types/decimal128`

Expected input body:

```json
{ "property": 0.33333 }
```

### Type_Property_ValueTypes_DictionaryString_get

- Endpoint: `get /type/property/value-types/dictionary/string`

Expected response body:

```json
{ "property": { "k1": "hello", "k2": "world" } }
```

### Type_Property_ValueTypes_DictionaryString_put

- Endpoint: `put /type/property/value-types/dictionary/string`

Expected input body:

```json
{ "property": { "k1": "hello", "k2": "world" } }
```

### Type_Property_ValueTypes_Duration_get

- Endpoint: `get /type/property/value-types/duration`

Expected response body:

```json
{"property": P123DT22H14M12.011S}
```

### Type_Property_ValueTypes_Duration_put

- Endpoint: `put /type/property/value-types/duration`

Expected input body:

```json
{"property": P123DT22H14M12.011S}
```

### Type_Property_ValueTypes_Enum_get

- Endpoint: `get /type/property/value-types/enum`

Expected response body:

```json
{ "property": "ValueOne" }
```

### Type_Property_ValueTypes_Enum_put

- Endpoint: `put /type/property/value-types/enum`

Expected input body:

```json
{ "property": "ValueOne" }
```

### Type_Property_ValueTypes_ExtensibleEnum_get

- Endpoint: `get /type/property/value-types/extensible-enum`

Expected response body:

```json
{ "property": "UnknownValue" }
```

### Type_Property_ValueTypes_ExtensibleEnum_put

- Endpoint: `put /type/property/value-types/extensible-enum`

Expected input body:

```json
{ "property": "UnknownValue" }
```

### Type_Property_ValueTypes_Float_get

- Endpoint: `get /type/property/value-types/float`

Expected response body:

```json
{ "property": 43.125 }
```

### Type_Property_ValueTypes_Float_put

- Endpoint: `put /type/property/value-types/float`

Expected input body:

```json
{ "property": 43.125 }
```

### Type_Property_ValueTypes_FloatLiteral_get

- Endpoint: `get /type/property/value-types/float/literal`

Expected response body:

```json
{ "property": 43.125 }
```

### Type_Property_ValueTypes_FloatLiteral_put

- Endpoint: `put /type/property/value-types/float/literal`

Expected input body:

```json
{ "property": 43.125 }
```

### Type_Property_ValueTypes_Int_get

- Endpoint: `get /type/property/value-types/int`

Expected response body:

```json
{ "property": 42 }
```

### Type_Property_ValueTypes_Int_put

- Endpoint: `put /type/property/value-types/int`

Expected input body:

```json
{ "property": 42 }
```

### Type_Property_ValueTypes_IntLiteral_get

- Endpoint: `get /type/property/value-types/int/literal`

Expected response body:

```json
{ "property": 42 }
```

### Type_Property_ValueTypes_IntLiteral_put

- Endpoint: `put /type/property/value-types/int/literal`

Expected input body:

```json
{ "property": 42 }
```

### Type_Property_ValueTypes_Model_get

- Endpoint: `get /type/property/value-types/model`

Expected response body:

```json
{ "property": { "property": "hello" } }
```

### Type_Property_ValueTypes_Model_put

- Endpoint: `put /type/property/value-types/model`

Expected input body:

```json
{ "property": { "property": "hello" } }
```

### Type_Property_ValueTypes_Never_get

- Endpoint: `get /type/property/value-types/never`

Expected response body:

```json
{"property": <don't include this property>}
```

### Type_Property_ValueTypes_Never_put

- Endpoint: `put /type/property/value-types/never`

Expected input body:

```json
{"property": <don't include this property>}
```

### Type_Property_ValueTypes_String_get

- Endpoint: `get /type/property/value-types/string`

Expected response body:

```json
{ "property": "hello" }
```

### Type_Property_ValueTypes_String_put

- Endpoint: `put /type/property/value-types/string`

Expected input body:

```json
{ "property": "hello" }
```

### Type_Property_ValueTypes_StringLiteral_get

- Endpoint: `get /type/property/value-types/string/literal`

Expected response body:

```json
{ "property": "hello" }
```

### Type_Property_ValueTypes_StringLiteral_put

- Endpoint: `put /type/property/value-types/string/literal`

Expected input body:

```json
{ "property": "hello" }
```

### Type_Property_ValueTypes_UnionEnumValue_get

- Endpoint: `get /type/property/value-types/union-enum-value`

Expected response body:

```json
{ "property": "value2" }
```

### Type_Property_ValueTypes_UnionEnumValue_put

- Endpoint: `put /type/property/value-types/union-enum-value`

Expected input body:

```json
{ "property": "value2" }
```

### Type_Property_ValueTypes_UnionFloatLiteral_get

- Endpoint: `get /type/property/value-types/union/float/literal`

Expected response body:

```json
{ "property": 46.875 }
```

### Type_Property_ValueTypes_UnionFloatLiteral_put

- Endpoint: `put /type/property/value-types/union/float/literal`

Expected input body:

```json
{ "property": 46.875 }
```

### Type_Property_ValueTypes_UnionIntLiteral_get

- Endpoint: `get /type/property/value-types/union/int/literal`

Expected response body:

```json
{ "property": 42 }
```

### Type_Property_ValueTypes_UnionIntLiteral_put

- Endpoint: `put /type/property/value-types/union/int/literal`

Expected input body:

```json
{ "property": 42 }
```

### Type_Property_ValueTypes_UnionStringLiteral_get

- Endpoint: `get /type/property/value-types/union/string/literal`

Expected response body:

```json
{ "property": "world" }
```

### Type_Property_ValueTypes_UnionStringLiteral_put

- Endpoint: `put /type/property/value-types/union/string/literal`

Expected input body:

```json
{ "property": "world" }
```

### Type_Property_ValueTypes_UnknownArray_get

- Endpoint: `get /type/property/value-types/unknown/array`

Expected response body:

```json
{ "property": ["hello", "world"] }
```

### Type_Property_ValueTypes_UnknownArray_put

- Endpoint: `put /type/property/value-types/unknown/array`

Expected input body:

```json
{ "property": ["hello", "world"] }
```

### Type_Property_ValueTypes_UnknownDict_get

- Endpoint: `get /type/property/value-types/unknown/dict`

Expected response body:

```json
{ "property": { "k1": "hello", "k2": 42 } }
```

### Type_Property_ValueTypes_UnknownDict_put

- Endpoint: `put /type/property/value-types/unknown/dict`

Expected input body:

```json
{ "property": { "k1": "hello", "k2": 42 } }
```

### Type_Property_ValueTypes_UnknownInt_get

- Endpoint: `get /type/property/value-types/unknown/int`

Expected response body:

```json
{ "property": 42 }
```

### Type_Property_ValueTypes_UnknownInt_put

- Endpoint: `put /type/property/value-types/unknown/int`

Expected input body:

```json
{ "property": 42 }
```

### Type_Property_ValueTypes_UnknownString_get

- Endpoint: `get /type/property/value-types/unknown/string`

Expected response body:

```json
{ "property": "hello" }
```

### Type_Property_ValueTypes_UnknownString_put

- Endpoint: `put /type/property/value-types/unknown/string`

Expected input body:

```json
{ "property": "hello" }
```

### Type_Scalar_Boolean_get

- Endpoint: `get /type/scalar/boolean`

Expect to handle a boolean value. Mock api will return true

### Type_Scalar_Boolean_put

- Endpoint: `put /type/scalar/boolean`

Expect to send a boolean value. Mock api expect to receive 'true'

### Type_Scalar_Decimal128Type_requestBody

- Endpoint: `put /type/scalar/decimal128/resquest_body`

Expected input body:

```json
0.33333
```

### Type_Scalar_Decimal128Type_requestParameter

- Endpoint: `get /type/scalar/decimal128/request_parameter`

Expected request parameter:
value=0.33333

### Type_Scalar_Decimal128Type_responseBody

- Endpoint: `get /type/scalar/decimal128/response_body`

Expected response body:

```json
0.33333
```

### Type_Scalar_Decimal128Verify_prepareVerify

- Endpoint: `get /type/scalar/decimal128/prepare_verify`

Get verify values:
[0.1, 0.1, 0.1]

### Type_Scalar_Decimal128Verify_verify

- Endpoint: `post /type/scalar/decimal128/verify`

Expected input body:

```json
0.3
```

### Type_Scalar_DecimalType_requestBody

- Endpoint: `put /type/scalar/decimal/resquest_body`

Expected input body:

```json
0.33333
```

### Type_Scalar_DecimalType_requestParameter

- Endpoint: `get /type/scalar/decimal/request_parameter`

Expected request parameter:
value=0.33333

### Type_Scalar_DecimalType_responseBody

- Endpoint: `get /type/scalar/decimal/response_body`

Expected response body:

```json
0.33333
```

### Type_Scalar_DecimalVerify_prepareVerify

- Endpoint: `get /type/scalar/decimal/prepare_verify`

Get verify values:
[0.1, 0.1, 0.1]

### Type_Scalar_DecimalVerify_verify

- Endpoint: `post /type/scalar/decimal/verify`

Expected input body:

```json
0.3
```

### Type_Scalar_String_get

- Endpoint: `get /type/scalar/string`

Expect to handle a string value. Mock api will return 'test'

### Type_Scalar_String_put

- Endpoint: `put /type/scalar/string`

Expect to send a string value. Mock api expect to receive 'test'

### Type_Scalar_Unknown_get

- Endpoint: `get /type/scalar/unknown`

Expect to handle a unknown type value. Mock api will return 'test'

### Type_Scalar_Unknown_put

- Endpoint: `put /type/scalar/unknown`

Expect to send a string value. Mock api expect to receive 'test'

### Type_Union_EnumsOnly_get

- Endpoint: `get /type/union/enums-only`

Verify a union can be processed in a response:

```tsp
Type.Union.LR | Type.Union.UD
```

Expected response body:

```json
{
  "prop": {
    "lr": "right",
    "ud": "up"
  }
}
```

### Type_Union_EnumsOnly_send

- Endpoint: `get /type/union/enums-only`

Verify a union can be processed in a response:

```tsp
Type.Union.LR | Type.Union.UD
```

Expected request to send body:

```json
{
  "prop": {
    "lr": "right",
    "ud": "up"
  }
}
```

### Type_Union_FloatsOnly_get

- Endpoint: `get /type/union/floats-only`

Verify a union can be processed in a response:

```tsp
1.1 | 2.2 | 3.3
```

Expected response body:

```json
{ "prop": 2.2 }
```

### Type_Union_FloatsOnly_send

- Endpoint: `get /type/union/floats-only`

Verify a union can be processed in a response:

```tsp
1.1 | 2.2 | 3.3
```

Expected request to send body:

```json
{ "prop": 2.2 }
```

### Type_Union_IntsOnly_get

- Endpoint: `get /type/union/ints-only`

Verify a union can be processed in a response:

```tsp
1 | 2 | 3
```

Expected response body:

```json
{ "prop": 2 }
```

### Type_Union_IntsOnly_send

- Endpoint: `get /type/union/ints-only`

Verify a union can be processed in a response:

```tsp
1 | 2 | 3
```

Expected request to send body:

```json
{ "prop": 2 }
```

### Type_Union_MixedLiterals_get

- Endpoint: `get /type/union/mixed-literals`

Verify a union can be processed in a response:

```tsp
"a" | 2 | 3.3 | true
```

Expected response body:

```json
{
  "prop": {
    "stringLiteral": "a",
    "intLiteral": 2,
    "floatLiteral": 3.3,
    "booleanLiteral": true
  }
}
```

### Type_Union_MixedLiterals_send

- Endpoint: `get /type/union/mixed-literals`

Verify a union can be processed in a response:

```tsp
"a" | 2 | 3.3 | true
```

Expected request to send body:

```json
{
  "prop": {
    "stringLiteral": "a",
    "intLiteral": 2,
    "floatLiteral": 3.3,
    "booleanLiteral": true
  }
}
```

### Type_Union_MixedTypes_get

- Endpoint: `get /type/union/mixed-types`

Verify a union can be processed in a response:

```tsp
Type.Union.Cat | "a" | int32 | boolean
```

Expected response body:

```json
{
  "prop": {
    "model": {
      "name": "test"
    },
    "literal": "a",
    "int": 2,
    "boolean": true,
    "array": [
      {
        "name": "test"
      },
      "a",
      2,
      true
    ]
  }
}
```

### Type_Union_MixedTypes_send

- Endpoint: `get /type/union/mixed-types`

Verify a union can be processed in a response:

```tsp
Type.Union.Cat | "a" | int32 | boolean
```

Expected request to send body:

```json
{
  "prop": {
    "model": {
      "name": "test"
    },
    "literal": "a",
    "int": 2,
    "boolean": true,
    "array": [
      {
        "name": "test"
      },
      "a",
      2,
      true
    ]
  }
}
```

### Type_Union_ModelsOnly_get

- Endpoint: `get /type/union/models-only`

Verify a union can be processed in a response:

```tsp
Type.Union.Cat | Type.Union.Dog
```

Expected response body:

```json
{
  "prop": {
    "name": "test"
  }
}
```

### Type_Union_ModelsOnly_send

- Endpoint: `get /type/union/models-only`

Verify a union can be processed in a response:

```tsp
Type.Union.Cat | Type.Union.Dog
```

Expected request to send body:

```json
{
  "prop": {
    "name": "test"
  }
}
```

### Type_Union_StringAndArray_get

- Endpoint: `get /type/union/string-and-array`

Verify a union can be processed in a response:

```tsp
string | string[]
```

Expected response body:

```json
{
  "prop": {
    "string": "test",
    "array": ["test1", "test2"]
  }
}
```

### Type_Union_StringAndArray_send

- Endpoint: `get /type/union/string-and-array`

Verify a union can be processed in a response:

```tsp
string | string[]
```

Expected request to send body:

```json
{
  "prop": {
    "string": "test",
    "array": ["test1", "test2"]
  }
}
```

### Type_Union_StringExtensible_get

- Endpoint: `get /type/union/string-extensible`

Verify a union can be processed in a response:

```tsp
string | "b" | "c"
```

Expected response body:

```json
{ "prop": "custom" }
```

### Type_Union_StringExtensible_send

- Endpoint: `get /type/union/string-extensible`

Verify a union can be processed in a response:

```tsp
string | "b" | "c"
```

Expected request to send body:

```json
{ "prop": "custom" }
```

### Type_Union_StringExtensibleNamed_get

- Endpoint: `get /type/union/string-extensible-named`

Verify a union can be processed in a response:

```tsp
Type.Union.StringExtensibleNamedUnion
```

Expected response body:

```json
{ "prop": "custom" }
```

### Type_Union_StringExtensibleNamed_send

- Endpoint: `get /type/union/string-extensible-named`

Verify a union can be processed in a response:

```tsp
Type.Union.StringExtensibleNamedUnion
```

Expected request to send body:

```json
{ "prop": "custom" }
```

### Type_Union_StringsOnly_get

- Endpoint: `get /type/union/strings-only`

Verify a union can be processed in a response:

```tsp
"a" | "b" | "c"
```

Expected response body:

```json
{ "prop": "b" }
```

### Type_Union_StringsOnly_send

- Endpoint: `get /type/union/strings-only`

Verify a union can be processed in a response:

```tsp
"a" | "b" | "c"
```

Expected request to send body:

```json
{ "prop": "b" }
```

### Versioning_Added_InterfaceV2

- Endpoint: `post /versioning/added/api-version:{version}/interface-v2/v2`

This operation group should only be generated with latest version.

Expected request body for v2InInterface:

```json
{ "prop": "foo", "enumProp": "enumMember", "unionProp": "bar" }
```

### Versioning_Added_v1

- Endpoint: `post /versioning/added/api-version:{version}/v1`

This operation should be generated with latest version's signature.

Expected request body:

```json
{ "prop": "foo", "enumProp": "enumMemberV2", "unionProp": 10 }
```

Expected header:
header-v2=bar

### Versioning_Added_v2

- Endpoint: `post /versioning/added/api-version:{version}/v2`

This operation should only be generated with latest version.

Expected request body:

```json
{ "prop": "foo", "enumProp": "enumMember", "unionProp": "bar" }
```

### Versioning_MadeOptional_test

- Endpoint: `post /versioning/made-optional/api-version:{version}/test`

This operation should be generated with latest version's signature.

Expected request body:

```json
{ "prop": "foo" }
```

### Versioning_Removed_v2

- Endpoint: `post /versioning/removed/api-version:{version}/v2`

This operation should be generated with latest version's signature.

Expected request body:

```json
{ "prop": "foo", "enumProp": "enumMemberV2", "unionProp": "bar" }
```

### Versioning_RenamedFrom_NewInterface

- Endpoint: `post /versioning/renamed-from/api-version:{version}/interface/test`

This operation group should only be generated with latest version's signature.

Expected request body for test:

```json
{ "prop": "foo", "enumProp": "newEnumMember", "unionProp": 10 }
```

### Versioning_RenamedFrom_newOp

- Endpoint: `post /versioning/renamed-from/api-version:{version}/test`

This operation should be generated with latest version's signature.

Expected request body:

```json
{ "newProp": "foo", "enumProp": "newEnumMember", "unionProp": 10 }
```

Expected query:
newQuery=bar

### Versioning_ReturnTypeChangedFrom_test

- Endpoint: `post /versioning/return-type-changed-from/api-version:{version}/test`

This operation should be generated with latest version's signature.

Expected request body: "test"
Expected response body: "test"

### Versioning_TypeChangedFrom_test

- Endpoint: `post /versioning/type-changed-from/api-version:{version}/test`

This operation should be generated with latest version's signature.

Expected request body:

```json
{ "prop": "foo", "changedProp": "bar" }
```

Expected query param:
param="baz"
