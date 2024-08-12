import { fixLeadingNumber, removeSequentialDuplicates } from "@azure-tools/codegen";

export type Styler = (
  identifier: string | Array<string>,
  removeDuplicates: boolean | undefined,
  overrides: Record<string, string> | undefined
) => string;
type StylerWithUppercasePreservation = (
  identifier: string | Array<string>,
  removeDuplicates: boolean | undefined,
  overrides: Record<string, string> | undefined,
  maxUppercasePreserve: number | undefined
) => string;

function capitalize(s: string): string {
  return s ? `${s.charAt(0).toUpperCase()}${s.slice(1)}` : s;
}

function uncapitalize(s: string): string {
  return s ? `${s.charAt(0).toLowerCase()}${s.slice(1)}` : s;
}

function IsFullyUpperCase(identifier: string, maxUppercasePreserve: number) {
  const len = identifier.length;
  if (len > 1) {
    if (len <= maxUppercasePreserve && identifier === identifier.toUpperCase()) {
      return true;
    }

    if (len <= maxUppercasePreserve + 1 && identifier.endsWith("s")) {
      const i = identifier.substring(0, len - 1);
      if (i.toUpperCase() === i) {
        return true;
      }
    }
  }
  return false;
}

function deconstruct(
  identifier: string | Array<string>,
  maxUppercasePreserve: number
): Array<string> {
  if (Array.isArray(identifier)) {
    return [...identifier.flatMap((each) => deconstruct(each, maxUppercasePreserve))];
  }

  return `${identifier}`
    .replace(/([a-z]+)([A-Z])/g, "$1 $2") // Add a space in between camelCase words(e.g. fooBar => foo Bar)
    .replace(/(\d+)/g, " $1 ") // Adds a space after numbers(e.g. foo123 => foo123 bar)
    .replace(/\b([A-Z]+)([A-Z])s([^a-z])(.*)/g, "$1$2« $3$4") // Add a space after a plural upper cased word(e.g. MBsFoo => MBs Foo)
    .replace(/\b([A-Z]+)([A-Z])([a-z]+)/g, "$1 $2$3") // Add a space between an upper case word(2 char+) and the last capital case.(e.g. SQLConnection -> SQL Connection)
    .replace(/«/g, "s")
    .trim()
    .split(/[\W|_]+/)
    .map((each) => (IsFullyUpperCase(each, maxUppercasePreserve) ? each : each.toLowerCase()));
}

function wrap(
  prefix: string,
  postfix: string,
  style: StylerWithUppercasePreservation,
  maxUppercasePreserve: number
): Styler {
  if (postfix || prefix) {
    return (i, r, o) =>
      typeof i === "string" && typeof o === "object"
        ? o[i.toLowerCase()] || `${prefix}${style(i, r, o, maxUppercasePreserve)}${postfix}`
        : `${prefix}${style(i, r, o, maxUppercasePreserve)}${postfix}`;
  }
  return (i, r, o) => style(i, r, o, maxUppercasePreserve);
}

function applyFormat(
  normalizedContent: Array<string>,
  overrides: Record<string, string> = {},
  separator = "",
  formatter: (s: string, i: number) => string = (s, i) => s
) {
  return normalizedContent
    .map((each, index) => {
      if (Object.keys(overrides).includes(each.toLowerCase())) {
        const override = overrides[each.toLowerCase()];
        if (override) {
          return override;
        }
      }
      return formatter(each, index);
    })
    .join(separator);
}

