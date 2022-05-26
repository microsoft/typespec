const MAX_DEPTH = 2;

export function inspect(obj: unknown): string {
  return formatValue({ depth: 0 }, obj);
}
interface InspectContext {
  depth: number;
}

function formatValue(ctx: InspectContext, obj: unknown) {
  switch (typeof obj) {
    case "undefined":
      return "undefined";
    case "string":
      return `"${obj}"`;
    case "number":
    case "bigint":
    case "boolean":
    case "symbol":
      return obj.toString();
    case "object":
      if (obj === null) {
        return "null";
      }
      return formatObject(ctx, obj);
    default:
      return "?";
  }
}

function formatObject(ctx: InspectContext, obj: object): string {
  if (ctx.depth > MAX_DEPTH) {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return formatArray(ctx, obj);
  }

  const props = Object.entries(obj).map(([k, v]) => {
    return ` `.repeat(ctx.depth) + `${k}: ${formatValue({ ...ctx, depth: ctx.depth + 1 }, v)}`;
  });

  return ["{", ...props, "}"].join("\n");
}

function formatArray(ctx: InspectContext, obj: unknown[]): string {
  if (ctx.depth > MAX_DEPTH) {
    return obj.toString();
  }

  const items = obj.map((v) => {
    return ` `.repeat(ctx.depth) + `${formatValue({ ...ctx, depth: ctx.depth + 1 }, v)}`;
  });

  return ["[", ...items, "]"].join("\n");
}
