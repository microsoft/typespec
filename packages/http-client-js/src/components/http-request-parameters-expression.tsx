import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { useTransformNamePolicy } from "@typespec/emitter-framework";
import { HttpOperation, HttpProperty } from "@typespec/http";
import { getDefaultValue, hasDefaultValue } from "../utils/parameters.jsx";
import { JsonTransform } from "./transforms/json/json-transform.jsx";
export interface HttpRequestParametersExpressionProps {
  httpOperation: HttpOperation;
  optionsParameter: ay.Children;
  parameters?: HttpProperty[];
  children?: ay.Children;
}

export function HttpRequestParametersExpression(props: HttpRequestParametersExpressionProps) {
  const parameters: ay.Children[] = [];
  const transformNamer = useTransformNamePolicy();

  if (props.children || (Array.isArray(props.children) && props.children.length)) {
    parameters.push(<>{props.children},</>);
  }

  if (!props.parameters && parameters.length) {
    return <ts.ObjectExpression>{parameters}</ts.ObjectExpression>;
  } else if (!props.parameters) {
    return <ts.ObjectExpression />;
  }

  const optionsParamRef = props.optionsParameter ?? "options";
  const members = (
    <ay.For each={props.parameters} line comma>
      {(httpProperty) => {
        const defaultValue = getDefaultValue(httpProperty);
        const propertyExpression = buildMemberChainExpression(
          props.httpOperation,
          httpProperty,
          optionsParamRef,
        );
        const transportParamName = transformNamer.getTransportName(httpProperty.property);

        if (defaultValue) {
          const paramValue = (
            <>
              {propertyExpression.fullExpression}
              {` ?? ${defaultValue}`}
            </>
          );
          return (
            <ay.NamePolicyContext.Provider value={{ getName: (n) => n }}>
              <ts.ObjectProperty name={transportParamName} value={paramValue} />
            </ay.NamePolicyContext.Provider>
          );
        }

        if (propertyExpression.isNullish) {
          return ay.code`
        ...(${propertyExpression.fullExpression} && {${(<JsonTransform itemRef={propertyExpression.leadingExpression} type={httpProperty.property} target="transport" />)}})
      `;
        } else {
          return (
            <JsonTransform
              itemRef={propertyExpression.leadingExpression}
              type={httpProperty.property}
              target="transport"
            />
          );
        }
      }}
    </ay.For>
  );

  parameters.push(members);

  return <ts.ObjectExpression>{parameters}</ts.ObjectExpression>;
}

interface MemberChainExpression {
  propertyName: string;
  isNullish: boolean;
  fullExpression: ay.Children;
  leadingExpression?: ay.Children;
}

/**
 * Builds the member chain expression for potentially nested HTTP parameters.
 * This logic will be simplified and made more robust once a couple of changes land in Alloy.
 *    - Support refkeys on interface members
 *    - Support for conditional chaining on ts.MemberChainExpression
 *    - Eventually we'll have an API like:
 * @example
 * ```tsx
 *        <InstancePropertyExpression
 *            instance={refkey(parameter)}
 *            staticMember={refkey(property)}
 *        />
 * ```
 * @param httpOperation - The HttpOperation containing parameters.
 * @param httpProperty - The current HttpProperty to build an access path for.
 * @param optionsParamRef - Reference to the user's main options parameter.
 * @returns The full nested expression, leading expression, nullish flag, and final property name.
 */
function buildMemberChainExpression(
  httpOperation: HttpOperation,
  httpProperty: HttpProperty,
  optionsParamRef?: ay.Children,
): MemberChainExpression {
  const segments: ay.Children[] = [];
  let isNullish = httpProperty.property.optional === true;
  const namePolicy = ay.useNamePolicy();
  const propertyApplicationName = namePolicy.getName(httpProperty.property.name, "property");

  // If the property is at the top level, return early
  if (httpProperty.path.length === 1) {
    if (httpProperty.property.optional || hasDefaultValue(httpProperty)) {
      return {
        propertyName: propertyApplicationName,
        isNullish,
        fullExpression: ay.code`${optionsParamRef}?.${propertyApplicationName}`,
        leadingExpression: ay.code`${optionsParamRef}`,
      };
    }
    return {
      propertyName: propertyApplicationName,
      isNullish,
      fullExpression: propertyApplicationName,
    };
  }

  // Build access segments for nested properties.
  let currentPath = httpProperty.path.slice(0, -1);
  while (currentPath.length > 0) {
    const parentProperty = findHttpPropertyByPath(httpOperation, currentPath);
    if (!parentProperty) {
      break;
    }

    // Use optional chaining if the parent is optional.
    const joiner = parentProperty.property.optional ? "?." : ".";
    if (parentProperty.property.optional) {
      isNullish = true;
    }

    const parentName = namePolicy.getName(parentProperty.property.name, "property");

    // Unshift the joiner first
    segments.unshift(joiner);

    // Use direct property access if possible.
    if (isValidIdentifier(parentName)) {
      segments.unshift(ay.code`${parentName}`);
    } else {
      // For non-valid identifiers, use bracket notation.
      segments.unshift(`[${JSON.stringify(parentName)}]`);
    }

    // Remove the last element to move one level up.
    currentPath = currentPath.slice(0, -1);
  }

  const fullExpression = (
    <>
      <ay.List children={segments} />
      {propertyApplicationName}
    </>
  );
  const leadingExpression = <ay.List children={segments.slice(0, -1)} />;

  return {
    propertyName: propertyApplicationName,
    isNullish,
    fullExpression,
    leadingExpression,
  };
}

function isValidIdentifier(name: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

function findHttpPropertyByPath(
  httpOperation: HttpOperation,
  path: (string | number)[],
): HttpProperty | undefined {
  for (const property of httpOperation.parameters.properties) {
    // Check if the property path matches the given path
    if (JSON.stringify(property.path) === JSON.stringify(path)) {
      return property;
    }
  }
  return undefined;
}
