import { Placeholder } from "../placeholder.js";
import { EmitEntity } from "../types.js";

export class StringBuilder extends Placeholder<string> {
  public segments: (string | Placeholder<string>)[] = [];
  #placeholders: Set<Placeholder<string>> = new Set();

  #notifyComplete() {
    const value = this.segments.join("");
    this.setValue(value);
  }

  #setPlaceholderValue(ph: Placeholder<string>, value: string) {
    for (const [i, segment] of this.segments.entries()) {
      if (segment === ph) {
        this.segments[i] = value;
      }
    }
    this.#placeholders.delete(ph);
    if (this.#placeholders.size === 0) {
      this.#notifyComplete();
    }
  }

  pushLiteralSegment(segment: string) {
    if (this.#shouldConcatLiteral()) {
      this.segments[this.segments.length - 1] += segment;
    } else {
      this.segments.push(segment);
    }
  }

  pushPlaceholder(ph: Placeholder<string>) {
    this.#placeholders.add(ph);

    ph.onValue((value) => {
      this.#setPlaceholderValue(ph, value);
    });

    this.segments.push(ph);
  }

  pushStringBuilder(builder: StringBuilder) {
    for (const segment of builder.segments) {
      this.push(segment);
    }
  }

  push(segment: StringBuilder | Placeholder<string> | string) {
    if (typeof segment === "string") {
      this.pushLiteralSegment(segment);
    } else if (segment instanceof StringBuilder) {
      this.pushStringBuilder(segment);
    } else {
      this.pushPlaceholder(segment);
    }
  }

  reduce() {
    if (this.#placeholders.size === 0) {
      return this.segments.join("");
    }

    return this;
  }

  #shouldConcatLiteral() {
    return this.segments.length > 0 && typeof this.segments[this.segments.length - 1] === "string";
  }
}

export function code(
  parts: TemplateStringsArray,
  ...substitutions: (EmitEntity<string> | string | Placeholder<string> | StringBuilder)[]
): StringBuilder | string {
  const builder = new StringBuilder();

  for (const [i, literalPart] of parts.entries()) {
    builder.push(literalPart);
    if (i < substitutions.length) {
      const sub = substitutions[i];
      if (typeof sub === "string") {
        builder.push(sub);
      } else if (sub instanceof StringBuilder) {
        builder.pushStringBuilder(sub);
      } else if (sub instanceof Placeholder) {
        builder.pushPlaceholder(sub);
      } else {
        switch (sub.kind) {
          case "circular":
          case "none":
            builder.pushLiteralSegment("");
            break;
          default:
            builder.push(sub.value);
        }
      }
    }
  }

  return builder.reduce();
}
