import BrowserOnly from "@docusaurus/BrowserOnly";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { ArrowCircleRight16Filled } from "@fluentui/react-icons";
import type CodeBlockDocusaurus from "@theme-original/CodeBlock";
import { Props } from "@theme/CodeBlock";
import type { CompilerOptions } from "@typespec/compiler";
import type { UrlStateStorage } from "@typespec/playground";
import type { PlaygroundSaveData } from "@typespec/playground/react";
import { AnchorHTMLAttributes, useEffect, useMemo, useState } from "react";
import style from "./tsp-tryit.module.css";

export const withTspPlayground = (Component: typeof CodeBlockDocusaurus) => {
  function WrappedComponent(props: Props) {
    if (props.className === "language-tsp" && props.metastring) {
      const config = findTryitConfig(props.metastring);
      if (config) {
        return (
          <div className={style["tryit-codeblock-container"]}>
            <PlaygroundTryItLink
              content={props.children as string}
              compilerOptions={config}
              className={style["tryit-container"]}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Try it</span>
              <ArrowCircleRight16Filled />
            </PlaygroundTryItLink>
            <Component {...props} />
          </div>
        );
      }
    }

    return <Component {...props} />;
  }

  return WrappedComponent;
};

const tryItRegex = /tryit(=".*")?/;
function findTryitConfig(metastring: string): CompilerOptions | undefined {
  const match = metastring.match(tryItRegex);
  if (!match) {
    return undefined;
  }
  const optionsString = match[0].split("tryit=")[1]?.slice(1, -1);
  if (!optionsString) {
    return {};
  }

  try {
    return JSON.parse(optionsString);
  } catch (e) {
    throw new Error(`Invalid tryit tsp config: ${optionsString}`);
  }
}

export interface CodeBlockWithTryItLink extends Props {
  component: typeof CodeBlockDocusaurus;
}

interface PlaygroundTryItLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  content: string;
  compilerOptions?: CompilerOptions;
}

const PlaygroundTryItLink = (props: PlaygroundTryItLinkProps) => {
  return <BrowserOnly children={() => <PlaygroundTryItLinkInternal {...props} />} />;
};

const PlaygroundTryItLinkInternal = ({
  content,
  compilerOptions,
  ...props
}: PlaygroundTryItLinkProps) => {
  const [storage, setStorage] = useState<UrlStateStorage<PlaygroundSaveData>>();
  useEffect(() => {
    import("@typespec/playground/react")
      .then(({ createStandalonePlaygroundStateStorage }) => {
        setStorage(createStandalonePlaygroundStateStorage());
      })
      // eslint-disable-next-line no-console
      .catch((x) => console.error(x));
  }, []);

  const baseUrl = useBaseUrl("/playground");
  const playgroundLink = useMemo(() => {
    return (
      storage &&
      baseUrl +
        "?" +
        storage.resolveSearchParams({
          content: content,
          options: compilerOptions,
          emitter: compilerOptions.emit?.[0],
        })
    );
  }, [storage, compilerOptions, content, baseUrl]);

  return <a {...props} href={playgroundLink}></a>;
};
