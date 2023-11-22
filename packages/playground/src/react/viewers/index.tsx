import "swagger-ui-react/swagger-ui.css";
import { FileOutputViewer, ViewerProps } from "../types.js";
import { SwaggerUI } from "./swagger-ui.js";

export const SwaggerUIViewer: FileOutputViewer = {
  key: "swaggerUI",
  label: "Swagger UI",
  render: ({ content }: ViewerProps) => <SwaggerUI spec={content} />,
};
