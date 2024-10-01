import { LightTheme } from "@site/src/prism/light";
import typespecPrismDefinition from "@site/src/prism/typespec-lang-prism";
import clsx from "clsx";
import { Highlight, Prism, themes } from "prism-react-renderer";
import { useColorMode } from "../docusaurus/core/theme-common";
import style from "./prism-code-block.module.css";

Prism.languages.tsp = typespecPrismDefinition;
Prism.languages.typespec = typespecPrismDefinition;

const pickedThemes = {
  light: LightTheme,
  dark: themes.oneDark,
};
export const CodeBlock = (props: any) => {
  const { colorMode } = useColorMode();

  const theme = pickedThemes[colorMode];
  return (
    <Highlight
      {...props}
      className={clsx(style["code-block"], props.className)}
      theme={theme}
      code={props.children}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={clsx(className)} style={style}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
};
