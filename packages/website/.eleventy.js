// @ts-check
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const syntaxhighlightPlugin = require("@11ty/eleventy-plugin-syntaxhighlight");
const cadlPrismDefinition = require("./cadl-prism-lang.js");

module.exports = (eleventyConfig) => {
  eleventyConfig.addPassthroughCopy("css");
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
  };
};
