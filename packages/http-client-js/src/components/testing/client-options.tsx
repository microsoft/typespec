/**
 * This module provides options for enabling client-side testing configurations
 * in the Alloy JS emitter when a specific testing environment variable is set.
 *
 * It defines a ClientTestOptions component that conditionally provides testing options
 * and a helper function addClientTestOptions to insert these options into a given list
 * based on the configuration.
 */

import * as ay from "@alloy-js/core";

/**
 * Interface for properties of the ClientTestOptions component.
 * Currently empty because no properties are needed.
 */
export interface ClientTestOptions {}

/**
 * A component that conditionally provides test options for the client.
 * The testing options are only enabled when the environment variable TYPESPEC_JS_EMITTER_TESTING is "true".
 *
 * @param _props - Unused properties for the component.
 * @returns The testing options code snippet if testing is enabled; otherwise, null.
 */
export function ClientTestOptions(_props: ClientTestOptions) {
  // Check if the testing mode is enabled via environment variable.
  if (process.env.TYPESPEC_JS_EMITTER_TESTING !== "true") {
    return null; // Return null when testing mode is not enabled to avoid adding options.
  }

  // Return a code snippet with testing options using the Alloy JS "ay.code" template.
  return ay.code`
    allowInsecureConnection: true,
    retryOptions: {
      maxRetries: 1,
    }`;
}

/**
 * Adds the ClientTestOptions component into a list of options provided.
 * The options are added to either the start or the end of the list depending on the settings.
 * This function only adds options if testing mode is enabled via the environment.
 *
 * @param options - An array of Alloy JS child components or elements where test options should be added.
 * @param settings - An optional object that specifies where in the options list the test options should be inserted.
 *                   Defaults to { location: "front" }.
 */
export function addClientTestOptions(
  options: ay.Children[],
  settings: { location?: "front" | "back" } = { location: "front" },
) {
  // Only add test options if testing mode is enabled.
  if (process.env.TYPESPEC_JS_EMITTER_TESTING === "true") {
    // Create an instance of ClientTestOptions.
    const testOptions = <ClientTestOptions />;
    // If settings specify insertion at the front, unshift; otherwise, push to the end.
    if (settings.location === "front") {
      options.unshift(testOptions);
    } else {
      options.push(testOptions);
    }
  }
}
