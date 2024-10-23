// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

/**
 * Destructures a name into its components.
 *
 * The following case conventions are supported:
 * - PascalCase (["pascal", "case"])
 * - camelCase (["camel", "case"])
 * - snake_case (["snake", "case"])
 * - kebab-case (["kebab", "case"])
 * - dot.separated (["dot", "separated"])
 * - path/separated (["path", "separated"])
 * - double::colon::separated (["double", "colon", "separated"])
 * - space separated (["space", "separated"])
 *
 * - AND any combination of the above, or any other separators or combination of separators.
 *
 * @param name - a name in any case
 */
export function parseCase(name: string): ReCase {
  const components: string[] = [];

  let currentComponent = "";
  let inAcronym = false;

  for (let i = 0; i < name.length; i++) {
    const char = name[i];

    // cSpell:ignore presponse
    // Special case acronym handling. We want to treat acronyms as a single component,
    // but we also want the last capitalized letter in an all caps sequence to start a new
    // component if the next letter is lower case.
    // For example : "HTTPResponse" => ["http", "response"]
    //             : "OpenAIContext" => ["open", "ai", "context"]
    //  but        : "HTTPresponse" (wrong) => ["htt", "presponse"]
    //  however    : "HTTP_response" (okay I guess) => ["http", "response"]

    // If the character is a separator or an upper case character, we push the current component and start a new one.
    if (char === char.toUpperCase() && !/[0-9]/.test(char)) {
      // If we're in an acronym, we need to check if the next character is lower case.
      // If it is, then this is the start of a new component.
      const acronymRestart =
        inAcronym && /[A-Z]/.test(char) && i + 1 < name.length && /[^A-Z]/.test(name[i + 1]);

      if (currentComponent.length > 0 && (acronymRestart || !inAcronym)) {
        components.push(currentComponent.trim());
        currentComponent = "";
      }
    }

    if (![":", "_", "-", ".", "/"].includes(char) && !/\s/.test(char)) {
      currentComponent += char.toLowerCase();
    }

    inAcronym = /[A-Z]/.test(char);
  }

  if (currentComponent.length > 0) {
    components.push(currentComponent);
  }

  return recase(components);
}

/**
 * An object allowing a name to be converted into various case conventions.
 */
export interface ReCase extends ReCaseUpper {
  /**
   * The components of the name with the first letter of each component capitalized and joined by an empty string.
   */
  readonly pascalCase: string;
  /**
   * The components of the name with the first letter of the second and all subsequent components capitalized and joined
   * by an empty string.
   */
  readonly camelCase: string;

  /**
   * Convert the components of the name into all uppercase letters.
   */
  readonly upper: ReCaseUpper;
}

interface ReCaseUpper {
  /**
   * The components of the name.
   */
  readonly components: readonly string[];

  /**
   * The components of the name joined by underscores.
   */
  readonly snakeCase: string;
  /**
   * The components of the name joined by hyphens.
   */
  readonly kebabCase: string;
  /**
   * The components of the name joined by periods.
   */
  readonly dotCase: string;
  /**
   * The components of the name joined by slashes.
   *
   * This uses forward slashes in the unix convention.
   */
  readonly pathCase: string;

  /**
   * Join the components with any given string.
   *
   * @param separator - the separator to join the components with
   */
  join(separator: string): string;
}

function recase(components: readonly string[]): ReCase {
  return Object.freeze({
    components,
    get pascalCase() {
      return components
        .map((component) => component[0].toUpperCase() + component.slice(1))
        .join("");
    },
    get camelCase() {
      return components
        .map((component, index) =>
          index === 0 ? component : component[0].toUpperCase() + component.slice(1),
        )
        .join("");
    },
    get snakeCase() {
      return components.join("_");
    },
    get kebabCase() {
      return components.join("-");
    },
    get dotCase() {
      return components.join(".");
    },
    get pathCase() {
      return components.join("/");
    },

    get upper() {
      return recase(components.map((component) => component.toUpperCase()));
    },

    join(separator: string) {
      return components.join(separator);
    },
  });
}
