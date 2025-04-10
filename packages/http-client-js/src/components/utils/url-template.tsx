import * as ts from "@alloy-js/typescript";
import { ModelProperty } from "@typespec/compiler";
import { useTransformNamePolicy } from "@typespec/emitter-framework";
import { uriTemplateLib } from "../external-packages/uri-template.js";

/**
 * Interface defining the properties required by the UrlTemplate component.
 *
 * @property {string} template - The URI template string to be parsed.
 * @property {ModelProperty[]} parameters - An array of model properties to substitute in the URI template.
 */
export interface UrlTemplateProps {
  template: string;
  parameters: ModelProperty[];
}

/**
 * UrlTemplate function component.
 *
 * This component constructs a URL by parsing a URI template and expanding it with parameters.
 * It uses a naming policy to transform model property names appropriately, mapping each property
 * to an object expression that pairs its transport name with its application name.
 *
 * The expanded URL is assigned to a variable declaration named "url".
 *
 * @param {UrlTemplateProps} props - The component properties including the template and parameters.
 * @returns A TypeScript variable declaration containing the expanded URL.
 */
export function UrlTemplate(props: UrlTemplateProps) {
  // Retrieve the naming policy used to transform property names
  const namer = useTransformNamePolicy();

  // Create an array of object expressions mapping each property.
  // Each object maps the transformed transport name to its application name.
  const params = props.parameters.map((p) => {
    return (
      <ts.ObjectExpression>
        "{namer.getTransportName(p)}": {namer.getApplicationName(p)}
      </ts.ObjectExpression>
    );
  });

  // Parse the given URI template and expand it using the constructed parameters.
  // The resulting URL string is then declared as a variable named "url".
  return (
    <ts.VarDeclaration name="url" type="string">
      {uriTemplateLib.parse}({JSON.stringify(props.template)}).expand({params})
    </ts.VarDeclaration>
  );
}
