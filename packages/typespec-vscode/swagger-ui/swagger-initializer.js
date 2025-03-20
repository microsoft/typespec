/**
 * Customized initialization script for Swagger UI.
 */
window.onload = function () {
  window.addEventListener("message", (event) => {
    const message = event.data; // The JSON data our extension sent

    switch (message.command) {
      case "load":
        window.ui = SwaggerUIBundle({
          url: message.param,
          deepLinking: true, // keep expanded tag or operation after reloading
          dom_id: "#swagger-ui",
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          plugins: [],
          layout: "BaseLayout",
        });
        break;
      default:
        break;
    }
  });
  const vscode = acquireVsCodeApi();
  vscode.postMessage({ event: "initialized" });
};
