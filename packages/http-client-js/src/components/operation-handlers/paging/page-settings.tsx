/**
 * This file defines helper functions and a component to generate TypeScript interface declarations
 * for page settings used in HTTP operations. It selectively picks accepted paging properties from a
 * PagingOperation and generates an interface that outlines the structure for page settings.
 */

import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { PagingOperation, PagingProperty } from "@typespec/compiler";
import * as ef from "@typespec/emitter-framework/typescript";
import { HttpOperation } from "@typespec/http";

/**
 * Interface for the properties required by the PageSettingsDeclaration component.
 * Contains the HTTP operation for which the page settings interface is declared, and
 * the paging operation containing the input paging settings.
 */
export interface PageSettingsProps {
  operation: HttpOperation;
  pagingOperation: PagingOperation;
}

/**
 * Generates a reference key string for the page settings type associated with the given HTTP operation.
 * This key is used to uniquely identify the page settings within the context of the overall operation.
 *
 * @param operation - The HTTP operation for which to generate the reference key.
 */
export function getPageSettingsTypeRefkey(operation: HttpOperation) {
  return ay.refkey(operation, "page-settings");
}

/**
 * Filters and returns the paging properties from a PagingOperation that are considered valid for page settings.
 * Only properties that match one of the accepted settings ("continuationToken", "offset", "pageSize", "pageIndex")
 * are returned.
 *
 * @param pagingOperation - The paging operation containing various paging settings.
 * @returns An array of PagingProperty objects that are accepted as valid page settings.
 */
export function getPageSettingProperties(pagingOperation: PagingOperation) {
  // Retrieve the defined paging settings from the operation
  const definedSettings = pagingOperation.input;
  // Define which settings are acceptable for page configuration
  const acceptedSettings = ["continuationToken", "offset", "pageSize", "pageIndex"];
  const settingProperties: PagingProperty[] = [];

  // Iterate over each setting in the defined settings and select those that are accepted
  for (const key in definedSettings) {
    const property = definedSettings[key as keyof typeof definedSettings];
    // Check if the key is accepted and the property exists (is truthy)
    if (acceptedSettings.includes(key) && !!property) {
      settingProperties.push(property);
    }
  }
  return settingProperties;
}

/**
 * Generates a TypeScript interface declaration for page settings by utilizing the provided HTTP operation and paging operation details.
 * The generated interface includes only the accepted paging properties, declared as optional members.
 *
 * @param props - An object containing the HTTP operation and the paging operation.
 * @returns A JSX element representing the interface declaration of the page settings.
 */
export function PageSettingsDeclaration(props: PageSettingsProps) {
  // Get the naming policy utility to standardize the generated interface's name
  const namePolicy = ts.useTSNamePolicy();

  // Generate the interface name using the operation's name and appending "PageSettings"
  const interfaceName = namePolicy.getName(
    props.operation.operation.name + "PageSettings",
    "interface",
  );

  // Extract only accepted page setting properties from the paging operation input
  const settingProperties = getPageSettingProperties(props.pagingOperation);

  // Render the TypeScript interface declaration with the extracted page settings as interface members
  return (
    <ts.InterfaceDeclaration
      export
      name={interfaceName}
      refkey={getPageSettingsTypeRefkey(props.operation)}
    >
      <ay.For each={settingProperties} line>
        {(parameter) => (
          <ts.InterfaceMember
            name={parameter.property.name}
            optional
            type={<ef.TypeExpression type={parameter.property.type} />}
          />
        )}
      </ay.For>
    </ts.InterfaceDeclaration>
  );
}
