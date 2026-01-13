import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

// Test @previewVersion with stable operations - should work across all versions
// Color is expected in the response because we are passing api-version "2024-12-01-preview"
Scenarios.Azure_Versioning_PreviewVersion_getWidget = passOnSuccess({
  uri: "/azure/versioning/previewVersion/widgets/:id",
  method: "get",
  request: {
    pathParams: {
      id: "widget-123",
    },
    query: {
      "api-version": "2024-12-01-preview",
    },
  },
  response: {
    status: 200,
    body: json({
      id: "widget-123",
      name: "Sample Widget",
      color: "blue",
    }),
  },
  kind: "MockApiDefinition",
});

// Test @previewVersion with preview-only operations - only available in preview version
// This operation can be called because the request uses api-version "2024-12-01-preview"
Scenarios.Azure_Versioning_PreviewVersion_updateWidgetColor = passOnSuccess({
  uri: "/azure/versioning/previewVersion/widgets/:id/color",
  method: "patch",
  request: {
    pathParams: {
      id: "widget-123",
    },
    query: {
      "api-version": "2024-12-01-preview",
    },
    headers: {
      "Content-Type": "application/merge-patch+json",
    },
    body: json({
      color: "red",
    }),
  },
  response: {
    status: 200,
    body: json({
      id: "widget-123",
      name: "Sample Widget",
      color: "red",
    }),
  },
  kind: "MockApiDefinition",
});

// Test @previewVersion with version-specific query parameters
// api-version "2024-06-01" is stable, so color is not expected in the response
Scenarios.Azure_Versioning_PreviewVersion_listWidgets = passOnSuccess({
  uri: "/azure/versioning/previewVersion/widgets",
  method: "get",
  request: {
    query: {
      "api-version": "2024-06-01",
      name: "test",
    },
  },
  response: {
    status: 200,
    body: json({
      widgets: [
        {
          id: "widget-1",
          name: "test",
        },
      ],
    }),
  },
  kind: "MockApiDefinition",
});
