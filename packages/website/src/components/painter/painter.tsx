import { mergeClasses } from "@fluentui/react-components";
import { ReactNode } from "react";
import style from "./painter.module.css";

export interface Painter {
  (...content: ReactNode[]): React.JSX.Element;
  readonly line: this;
  readonly brand: this;
  readonly secondary: this;
  readonly underline: this;
}

interface PainterOptions {
  color?: "brand" | "secondary";
  line?: boolean;
  underline?: boolean;
}

const colors = ["brand", "secondary"] as const;
const modifiers = ["line", "underline"] as const;

function createPainter(): Painter {
  return painterFactory({});
}

function painterFactory(options: PainterOptions): Painter {
  const fn = (...children: ReactNode[]) => {
    const cls = mergeClasses(
      style[`color-${options.color}`],
      ...modifiers.map((x) => (options[x] ? style[`mod-${x}`] : undefined))
    );
    const content = <span className={cls}>{children}</span>;
    return options.line ? <div>{content}</div> : content;
  };
  const styles = {};
  for (const color of colors) {
    styles[color] = {
      get() {
        return painterFactory({ ...options, color });
      },
    };
  }
  for (const modifier of modifiers) {
    styles[modifier] = {
      get() {
        return painterFactory({ ...options, [modifier]: true });
      },
    };
  }

  Object.defineProperties(fn, styles);
  return fn as any;
}

/**
 * Helper to highlight custom code.
 *
 * @example
 * ```tsx
 * [
 *  P.line("Hello ", P.brand("world")),
 *  P.line(P.secondary.underline("Hello back"))
 * ];
 * ```
 */
export const P = createPainter();
