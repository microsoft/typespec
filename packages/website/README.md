# TypeSpec Website

This repo contains the code for static web generator for TypeSpec project using docusaurus.io

Support libraries that enable the demo features are in the `packages/` directory. The demo code itself is in the `website/` directory.

## Instructions for editing or contributing to this website

### Running the website

To get started with the website, run the following npm commands

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

`./sidebars.js`
