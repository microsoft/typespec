// @ts-check
const syntaxhighlightPlugin = require("@11ty/eleventy-plugin-syntaxhighlight");
const cadlPrismDefinition = require("./cadl-prism-lang.js");
const { findNavigationEntries } = require("./1tty-utils/navigation.js");

const prNumber = process.env["SYSTEM_PULLREQUEST_PULLREQUESTNUMBER"];

module.exports = (eleventyConfig) => {
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy({
    "node_modules/prism-themes/themes/prism-one-light.css": "css/themes/prism-one-light.css",
  });

  eleventyConfig.addPlugin(syntaxhighlightPlugin, {
    init: ({ Prism }) => {
      Prism.languages.cadl = cadlPrismDefinition;
    },
  });

  eleventyConfig.addFilter("cadlNavigation", findNavigationEntries);

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
