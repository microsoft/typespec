// @ts-check
const syntaxhighlightPlugin = require("@11ty/eleventy-plugin-syntaxhighlight");
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

  eleventyConfig.addPlugin(syntaxhighlightPlugin, {
    init: ({ Prism }) => {
      Prism.languages.cadl = cadlPrismDefinition;
    },
  });

  eleventyConfig.addPlugin((config) => {
    const syntaxHighligher = config.markdownHighlighter;
    config.addMarkdownHighlighter((str, language) => {
      if (language === "mermaid") {
        return `{MERMAID}${str}{ENDMERMAID}`;
      }
      if (syntaxHighligher) {
        return syntaxHighligher(str, language);
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
  eleventyConfig.addShortcode("doc", (docName) => {
    if (!docName) {
      throw new Error("The docName must be specified");
    }

    const page = docPages.find((x) => x.data.id === docName);
    if (page === undefined) {
      throw new Error(`Cannot find page with id "${docName}"`);
    }
    const url = eleventyConfig.getFilter("url");
    return url(page.url);
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
