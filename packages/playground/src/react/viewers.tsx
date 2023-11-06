import "swagger-ui-react/swagger-ui.css";
import { SwaggerUI } from "./swagger-ui.js";
import { FileOutputViewer, ViewerProps } from "./types.js";

export const SwaggerUIViewer: FileOutputViewer = {
  key: "swaggerUI",
  label: "Swagger UI",
  render: ({ content }: ViewerProps) => <SwaggerUI spec={content} />,
};
