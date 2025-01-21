import { definePlugin } from "@expressive-code/core";
import { h } from "@expressive-code/core/hast";
import { createUrlStateStorage } from "@typespec/playground/state-storage";

export default function (playgroundUrl: string) {
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
  function resolvePlaygroundLink(content: any, compilerOptions: any) {
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
        height: 34px;
        display: flex;
        align-items: center;
        padding: 0 0.5rem;
      }

      .tryit-link.with-title {
        position: absolute;
        z-index: 100;
        top: 0px;
        right: 0px;
        height: 34px;
      }
      .tryit-link:not(.with-title) {
        position: absolute;
        z-index: 100;
        bottom: 0px;
        right: 0px;
        height: 34px;
      }
        

      .tryit-link {
        text-decoration: none;
        color: var(--colorPaletteGreenBackground3);
      }

      .play {
        height: 20px;
        padding-left: 2px;
        width: 20px;
        fill: currentColor;
        stroke: currentColor;
        transform: rotate(90deg)
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
        const hasTitle = metaOptions.getString("title");
        extraElements.push(
          h(
            "a",
            {
              className: ["tryit-link", hasTitle && "with-title"].filter((x) => x).join(" "),
              title: "Try it in the playground",
              href: resolvePlaygroundLink(codeBlock.code, compilerOptions),
              target: "_blank",
              rel: "noopener noreferrer",
            },
            [playSvg, "Try it"],
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

const playSvg = h(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    className: ["play"],
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    stroke: "currentColor",
    "stroke-width": "1.34",
  },
  [
    h("path", {
      d: "M12.0001 3.75317L21.5509 20.2501H2.44922L12.0001 3.75317ZM5.05089 18.7501H18.9492L12.0001 6.74697L5.05089 18.7501Z",
    }),
  ],
);
