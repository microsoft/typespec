import { type Operation, createRule, fileRef } from "@typespec/compiler";
import { resolvePayloadProperties } from "../http-property.js";
import { Visibility } from "../metadata.js";
import { HttpPayloadDisposition } from "../payload.js";

export const noContentTypeOptionalityMismatchRule = createRule({
  name: "no-content-type-optionality-mismatch",
  severity: "warning",
  description:
    "The optionality of the Content-Type header must match the optionality of the associated request body.",
  url: "https://typespec.io/docs/libraries/http/rules/no-content-type-optionality-mismatch",
  docs: fileRef.fromPackageRoot("src/rules/no-content-type-optionality-mismatch.md"),
  messages: {
    default:
      "The optionality of the Content-type header must match the optionality of the associated request body.",
  },
  create(context) {
    return {
      operation: (op: Operation) => {
        const parametersType = op.parameters;
        if (!parametersType || parametersType.kind !== "Model") {
          return;
        }

        const [httpProperties] = resolvePayloadProperties(
          context.program,
          parametersType,
          Visibility.Read,
          HttpPayloadDisposition.Request,
        );

        const contentTypeProperty = httpProperties.find((p) => p.kind === "contentType");
        const bodyProperty = httpProperties.find((p) => p.kind === "body" || p.kind === "bodyRoot");

        if (!contentTypeProperty || !bodyProperty) {
          return;
        }

        const contentTypeOptional = contentTypeProperty.property.optional;
        const bodyOptional = bodyProperty.property.optional;

        if (contentTypeOptional !== bodyOptional) {
          context.reportDiagnostic({
            target: contentTypeProperty.property,
          });
        }
      },
    };
  },
});
