import type { FileOutputViewer } from "../types.js";
import { SwaggerUI } from "./swagger-ui.js";

export const SwaggerUIViewer: FileOutputViewer = {
  key: "swaggerUI",
  label: "Swagger UI",
  render: ({ content }) => <SwaggerUI spec={content} />,
};
