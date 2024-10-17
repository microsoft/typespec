import { definePlugin } from "@expressive-code/core";
import { h } from "@expressive-code/core/hast";
import { createUrlStateStorage } from "@typespec/playground/state-storage";

export default function (playgroundUrl) {
  const storage = createUrlStateStorage({
    content: {
      queryParam: "c",
      compress: "lz-base64",
    },
    emitter: {
      queryParam: "e",
    },
    options: {
      type: "object",
      queryParam: "options",
    },
    sampleName: {
      queryParam: "sample",
    },
  });
  function resolvePlaygroundLink(content, compilerOptions) {
    return (
      playgroundUrl +
      "?" +
      storage.resolveSearchParams({
        content: content,
        options: compilerOptions,
        emitter: compilerOptions.emit?.[0],
      })
    );
  }

  return definePlugin({
    name: "tsp-try-it",
    baseStyles: `
      .tryit-codeblock-container {
        position: relative;
      }

      .tryit-link {
        display: flex;
        cursor: pointer;
        align-items: center;
        justify-content: space-between;
        background-color: var(--colorBrandBackground);
        padding: 0.4rem;
        text-decoration: none;
        color: var(--colorNeutralForegroundOnBrand);
      }

      .tryit-link:hover {
        text-decoration: none;
        color: var(--colorNeutralForegroundOnBrand);
        background-color: var(--colorBrandBackgroundHover);
      }
    `,
    hooks: {
      postprocessRenderedBlock: ({ codeBlock, renderData }) => {
        const { metaOptions } = codeBlock;
        const tryitStr = metaOptions.getString("tryit");
        if (tryitStr === undefined) {
          return;
        }

        const compilerOptions = JSON.parse(tryitStr);
        const extraElements = [];

        extraElements.push(
          h(
            "a",
            {
              className: "tryit-link",
              title: "Try it",
              href: resolvePlaygroundLink(codeBlock.code, compilerOptions),
            },
            ["Try it"],
          ),
        );

        renderData.blockAst = h(
          "div",
          {
            className: ["tryit-codeblock-container"],
          },
          [...extraElements, renderData.blockAst],
        );
      },
    },
  });
}
