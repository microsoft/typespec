/**
 * Test for @previewVersion decorator functionality
 * This verifies that emitters correctly handle preview versions
 */
import "@typespec/http";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@typespec/spector";
import "@azure-tools/typespec-client-generator-core";

using Http;
using TypeSpec.Versioning;
using Spector;
using global.Azure.Core;

@scenarioService(
  "/azure/versioning/previewVersion",
  {
    versioned: ApiVersions,
  }
)
@global.Azure.ClientGenerator.Core.clientNamespace("azure.versioning.previewversion", "java")
namespace _Specs_.Azure.Versioning.PreviewVersion;

@doc("Supported api versions including preview.")
enum ApiVersions {
  @doc("Api version 2024-01-01.")
  v2024_01_01: "2024-01-01",

  @doc("Api version 2024-06-01.")
  v2024_06_01: "2024-06-01",

  @doc("Preview api version 2024-12-01-preview.")
  @previewVersion
  v2024_12_01_preview: "2024-12-01-preview",
}

@doc("A simple model for testing.")
model Widget {
  @doc("Widget identifier.")
  id: string;

  @doc("Widget name.")
  name: string;

  @doc("Widget color, only available in preview version.")
  @added(ApiVersions.v2024_12_01_preview)
  color?: string;
}

@scenario
@scenarioDoc("""
  Test @previewVersion decorator with stable operations.
  Should send a preview api-version and response should contain color field.
  
  Expected path parameter: id=widget-123
  Expected query parameter: api-version=2024-12-01-preview
  
  Expected response body:
  ```json
  {
    "id": "widget-123",
    "name": "Sample Widget",
    "color": "blue"
  }
  ```
  """)
@doc("Get widget by id (available in all versions)")
@get
@route("/widgets/{id}")
op getWidget(
  @path id: string,
  ...global.Azure.Core.Foundations.ApiVersionParameter,
): Widget | NotFoundResponse;

@doc("Update widget color request.")
model UpdateWidgetColorRequest {
  @doc("New color for the widget.")
  color: string;
}

@scenario
@scenarioDoc("""
  Test @previewVersion decorator with preview-only operations.
  Only available in preview API versions.
  
  Expected path parameter: id=widget-123
  Expected query parameter: api-version=2024-12-01-preview
  
  Expected input body:
  ```json
  {
    "color": "red"
  }
  ```
  
  Expected response body:
  ```json
  {
    "id": "widget-123",
    "name": "Sample Widget", 
    "color": "red"
  }
  ```
  """)
@doc("Update widget color (preview only)")
@patch(#{ implicitOptionality: true })
@route("/widgets/{id}/color")
@added(ApiVersions.v2024_12_01_preview)
op updateWidgetColor(
  @path id: string,
  @header("Content-Type") contentType: "application/merge-patch+json",
  @body colorUpdate: UpdateWidgetColorRequest,
  ...global.Azure.Core.Foundations.ApiVersionParameter,
): Widget | NotFoundResponse;

@scenario
@scenarioDoc("""
  Test @previewVersion decorator with version-specific query parameters.
  Request should send stable api-version and response should not contain color field.
  
  Expected query parameter: api-version=2024-06-01
  Expected query parameter: name=test (color not available in stable version)
  
  Expected response body:
  ```json
  {
    "widgets": [
      {
        "id": "widget-1",
        "name": "test"
      }
    ]
  }
  ```
  """)
@doc("List widgets with optional color filtering")
@get
@route("/widgets")
op listWidgets(
  @query name?: string,
  @query @added(ApiVersions.v2024_12_01_preview) color?: string,
  ...global.Azure.Core.Foundations.ApiVersionParameter,
): {
  widgets: Widget[];
};
