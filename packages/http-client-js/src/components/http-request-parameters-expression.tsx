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
        // const itemRef: ay.Children = parameter.optional ? ay.code`${optionsParamRef}?` : null;
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
          return <ts.ObjectProperty name={`"${transportParamName}"`} value={paramValue} />;
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
 *    - We'd eventually get an api like this <InstancePropertyExpression instance={refkey(parameter) staticMember={refkey(property)}} />
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
  const accessSegments: ay.Children[] = []; // Renamed from 'chain' for clarity
  let isNullish = httpProperty.property.optional === true;
  const namePolicy = ay.useNamePolicy();
  const propertyApplicationName = namePolicy.getName(httpProperty.property.name, "property");

  // Handle client operation parameters, these are the parameters that are in the signature of the operation
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

  // There are Http Parameters that might be nested in other parameters, we need to figure out how to access them
  // from the client parameter.
  let currentParentPath = httpProperty.path.slice(0, -1);
  let isFirstNested = true; // Renamed from 'isFirst' for clarity
  while (currentParentPath.length) {
    const parentProperty = findHttpPropertyByPath(httpOperation, currentParentPath);
    if (!parentProperty) break;

    let joiner = ".";
    if (parentProperty.property.optional) {
      joiner = "?.";
      isNullish = true;
    }

    const parentName = namePolicy.getName(parentProperty.property.name, "property");
    accessSegments.unshift(joiner);

    if (isFirstNested && typeof parentName === "string") {
      // For the first nested property in the chain, use direct name
      isFirstNested = false;
      accessSegments.unshift(ay.code`${parentName}`);
    } else {
      // For deeper nested properties, use bracket notation
      accessSegments.unshift(`[${JSON.stringify(parentName)}]`);
    }

    currentParentPath = currentParentPath.slice(0, -1);
  }

  return {
    propertyName: propertyApplicationName,
    isNullish,
    fullExpression: (
      <>
        {ay.mapJoin(
          () => accessSegments,
          (element) => element,
        )}
        {propertyApplicationName}
      </>
    ),
    leadingExpression: (
      <>
        {ay.mapJoin(
          () => accessSegments.slice(0, -1),
          (element) => element,
        )}
      </>
    ),
  };
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
