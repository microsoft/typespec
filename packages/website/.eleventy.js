module.exports = (eleventyConfig) => {
    eleventyConfig.addPassthroughCopy("css");
    return {
        markdownTemplateEngine: 'njk',
        dataTemplateEngine: 'njk',
        htmlTemplateEngine: 'njk',
        dir: {
            input: "src",
            output: "_website",
        }
    };
};