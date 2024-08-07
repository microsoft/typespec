const operators = ["+", "#", ".", "/", ";", "?", "&"] as const;
type Operator = (typeof operators)[number];

export interface UriTemplateParameter {
  readonly name: string;
  readonly operator?: Operator;
  readonly modifier?: { type: "explode" } | { type: "prefix"; value: number };
}

export interface UriTemplate {
  readonly segments?: (string | UriTemplateParameter)[];
  readonly parameters: UriTemplateParameter[];
}

const uriTemplateRegex = /\{([^{}]+)\}|([^{}]+)/g;
const expressionRegex = /([^:*]*)(?::(\d+)|(\*))?/;

/**
 * Parse a URI template according to [RFC-6570](https://datatracker.ietf.org/doc/html/rfc6570#section-3.2.3)
 */
export function parseUriTemplate(template: string): UriTemplate {
  const parameters: UriTemplateParameter[] = [];
  const segments: (string | UriTemplateParameter)[] = [];
  const matches = template.matchAll(uriTemplateRegex);
  for (let [_, expression, literal] of matches) {
    if (expression) {
      let operator: Operator | undefined;
      if (operators.includes(expression[0] as any)) {
        operator = expression[0] as any;
        expression = expression.slice(1);
      }

      const items = expression.split(",");
      for (const item of items) {
        const match = item.match(expressionRegex)!;
        const name = match[1];
        const parameter: UriTemplateParameter = {
          name: name,
          operator,
          modifier: match[3]
            ? { type: "explode" }
            : match[2]
              ? { type: "prefix", value: Number(match[2]) }
              : undefined,
        };
        parameters.push(parameter);
        segments.push(parameter);
      }
    } else {
      segments.push(literal);
    }
  }
  return { segments, parameters };
}
