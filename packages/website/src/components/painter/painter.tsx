import clsx from "clsx";
import { Fragment, ReactNode } from "react";
import style from "./painter.module.css";

export interface Painter {
  (...content: ReactNode[]): React.JSX.Element;
  readonly line: this;
  readonly brand: this;
  readonly secondary: this;
  readonly underline: this;
}

interface PainterOptions {
  color?: "brand" | "secondary" | "warning";
  line?: boolean;
  underline?: boolean;
}

const colors = ["brand", "secondary", "warning"] as const;
const modifiers = ["line", "underline"] as const;

function createPainter(): Painter {
  return painterFactory({});
}

function painterFactory(options: PainterOptions): Painter {
  const fn = (...children: ReactNode[]) => {
    const cls = clsx(
      style[`color-${options.color}`],
      ...modifiers.map((x) => (options[x] ? style[`mod-${x}`] : undefined)),
    );
    const content = (
      <span className={cls}>
        {children.map((x, i) => (
          <Fragment key={i}>{x}</Fragment>
        ))}
      </span>
    );
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

export interface PainterProps {
  content: string;
}

const painterTagRegex = /\[([a-zA-Z.]+)\](.*)\[\/([a-zA-Z.]+)]/g;
export const Painter = ({ content }: PainterProps) => {
  const replaced = content.matchAll(painterTagRegex);
  const result = [];
  let lastIndex = 0;
  for (const item of replaced) {
    const [fullMatch, openTag, matchContent, closeTag] = item;

    result.push(content.substring(lastIndex, item.index));
    lastIndex = item.index + fullMatch.length;

    if (openTag === closeTag) {
      const segments = openTag.split(".");
      let p = P;
      for (const segment of segments) {
        p = p[segment];
      }
      result.push(p(matchContent));
    } else {
      result.push(fullMatch);
    }
  }
  result.push(content.substring(lastIndex));
  return result;
};
