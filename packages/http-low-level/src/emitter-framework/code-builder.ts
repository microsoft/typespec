import { EmitEntity } from "./types.js";

export class Placeholder {
  #listeners: ((value: string) => void)[] = [];
  setValue(value: string) {
    for (const listener of this.#listeners) {
      listener(value);
    }
  }

  onValue(cb: (value:string) => void) {
    this.#listeners.push(cb);
  }
}

export class CodeBuilder {
  public segments: (string | Placeholder)[] = [];
  #placeholders: Set<Placeholder> = new Set();
  #listeners: ((value: string) => void)[] = [];

  #notifyComplete() {
    const value = this.segments.join("");
    for (const listener of this.#listeners) {
      listener(value);
    }
  }

  #setPlaceholderValue(ph: Placeholder, value: string) {
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

  onComplete(cb: (value: string) => void) {
    this.#listeners.push(cb);
  }

  pushLiteralSegment(segment: string) {
    if (this.#shouldConcatLiteral()) {
      this.segments[this.segments.length - 1] += segment;
    } else {
      this.segments.push(segment);
    }
  }

  pushPlaceholder(ph: Placeholder) {
    this.#placeholders.add(ph);

    ph.onValue((value) => {
      this.#setPlaceholderValue(ph, value);
    });

    this.segments.push(ph);
  }

  pushCodeBuilder(builder: CodeBuilder) {
    for (const segment of builder.segments) {
      this.push(segment);
    }
  }

  push(segment: CodeBuilder | Placeholder | string) {
    if (typeof segment === "string") {
      this.pushLiteralSegment(segment);
    } else if (segment instanceof CodeBuilder) {
      this.pushCodeBuilder(segment);
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
    return (
      this.segments.length > 0 &&
      typeof this.segments[this.segments.length - 1] === "string"
    );
  }
}

export function code(
  parts: TemplateStringsArray,
  ...substitutions: (EmitEntity | CodeBuilder | string)[]
): string | CodeBuilder {
  const builder = new CodeBuilder();

  for (const [i, literalPart] of parts.entries()) {
    builder.push(literalPart);
    if (i < substitutions.length) {
      const sub = substitutions[i];
      if (typeof sub === "string") {
        builder.push(sub);
      } else if (sub instanceof CodeBuilder) {
        builder.pushCodeBuilder(sub);
      } else if (sub.kind === "circular") {
        throw new Error("Circular reference!");
      } else {
        builder.push(sub.code);
      }
    }
  }

  return builder.reduce();
}