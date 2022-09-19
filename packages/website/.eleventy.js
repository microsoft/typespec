// @ts-check
const syntaxhighlightPlugin = require("@11ty/eleventy-plugin-syntaxhighlight");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const cadlPrismDefinition = require("./cadl-prism-lang.js");
const { findNavigationEntries } = require("./1tty-utils/navigation.js");
const { renderMermaid } = require("./1tty-utils/mermaid.js");
const feather = require("feather-icons");
const prNumber = process.env["SYSTEM_PULLREQUEST_PULLREQUESTNUMBER"];

module.exports = (eleventyConfig) => {
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy({
    "node_modules/prism-themes/themes/prism-one-light.css": "css/themes/prism-one-light.css",
  });

  const position = {
    false: "push",
    true: "unshift",
  };

  const linkIcon = feather.icons["link"].toSvg({});
  const renderPermalink = (slug, opts, state, idx) => {
    const space = () =>
      Object.assign(new state.Token("text", "", 0), {
        content: " ",
      });

    const linkTokens = [
      Object.assign(new state.Token("link_open", "a", 1), {
        attrs: [
          ["class", opts.permalinkClass],
          ["href", opts.permalinkHref(slug, state)],
        ],
      }),
      Object.assign(new state.Token("html_block", "", 0), {
        content: `<span aria-hidden="true" class="header-anchor__symbol">${linkIcon}</span>
        <span class="screen-reader-only">Direct link to this section</span>`,
      }),
      new state.Token("link_close", "a", -1),
    ];

    if (opts.permalinkSpace) {
      linkTokens[position[!opts.permalinkBefore]](space());
    }
    state.tokens[idx + 1].children[position[opts.permalinkBefore]](...linkTokens);
  };

  const markdownItOptions = {
    html: true,
  };

  const markdownItAnchorOptions = {
    permalink: true,
    renderPermalink,
  };

  // @ts-ignore
  const markdownLib = markdownIt(markdownItOptions).use(markdownItAnchor, markdownItAnchorOptions);

  eleventyConfig.setLibrary("md", markdownLib);
  eleventyConfig.addPlugin(syntaxhighlightPlugin, {
    init: ({ Prism }) => {
      Prism.languages.cadl = cadlPrismDefinition;
    },
  });

  eleventyConfig.addPlugin((config) => {
    const syntaxHighlighter = config.markdownHighlighter;
    config.addMarkdownHighlighter((str, language) => {
      if (language === "mermaid") {
        return `{MERMAID}${str}{ENDMERMAID}`;
      }
      if (syntaxHighlighter) {
        return syntaxHighlighter(str, language);
      }
      return `<pre class="${language}">${str}</a>`;
    });
  });

  eleventyConfig.addTransform("rendermermaid", async (content, outputPath) => {
    // Eleventy 1.0+: use this.inputPath and this.outputPath instead
    if (outputPath && outputPath.endsWith(".html")) {
      const convertPromises = [];
      const temp = content.replace(/{MERMAID}([\s\S]+){ENDMERMAID}/gm, (match, content) => {
        const index = convertPromises.length;
        convertPromises.push(renderMermaid(content));
        return `{convertingmermaid:${index}}`;
      });
      const convert = await Promise.all(convertPromises);
      return temp.replace(/{convertingmermaid:(\d+)}/g, (match, index) => {
        return convert[index];
      });
    }

    return content;
  });

  eleventyConfig.addFilter("cadlNavigation", findNavigationEntries);

  eleventyConfig.addShortcode("icon", (iconName, attributes = {}) => {
    if (!iconName) {
      throw new Error("The iconName must be specified");
    }

    attributes = { ...attributes };

    return feather.icons[iconName].toSvg(attributes);
  });

  let docPages;
  eleventyConfig.addCollection("docPages", (collectionApi) => {
    docPages = collectionApi.getAll().filter((x) => x.data.id);
    return docPages;
  });
  eleventyConfig.addShortcode("doc", (docName, anchor) => {
    if (!docName) {
      throw new Error("The docName must be specified");
    }

    const page = docPages.find((x) => x.data.id === docName);
    if (page === undefined) {
      throw new Error(`Cannot find page with id "${docName}"`);
    }
    const url = eleventyConfig.getFilter("url");
    const resolvedUrl = url(page.url);
    return anchor ? `${resolvedUrl}#${anchor}` : resolvedUrl;
  });

  return {
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dir: {
      input: "src",
      output: "dist",
    },
    pathPrefix: prNumber ? `/prs/${prNumber}/` : "/",
  };
};
