// @ts-check
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const syntaxhighlightPlugin = require("@11ty/eleventy-plugin-syntaxhighlight");
const cadlPrismDefinition = require("./cadl-prism-lang.js");

const prNumber = process.env["SYSTEM_PULLREQUEST_PULLREQUESTNUMBER"];

module.exports = (eleventyConfig) => {
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy({
    "node_modules/prism-themes/themes/prism-one-light.css": "css/themes/prism-one-light.css",
  });

  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(syntaxhighlightPlugin, {
    init: ({ Prism }) => {
      Prism.languages.cadl = cadlPrismDefinition;
    },
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
