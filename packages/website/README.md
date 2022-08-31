# Cadl Website using 11Ty Static Website Generator

This repo contains the code for static web generator for Cadl project using Eleventy(11ty) static web generator. To get started with 11Ty visit https://www.11ty.dev.

Support libraries that enable the demo features are in the `packages/` directory. The demo code itself is in the `website/` directory.

## Instructions for editing or contributing to this website

### Running the website

To get started with the webiste, run the following npm commands

To build for production:

```bash
> npm run build
```

To run the site on the local server

```bash
> npm start
```

(Be careful, after starting the server, do not close it while building on the existing code. The server will help you while debugging as it shows any changes that is causing trouble in the code.)

### Adding an item on the navigation bar.

Items on the navigation bar are stored and maintained from the navbar.json file. To add or remove an item from the navigation bar, change the json from navbar.json. Check out where to find navbar.json file.

`.src/_data/navbar.json`

### Creating a new layout

There are some basic layout already developed in this repo. Check out some layouts, which are found in `.scr/_includes/layouts/`.

> The `Base.njk` layout is the main layout that includes the navigation bar, and body content(empty content to be altered later) and the footer.

> The "container.njk" layout has the exact same content as the base layout, except that it designed for the container files that are not already included in the template folder `(/_include)`

> The `continer.njk` layout uses the container layout and create the layout for tutorial page/ container of the website.

To create a new layout, add a new file in the \_include folder, and build from existing layouts or create whole new layout.

### Adding pictures or other folders to the source folder.

Checkout the file `.eleventy.js` in the source folder `.src/`. After creating the desired folders in the src folder, add the following line the file.

```bash
 module.exports = (eleventyConfig) => {
   eleventyConfig.addPassthroughCopy("folderName"); //change folderName with the name of your folder
 }
```
