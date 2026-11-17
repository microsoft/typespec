import type { FileOutputViewer } from "../types.js";
import { SwaggerUI } from "./swagger-ui.js";

/**
 * File-output viewer that renders emitted OpenAPI text with lazily loaded Swagger UI.
 * Add it to `PlaygroundProps.emitterViewers` for emitters whose output is an OpenAPI document.
 */
export const SwaggerUIViewer: FileOutputViewer = {
  key: "swaggerUI",
  label: "Swagger UI",
  render: ({ content }) => <SwaggerUI spec={content} />,
};
