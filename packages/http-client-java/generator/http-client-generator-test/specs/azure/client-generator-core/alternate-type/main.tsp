import "@typespec/http";
import "@typespec/spector";
import "@azure-tools/typespec-client-generator-core";

using Http;
using Azure.ClientGenerator.Core;
using Spector;

@doc("Test for alternate type decorator")
@scenarioService("/azure/client-generator-core/alternate-type")
@service
namespace _Specs_.Azure.ClientGenerator.Core.AlternateType;

@global.Azure.ClientGenerator.Core.operationGroup
@route("/external")
@doc("Test using language-idiomatic external types for defined TypeSpec types")
namespace ExternalType {
  model Geometry {
    type: string;
    coordinates: numeric[];
  }

  model Feature {
    type: "Feature";
    geometry: Geometry | null;
    properties: Record<unknown>;
    id?: string | numeric;
  }

  model ModelWithFeatureProperty {
    feature: Feature;
    additionalProperty: string;
  }
  @scenario
  @scenarioDoc("""
    Input: None
    Output: Feature object with geometry, properties, and optional id fields.
    Example response:
    ```json
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-122.25, 37.87]
      },
      "properties": {
        "name": "A single point of interest",
        "category": "landmark",
        "elevation": 100
      },
      "id": "feature-1"
    }
    ```
    """)
  @route("/model")
  @get
  op getModel(): Feature;

  @scenario
  @scenarioDoc("""
    Input: Feature object in request body.
    Example input:
    ```json
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-122.25, 37.87]
      },
      "properties": {
        "name": "A single point of interest",
        "category": "landmark",
        "elevation": 100
      },
      "id": "feature-1"
    }
    ```
    Output: None (204/empty response)
    """)
  @route("/model")
  @put
  op putModel(@body body: Feature): void;

  @scenario
  @scenarioDoc("""
    Input: None
    Output: ModelWithFeatureProperty object with feature and additionalProperty fields.
    Example response:
    ```json
    {
      "feature": {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [-122.25, 37.87]
        },
        "properties": {
          "name": "A single point of interest",
          "category": "landmark",
          "elevation": 100
        },
        "id": "feature-1"
      },
      "additionalProperty": "extra"
    }
    ```
    """)
  @route("/property")
  @get
  op getProperty(): ModelWithFeatureProperty;

  @scenario
  @scenarioDoc("""
    Input: ModelWithFeatureProperty object in request body.
    Example input:
    ```json
    {
      "feature": {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [-122.25, 37.87]
        },
        "properties": {
          "name": "A single point of interest",
          "category": "landmark",
          "elevation": 100
        },
        "id": "feature-1"
      },
      "additionalProperty": "extra"
    }
    ```
    Output: None (204/empty response)
    """)
  @route("/property")
  @put
  op putProperty(@body body: ModelWithFeatureProperty): void;
}
