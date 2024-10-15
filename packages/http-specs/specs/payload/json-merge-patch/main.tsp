import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test for merge-patch+json content-type")
@scenarioService("/json-merge-patch")
namespace Payload.JsonMergePatch;

@doc("Details about a resource.")
model Resource {
  name: string;
  description?: string;
  map?: Record<InnerModel>;
  array?: InnerModel[];
  intValue?: int32;
  floatValue?: float32;
  innerModel?: InnerModel;
  intArray?: int32[];
}

@doc("Details about a resource for patch operation.")
model ResourcePatch {
  description?: string;
  map?: Record<InnerModel>;
  array?: InnerModel[];
  intValue?: int32;
  floatValue?: float32;
  innerModel?: InnerModel;
  intArray?: int32[];
}

@doc("It is the model used by Resource model")
model InnerModel {
  name?: string;
  description?: string;
}

@scenario
@scenarioDoc("""
  
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
  """)
@doc("Test content-type: application/merge-patch+json with required body")
@route("/create/resource")
@put
op createResource(@body body: Resource): Resource;

@scenario
@scenarioDoc("""
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
    name: "Madge",
    map: {
      key: {
        name: "InnerMadge"
      }
    }
  }
  ```
  """)
@doc("Test content-type: application/merge-patch+json with required body")
@route("/update/resource")
@patch
op updateResource(
  @header("content-type") contentType: "application/merge-patch+json",
  @body body: ResourcePatch,
): Resource;

@scenario
@scenarioDoc("""
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
    name: "Madge",
    map: {
      key: {
        name: "InnerMadge"
      }
    }
  }
  ```
  """)
@doc("Test content-type: application/merge-patch+json with optional body")
@route("/update/resource/optional")
@patch
op updateOptionalResource(
  @header("content-type") contentType: "application/merge-patch+json",
  @body body?: ResourcePatch,
): Resource;