function normalize(
  identifier: string | Array<string>,
  removeDuplicates = true,
  overrides: Record<string, string> = {},
  maxUppercasePreserve = 0
): Array<string> {
  if (!identifier || identifier.length === 0) {
    return [""];
  }
  return typeof identifier === "string"
    ? normalize(
        fixLeadingNumber(deconstruct(identifier, maxUppercasePreserve)),
        removeDuplicates,
        overrides,
        maxUppercasePreserve
      )
    : removeDuplicates
      ? removeSequentialDuplicates(identifier)
      : identifier;
}
export class Style {
  static select(style: any, fallback: Styler, maxUppercasePreserve: number): Styler {
    if (style) {
      const styles = /^([a-zA-Z0-9_]*?\+?)([a-zA-Z]+)(\+?[a-zA-Z0-9_]*)$/g.exec(
        style.replace(/\s*/g, "")
      );
      if (styles) {
        const prefix = styles[1] ? styles[1].substring(0, styles[1].length - 1) : "";
        const postfix = styles[3] ? styles[3].substring(1) : "";

        switch (styles[2]) {
          case "camelcase":
          case "camel":
            return wrap(prefix, postfix, Style.camel, maxUppercasePreserve);
          case "pascalcase":
          case "pascal":
            return wrap(prefix, postfix, Style.pascal, maxUppercasePreserve);
          case "snakecase":
          case "snake":
            return wrap(prefix, postfix, Style.snake, maxUppercasePreserve);
          case "uppercase":
          case "upper":
            return wrap(prefix, postfix, Style.upper, maxUppercasePreserve);
          case "kebabcase":
          case "kebab":
            return wrap(prefix, postfix, Style.kebab, maxUppercasePreserve);
          case "spacecase":
          case "space":
            return wrap(prefix, postfix, Style.space, maxUppercasePreserve);
        }
      }
    }
    return wrap("", "", fallback, maxUppercasePreserve);
  }

  static kebab(
    identifier: string | Array<string>,
    removeDuplicates = true,
    overrides: Record<string, string> = {},
    maxUppercasePreserve = 0
  ): string {
    return (
      (Object.keys(overrides).includes(<string>identifier) && overrides[<string>identifier]) ||
      applyFormat(
        normalize(identifier, removeDuplicates, overrides, maxUppercasePreserve),
        overrides,
        "-"
      ).replace(/([^\d])-(\d+)/g, "$1$2")
    );
  }

  static space(
    identifier: string | Array<string>,
    removeDuplicates = true,
    overrides: Record<string, string> = {},
    maxUppercasePreserve = 0
  ): string {
    return (
      (Object.keys(overrides).includes(<string>identifier) && overrides[<string>identifier]) ||
      applyFormat(
        normalize(identifier, removeDuplicates, overrides, maxUppercasePreserve),
        overrides,
        " "
      ).replace(/([^\d]) (\d+)/g, "$1$2")
    );
  }

  static snake(
    identifier: string | Array<string>,
    removeDuplicates = true,
    overrides: Record<string, string> = {},
    maxUppercasePreserve = 0
  ): string {
    return (
      (Object.keys(overrides).includes(<string>identifier) && overrides[<string>identifier]) ||
      applyFormat(
        normalize(identifier, removeDuplicates, overrides, maxUppercasePreserve),
        overrides,
        "_"
      ).replace(/([^\d])_(\d+)/g, "$1$2")
    );
  }

  static upper(
    identifier: string | Array<string>,
    removeDuplicates = true,
    overrides: Record<string, string> = {},
    maxUppercasePreserve = 0
  ): string {
    return (
      (Object.keys(overrides).includes(<string>identifier) && overrides[<string>identifier]) ||
      applyFormat(
        normalize(identifier, removeDuplicates, overrides, maxUppercasePreserve),
        overrides,
        "_",
        (each) => each.toUpperCase()
      ).replace(/([^\d])_(\d+)/g, "$1$2")
    );
  }

  static pascal(
    identifier: string | Array<string>,
    removeDuplicates = true,
    overrides: Record<string, string> = {},
    maxUppercasePreserve = 0
  ): string {
    return (
      (Object.keys(overrides).includes(<string>identifier) && overrides[<string>identifier]) ||
      applyFormat(
        normalize(identifier, removeDuplicates, overrides, maxUppercasePreserve),
        overrides,
        "",
        (each) => capitalize(each)
      )
    );
  }

  static camel(
    identifier: string | Array<string>,
    removeDuplicates = true,
    overrides: Record<string, string> = {},
    maxUppercasePreserve = 0
  ): string {
    return (
      (Object.keys(overrides).includes(<string>identifier) && overrides[<string>identifier]) ||
      applyFormat(
        normalize(identifier, removeDuplicates, overrides, maxUppercasePreserve),
        overrides,
        "",
        (each, index) =>
          index
            ? capitalize(each)
            : IsFullyUpperCase(each, maxUppercasePreserve)
              ? each
              : uncapitalize(each)
      )
    );
  }
}
