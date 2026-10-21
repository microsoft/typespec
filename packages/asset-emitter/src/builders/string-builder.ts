import { Placeholder } from "../placeholder.js";
import type { EmitEntity } from "../types.js";

/**
 * Assemble text while retaining unresolved placeholders for circular references.
 * Resolution replaces segments in place and notifies listeners when no pending
 * placeholders remain. Call `reduce` to obtain immediate text when nothing is pending.
 */
export class StringBuilder extends Placeholder<string> {
  /** Ordered text and pending values; mutate through push methods to maintain placeholder tracking. */
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

  /** Append text, coalescing it with the preceding segment when that segment is also text. */
  pushLiteralSegment(segment: string) {
    if (this.#shouldConcatLiteral()) {
      this.segments[this.segments.length - 1] += segment;
    } else {
      this.segments.push(segment);
    }
  }

  /**
   * Append an unresolved value and subscribe to replace its occurrences when it publishes.
   * Register before the placeholder is resolved; Placeholder does not replay earlier values.
   */
  pushPlaceholder(ph: Placeholder<string>) {
    this.#placeholders.add(ph);

    ph.onValue((value) => {
      this.#setPlaceholderValue(ph, value);
    });

    this.segments.push(ph);
  }

  /**
   * Append the other builder's current segments, sharing their placeholders.
   * Later segment additions to the other builder are not copied.
   */
  pushStringBuilder(builder: StringBuilder) {
    for (const segment of builder.segments) {
      this.push(segment);
    }
  }

  /** Append text or a pending value; nested builders are flattened into their current segments. */
  push(segment: StringBuilder | Placeholder<string> | string) {
    if (typeof segment === "string") {
      this.pushLiteralSegment(segment);
    } else if (segment instanceof StringBuilder) {
      this.pushStringBuilder(segment);
    } else {
      this.pushPlaceholder(segment);
    }
  }

  /** Return joined text if no placeholders are pending, otherwise return this builder for deferred resolution. */
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

/**
 * Interpolate emitted string output without losing deferred circular references.
 * Unwraps declarations and raw code, flattens nested builders, and treats no-emit
 * and circular sentinels as empty text. Returns a string when all segments are
 * ready, otherwise a builder that publishes the completed text.
 */
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
